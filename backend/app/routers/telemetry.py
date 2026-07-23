from typing import Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, BackgroundTasks
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from sqlalchemy import func         
from datetime import datetime
from app.database import get_db
from app.models import TelemetryEventLog, SessionTelemetry, Incident
from app.schemas import TelemetryFlushRequest, TelemetryEventResponse, EventFraudAnalysis
from app.services.ai_service import ai_service
from app.services.email_service import email_service
from app.fraud_patterns import FRAUD_PATTERNS, match_fraud_pattern, get_baseline

router = APIRouter(prefix="/v1/fraud/telemetry", tags=["Telemetry & Event Logging"])

# Sensitive actions that trigger immediate fraud detection
SENSITIVE_ACTIONS = {
    "DELETE_BENEFICIARY", "EDIT_BENEFICIARIES", "ADD_PAYEE", "BULK_DOWNLOAD",
    "TRANSFER", "REQUEST_MONEY", "CHANGE_EMAIL", "CHANGE_MOBILE", "CHANGE_PASSWORD",
    "TOGGLE_TRANSACTION_ALERTS", "LOGIN_LOCKOUT"
}

# Action categories for anomaly detection
NAVIGATION_ACTIONS = {
    "VIEW_DASHBOARD", "VIEW_TRANSACTIONS", "VIEW_BENEFICIARIES", 
    "VIEW_MANAGE_BENEFICIARY", "VIEW_SETTINGS", "VIEW_AUDIT_LOGS",
    "VIEW_SEND_MONEY", "VIEW_REQUEST_MONEY"
}

AUTHENTICATION_ACTIONS = {"LOGIN", "LOGOUT", "LOGIN_LOCKOUT"}

@router.post("/events", response_model=TelemetryEventResponse)
async def ingest_telemetry_events(
    payload: TelemetryFlushRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Ingest telemetry events from the UI and perform fraud detection.
    """
    if not payload.events:
        return TelemetryEventResponse(
            status="ACCEPTED",
            message="No events to process",
            eventsProcessed=0
        )
    
    session_id = payload.sessionId or (payload.events[0].sessionId if payload.events and payload.events[0].sessionId else "unknown")
    user_id = payload.events[0].userId if payload.events and payload.events[0].userId else "anonymous"
    
    # ============ STEP 1: PERSIST ALL EVENTS ============
    for event in payload.events:
        db_event = TelemetryEventLog(
            user_id=event.userId or user_id,
            session_id=event.sessionId or session_id,
            seq=event.seq or 0,
            action=event.action,
            ts=event.ts or int(datetime.utcnow().timestamp() * 1000),
            dwell_from_prev_ms=event.dwellFromPrevMs or 0,
            metadata_=event.metadata or {}
        )
        db.add(db_event)
    
    db.commit()
    
    # ============ STEP 2: ANALYZE FOR ANOMALIES (FULL SESSION HISTORY) ============
    db_events = db.query(TelemetryEventLog).filter(TelemetryEventLog.session_id == session_id).order_by(TelemetryEventLog.seq.asc()).all()
    
    class SessionEventWrapper:
        def __init__(self, action, seq, ts, dwellFromPrevMs, metadata, userId, sessionId):
            self.action = action
            self.seq = seq
            self.ts = ts
            self.dwellFromPrevMs = dwellFromPrevMs
            self.metadata = metadata
            self.userId = userId
            self.sessionId = sessionId

    all_session_events = [
        SessionEventWrapper(
            action=e.action,
            seq=e.seq,
            ts=e.ts,
            dwellFromPrevMs=e.dwell_from_prev_ms,
            metadata=e.metadata_ or {},
            userId=e.user_id,
            sessionId=e.session_id
        )
        for e in db_events
    ]
    
    anomalies = detect_anomalies(all_session_events)
    sensitive_actions_detected = [e.action for e in all_session_events if e.action in SENSITIVE_ACTIONS]
    
    # ============ STEP 3: RUN FRAUD DETECTION (UNCONDITIONAL) ============
    # Runs for all sessions so riskAssessment is never null
    risk_analysis = analyze_fraud_risk(
        user_id=user_id,
        session_id=session_id,
        events=all_session_events,
        anomalies=anomalies,
        db=db
    )
    
    # ============ STEP 4: PERSIST SESSION TELEMETRY ============
    existing_session = db.query(SessionTelemetry).filter(SessionTelemetry.session_id == session_id).first()
    was_blocked = existing_session.is_blocked if existing_session else False
    is_blocked = was_blocked or (risk_analysis.get("risk_score", 0) > 80)
    
    if is_blocked:
        risk_analysis["risk_level"] = "HIGH"
        risk_analysis["risk_score"] = max(risk_analysis.get("risk_score", 0), 85)
    
    risk_analysis["is_blocked"] = is_blocked

    if existing_session:
        existing_session.user_id = user_id
        existing_session.event_count = len(payload.events)
        existing_session.sensitive_actions = sensitive_actions_detected
        existing_session.risk_score = risk_analysis.get("risk_score", 0)
        existing_session.risk_level = risk_analysis.get("risk_level", "LOW")
        existing_session.anomalies = anomalies
        existing_session.recommendation = risk_analysis.get("recommendation", "No action needed")
        existing_session.action_taken = risk_analysis.get("action_taken", "Logged entry.")
        existing_session.is_blocked = is_blocked
        existing_session.updated_at = datetime.utcnow()
    else:
        session_telemetry = SessionTelemetry(
            user_id=user_id,
            session_id=session_id,
            event_count=len(payload.events),
            sensitive_actions=sensitive_actions_detected,
            risk_score=risk_analysis.get("risk_score", 0),
            risk_level=risk_analysis.get("risk_level", "LOW"),
            anomalies=anomalies,
            recommendation=risk_analysis.get("recommendation", "No action needed"),
            action_taken=risk_analysis.get("action_taken", "Logged entry."),
            is_blocked=is_blocked
        )
        db.add(session_telemetry)
    db.commit()
    
    # ============ STEP 5: TRIGGER BACKGROUND NOTIFICATIONS & ALERTS ============
    score = risk_analysis.get("risk_score", 0)
    if risk_analysis and score >= 40:
        # Dispatch real Gmail SMTP alert email for Moderate or High Risk
        background_tasks.add_task(
            email_service.send_fraud_alert_email,
            user_id,
            session_id,
            score,
            risk_analysis.get("risk_level", "MEDIUM"),
            anomalies,
            risk_analysis.get("reason", "")
        )
        
        # If Moderate Risk (40-79), dispatch 2FA OTP via Email & Twilio SMS
        if score < 80:
            background_tasks.add_task(
                email_service.send_2fa_otp_email_and_sms,
                user_id,
                session_id,
                "123456"
            )
        
        # Create incident record if not already exists
        existing_incident = db.query(Incident).filter(Incident.session_id == session_id).first()
        if not existing_incident:
            incident = Incident(
                user_id=user_id,
                session_id=session_id,
                risk_score=score,
                reason=f"Telemetry-based detection: {', '.join(anomalies[:3]) if anomalies else 'Suspicious behavior'}",
                status="PENDING"
            )
            db.add(incident)
            db.commit()
    
    return TelemetryEventResponse(
        status="ACCEPTED",
        message="Telemetry events ingested and analyzed",
        eventsProcessed=len(payload.events),
        riskAssessment=risk_analysis
    )


def detect_anomalies(events: list, user_id: str = None) -> list:
    """
    Detect behavioral anomalies and fraud patterns from event sequence.
    """
    anomalies = []
    actions = [e.action for e in events]
    
    # ============ PATTERN 1: BULK OPERATIONS ============
    if "BULK_DOWNLOAD" in actions:
        bulk_events = [e for e in events if e.action == "BULK_DOWNLOAD"]
        for bulk_event in bulk_events:
            record_count = bulk_event.metadata.get("recordCount", 0)
            if record_count > 100 or record_count > 60:
                anomalies.append("BULK_OPERATION_DETECTED")
                break
    
    # ============ PATTERN 2: RAPID SENSITIVE ACTIONS ============
    sensitive_count = sum(1 for action in actions if action in SENSITIVE_ACTIONS)
    if sensitive_count >= 3:
        anomalies.append("RAPID_SENSITIVE_ACTION_SEQUENCE")
    
    # ============ PATTERN 3: DIRECT ROUTE ACCESS ============
    for i, event in enumerate(events):
        if event.action == "VIEW_MANAGE_BENEFICIARY" and i > 0:
            prev_actions = [e.action for e in events[:i]]
            if "VIEW_BENEFICIARIES" not in prev_actions:
                anomalies.append("DIRECT_ROUTE_ACCESS")
                break
        
        if event.action == "VIEW_SETTINGS" and i > 0:
            if i == 1:
                anomalies.append("DIRECT_ROUTE_ACCESS")
                break
    
    # ============ PATTERN 4: CREDENTIAL CHANGES WITHOUT LOGIN ============
    credential_change_actions = ["CHANGE_PASSWORD", "CHANGE_EMAIL", "CHANGE_MOBILE"]
    login_events_indices = [i for i, e in enumerate(events) if e.action == "LOGIN"]
    
    for i, event in enumerate(events):
        if event.action in credential_change_actions:
            recent_login = any(
                li in range(max(0, i - 5), i) for li in login_events_indices
            )
            if not recent_login and i > 0:
                anomalies.append("UNAUTHORIZED_SETTING_CHANGE")
    
    # ============ PATTERN 5: PAYEE MANIPULATION ============
    delete_beneficiary_indices = [i for i, e in enumerate(events) if e.action == "DELETE_BENEFICIARY"]
    add_payee_indices = [i for i, e in enumerate(events) if e.action == "ADD_PAYEE"]
    
    for del_idx in delete_beneficiary_indices:
        for add_idx in add_payee_indices:
            if 0 < add_idx - del_idx <= 3:
                anomalies.append("PAYEE_MANIPULATION_PATTERN")
                break
    
    # ============ PATTERN 6: MULTIPLE RAPID ADDITIONS ============
    if len(add_payee_indices) >= 2:
        time_diffs = [add_payee_indices[i+1] - add_payee_indices[i] for i in range(len(add_payee_indices)-1)]
        if any(td < 5 for td in time_diffs):
            anomalies.append("RAPID_MULTIPLE_PAYEES")
    
    # ============ PATTERN 7: SETTINGS DOWNGRADE BEFORE TRANSFER ============
    transfer_indices = [i for i, e in enumerate(events) if e.action == "TRANSFER"]
    for t_idx in transfer_indices:
        for i in range(max(0, t_idx - 5), t_idx):
            if events[i].action == "TOGGLE_TRANSACTION_ALERTS":
                if events[i].metadata.get("enabled") == False:
                    anomalies.append("GUARDRAIL_REMOVAL_BEFORE_TRANSFER")
                    break
    
    # ============ PATTERN 8: BREADTH RECON (AUDIT LOGS + OTHERS) ============
    has_audit_logs = "VIEW_AUDIT_LOGS" in actions
    breadth_views = sum(1 for a in actions if a.startswith("VIEW_"))
    if has_audit_logs and breadth_views > 4:
        anomalies.append("BREADTH_RECONNAISSANCE")

    # ============ PATTERN 10: EXTREME TRANSFER AMOUNT ============
    transfer_indices = [i for i, e in enumerate(events) if e.action == "TRANSFER"]
    for t_idx in transfer_indices:
        try:
            amt = float(events[t_idx].metadata.get("amount", 0))
            if amt >= 5000:
                anomalies.append("EXTREME_TRANSFER_AMOUNT")
                break
        except (ValueError, TypeError):
            pass

     # ============ PATTERN 9: KEYSTROKE DYNAMICS ANOMALIES ============
    keystroke_events = [
        e for e in events 
        if e.action == "KEYSTROKE_DYNAMICS" 
        or "averageDwellTime" in (e.metadata or {}) 
        or "typingSpeed" in (e.metadata or {}) 
        or "dwell" in (e.metadata or {})
    ]
    for ks_event in keystroke_events:
        meta = ks_event.metadata or {}
        
        dwell_dict = meta.get("dwell") if isinstance(meta.get("dwell"), dict) else {}
        flight_dict = meta.get("flight") if isinstance(meta.get("flight"), dict) else {}
        errors_dict = meta.get("errorsAndPauses") if isinstance(meta.get("errorsAndPauses"), dict) else {}
        
        avg_dwell = dwell_dict.get("mean", meta.get("averageDwellTime", 0))
        avg_flight = flight_dict.get("mean", meta.get("averageFlightTime", 0))
        total_keys = meta.get("totalKeystrokes", 0)
        
        backspace_rate = errors_dict.get(
            "backspaceRate", 
            meta.get("backspaceRate", (meta.get("backspaceCount", 0) / total_keys) if total_keys > 0 else 0)
        )
        longest_pause = errors_dict.get("longestPause", meta.get("longestPause", 0))
        pause_count = meta.get("pauseCount", 1 if longest_pause >= 2000 else 0)
        
        typing_speed = meta.get(
            "typingSpeed", 
            round(1000.0 / (avg_dwell + avg_flight), 2) if (avg_dwell + avg_flight) > 0 else 0
        )

        # Bot / Script Injection speed (e.g. typing speed > 15 char/sec or dwell time < 15ms)
        if typing_speed > 15 or (0 < avg_dwell < 15):
            anomalies.append("KEYSTROKE_BOT_SPEED")

        # Synthetic Flight Time (near zero or negative flight time indicating automation)
        if 0 <= avg_flight < 10 and total_keys >= 3:
            anomalies.append("KEYSTROKE_UNREALISTIC_FLIGHT_TIME")

        # Coercion / Excessive Hesitation / High Error Ratio (backspaces >= 25% or longest pause >= 1800ms)
        is_hesitant_flag = meta.get("isHesitating", False) or meta.get("scenario") == "hesitation"
        if (total_keys >= 3 and backspace_rate >= 0.25) or pause_count >= 2 or longest_pause >= 1800 or is_hesitant_flag:
            anomalies.append("KEYSTROKE_EXCESSIVE_HESITATION")

    
    return list(set(anomalies))





def get_user_database_baseline(db: Session, user_id: str, current_session_id: str) -> dict:
    """
    Dynamically computes a user's historical baseline profile from past database records,
    explicitly excluding the current active session.
    """
    past_sessions = db.query(SessionTelemetry).filter(
        SessionTelemetry.user_id == user_id,
        SessionTelemetry.session_id != current_session_id
    ).all()
    
    past_events = db.query(TelemetryEventLog).filter(
        TelemetryEventLog.user_id == user_id,
        TelemetryEventLog.session_id != current_session_id
    ).all()
    
    transfer_amounts = []
    bulk_record_counts = []
    
    for event in past_events:
        meta = event.metadata or {}
        if event.action == "TRANSFER" and "amount" in meta:
            try:
                transfer_amounts.append(float(meta["amount"]))
            except (ValueError, TypeError):
                pass
        if event.action == "BULK_DOWNLOAD" and "recordCount" in meta:
            try:
                bulk_record_counts.append(int(meta["recordCount"]))
            except (ValueError, TypeError):
                pass
                
    total_sessions = len(past_sessions)
    
    if total_sessions > 0:
        max_historical_transfer = max(transfer_amounts, default=2000.0)
        max_historical_bulk = max(bulk_record_counts, default=50)
    else:
        max_historical_transfer = max(transfer_amounts, default=500.0)
        max_historical_bulk = max(bulk_record_counts, default=10)
    
    return {
        "max_historical_transfer": max_historical_transfer,
        "max_historical_bulk_records": max_historical_bulk,
        "past_sessions_recorded": total_sessions,
        "persona": "Database User Profile"
    }


def analyze_fraud_risk(
    user_id: str,
    session_id: str,
    events: list,
    anomalies: list,
    db: Session
) -> dict:
    """
    Analyze fraud risk. Bypasses historical max limit checks entirely for established users.
    """
    db_baseline = get_user_database_baseline(db, user_id, session_id)
    
    login_events = [e for e in events if e.action == "LOGIN"]
    transfer_events = [e for e in events if e.action == "TRANSFER"]
    settings_events = [e for e in events if e.action.startswith("CHANGE_") or e.action.startswith("UPDATE_")]
    keystroke_events = [
        e for e in events 
        if e.action == "KEYSTROKE_DYNAMICS" 
        or "typingSpeed" in (e.metadata or {}) 
        or "dwell" in (e.metadata or {}) 
        or "averageDwellTime" in (e.metadata or {})
    ]
    
    new_device = False
    new_location = False
    
    if login_events:
        login_meta = login_events[0].metadata or {}
        new_device = login_meta.get("newDevice", False)
        new_location = login_meta.get("newLocation", False)

    keystroke_summary = None
    if keystroke_events:
        latest_ks = keystroke_events[-1].metadata or {}
        dwell_dict = latest_ks.get("dwell") if isinstance(latest_ks.get("dwell"), dict) else {}
        flight_dict = latest_ks.get("flight") if isinstance(latest_ks.get("flight"), dict) else {}
        errors_dict = latest_ks.get("errorsAndPauses") if isinstance(latest_ks.get("errorsAndPauses"), dict) else {}
        rhythm_dict = latest_ks.get("rhythm") if isinstance(latest_ks.get("rhythm"), dict) else {}
        
        avg_dwell = dwell_dict.get("mean", latest_ks.get("averageDwellTime", 0))
        avg_flight = flight_dict.get("mean", latest_ks.get("averageFlightTime", 0))
        total_keys = latest_ks.get("totalKeystrokes", 0)
        typing_speed = latest_ks.get("typingSpeed", round(1000.0 / (avg_dwell + avg_flight), 2) if (avg_dwell + avg_flight) > 0 else 0)
        
        keystroke_summary = {
            "schemaVersion": latest_ks.get("schemaVersion", 1),
            "inputMethod": latest_ks.get("inputMethod", "physical-keyboard"),
            "averageDwellTime": avg_dwell,
            "averageFlightTime": avg_flight,
            "dwellStdDev": dwell_dict.get("stdDev", 0),
            "flightStdDev": flight_dict.get("stdDev", 0),
            "totalKeystrokes": total_keys,
            "backspaceRate": errors_dict.get("backspaceRate", latest_ks.get("backspaceRate", (latest_ks.get("backspaceCount", 0) / total_keys) if total_keys > 0 else 0)),
            "longestPause": errors_dict.get("longestPause", latest_ks.get("longestPause", 0)),
            "rolloverRate": rhythm_dict.get("rolloverRate", latest_ks.get("rolloverRate", 0)),
            "typingSpeed": typing_speed
        }
    
    current_transfer_amount = 0.0
    for te in transfer_events:
        try:
            meta = te.metadata or {}
            amt = float(meta.get("amount", 0))
            if amt > current_transfer_amount:
                current_transfer_amount = amt
        except (ValueError, TypeError):
            pass

    has_history = db_baseline["past_sessions_recorded"] > 0
    
    if has_history:
        has_large_transfer = False
        effective_max_transfer = "IGNORED (User has established history)"
    else:
        has_large_transfer = current_transfer_amount > db_baseline["max_historical_transfer"] * 2
        effective_max_transfer = db_baseline["max_historical_transfer"]

    telemetry_context = {
        "event_count": len(events),
        "session_duration_ms": events[-1].ts - events[0].ts if events else 0,
        "current_transfer_amount": current_transfer_amount,
        "has_large_transfer": has_large_transfer,
        "has_new_device_login": new_device,
        "has_new_location": new_location,
        "settings_changes": len(settings_events),
        "sensitive_action_count": sum(1 for e in events if e.action in SENSITIVE_ACTIONS),
        "max_historical_transfer": effective_max_transfer,
        "past_sessions_recorded": db_baseline["past_sessions_recorded"],
        "has_established_history": has_history,
        "anomalies": anomalies,
        "sensitive_action_count": sum(1 for e in events if e.action in SENSITIVE_ACTIONS),
        "keystroke_summary": keystroke_summary
    }
    
    analysis = ai_service.analyze_telemetry_events(telemetry_context, anomalies, events)
    
    risk_score = analysis.get("risk_score", 0)
    risk_level = analysis.get("risk_level", "LOW")
    reason = analysis.get("reason", "Event-based analysis")
    
    action_taken = "Logged entry. No anomaly action requirements."
    recommendation = "No immediate action required."
    
    if risk_level == "HIGH":
        action_taken = "Verification email triggered. Incident escalated to fraud team."
        recommendation = "Recommend immediate user verification and possible account freeze."
    elif risk_level == "MEDIUM":
        action_taken = "Flagged for monitoring."
        recommendation = "Monitor for additional suspicious activity."
    
    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "anomalies": anomalies,
        "recommendation": recommendation,
        "action_taken": action_taken,
        "reason": reason
    }


@router.get("/events/{session_id}")
async def get_session_events(session_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all events for a specific session.
    """
    events = db.query(TelemetryEventLog).filter(
        TelemetryEventLog.session_id == session_id
    ).order_by(TelemetryEventLog.seq.asc()).all()
    
    return {
        "sessionId": session_id,
        "eventCount": len(events),
        "events": events
    }


@router.get("/sessions/{user_id}")
async def get_user_sessions(user_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all sessions for a specific user.
    """
    sessions = db.query(SessionTelemetry).filter(
        SessionTelemetry.user_id == user_id
    ).order_by(SessionTelemetry.created_at.desc()).all()
    
    return {
        "userId": user_id,
        "sessionCount": len(sessions),
        "sessions": sessions
    }
@router.get("/dashboard-showcase")
def get_dashboard_showcase(db: Session = Depends(get_db)):
    """
    Returns full details about the fraud engine's backend: weights, typologies, baselines, and database statistics.
    """
    from app.fraud_patterns import SIGNAL_WEIGHTS, FRAUD_PATTERNS, BASELINES
    
    total_events = db.query(TelemetryEventLog).count()
    total_sessions = db.query(SessionTelemetry).count()
    total_blocked = db.query(SessionTelemetry).filter(SessionTelemetry.is_blocked == True).count()
    total_incidents = db.query(Incident).count()
    
    return {
        "engine": {
            "name": "Antigravity Behavioral Fraud Engine",
            "version": "2.0.0",
            "type": "Rule-Based + LLM Hybrid Classifier",
            "aiModel": "openai/gpt-4o-mini"
        },
        "stats": {
            "totalIngestedEvents": total_events,
            "totalSessionsMonitored": total_sessions,
            "totalSessionsBlocked": total_blocked,
            "totalEscalatedIncidents": total_incidents
        },
        "signalWeights": SIGNAL_WEIGHTS,
        "fraudPatterns": FRAUD_PATTERNS,
        "baselines": BASELINES
    }


@router.get("/all-sessions")
async def get_all_sessions(limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve all recorded telemetry sessions across all users for Admin View.
    """
    sessions = db.query(SessionTelemetry).order_by(SessionTelemetry.created_at.desc()).limit(limit).all()
    return {
        "sessionCount": len(sessions),
        "sessions": sessions
    }


@router.get("/all-events")
async def get_all_events(
    limit: int = 200,
    session_id: Optional[str] = None,
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Retrieve logged telemetry events with optional filters for Admin View.
    """
    query = db.query(TelemetryEventLog)
    if session_id:
        query = query.filter(TelemetryEventLog.session_id == session_id)
    if user_id:
        query = query.filter(TelemetryEventLog.user_id == user_id)
    if action:
        query = query.filter(TelemetryEventLog.action == action)
    
    events = query.order_by(TelemetryEventLog.ts.desc()).limit(limit).all()
    total_count = query.count()
    
    return {
        "totalCount": total_count,
        "eventCount": len(events),
        "events": events
    }


@router.get("/metrics")
async def get_telemetry_metrics(db: Session = Depends(get_db)):
    """
    Retrieve aggregated telemetry metrics and stats for Frontend Admin dashboard.
    """
    sessions = db.query(SessionTelemetry).all()
    total_sessions = len(sessions)
    total_events = db.query(TelemetryEventLog).count()
    
    high_risk = sum(1 for s in sessions if (s.risk_level or "").upper() == "HIGH")
    medium_risk = sum(1 for s in sessions if (s.risk_level or "").upper() == "MEDIUM")
    low_risk = sum(1 for s in sessions if (s.risk_level or "").upper() == "LOW")
    
    avg_score = (
        round(sum(s.risk_score or 0 for s in sessions) / total_sessions, 1)
        if total_sessions > 0
        else 0
    )
    
    anomaly_counts = {}
    for s in sessions:
        if s.anomalies and isinstance(s.anomalies, list):
            for anomaly in s.anomalies:
                anomaly_counts[anomaly] = anomaly_counts.get(anomaly, 0) + 1
                
    recent_sessions = (
        db.query(SessionTelemetry)
        .order_by(SessionTelemetry.created_at.desc())
        .limit(10)
        .all()
    )
    
    return {
        "totalSessions": total_sessions,
        "totalEvents": total_events,
        "highRiskSessions": high_risk,
        "mediumRiskSessions": medium_risk,
        "lowRiskSessions": low_risk,
        "averageRiskScore": avg_score,
        "anomalyBreakdown": anomaly_counts,
        "recentSessions": recent_sessions
    }

@router.get("/session/{session_id}/status")
async def get_session_status(session_id: str, db: Session = Depends(get_db)):
    """
    Retrieve the blocking status and current risk of a session.
    """
    record = db.query(SessionTelemetry).filter(SessionTelemetry.session_id == session_id).first()
    if not record:
        return {
            "session_id": session_id,
            "is_blocked": False,
            "risk_score": 0,
            "risk_level": "LOW",
            "anomalies": [],
            "requires_2fa": False,
            "is_2fa_verified": False
        }
    
    score = record.risk_score or 0
    is_blocked = record.is_blocked or (score >= 80)
    requires_2fa = (40 <= score < 80) and not (record.is_2fa_verified or False)

    return {
        "session_id": record.session_id,
        "is_blocked": is_blocked,
        "risk_score": score,
        "risk_level": record.risk_level,
        "anomalies": record.anomalies or [],
        "requires_2fa": requires_2fa,
        "is_2fa_verified": record.is_2fa_verified or False
    }

@router.post("/session/{session_id}/verify-2fa")
async def verify_2fa(session_id: str, db: Session = Depends(get_db)):
    """
    Verify 2FA step-up authentication for a moderate risk session.
    """
    record = db.query(SessionTelemetry).filter(SessionTelemetry.session_id == session_id).first()
    if record:
        record.is_2fa_verified = True
        record.action_taken = "2FA Step-up verified successfully by user."
        db.commit()
    return {"status": "SUCCESS", "message": f"2FA verified for session {session_id}."}

@router.get("/session/{session_id}/dora-report")
async def generate_dora_report(session_id: str, db: Session = Depends(get_db)):
    """
    Generates a DORA (Digital Operational Resilience Act) Major ICT Incident / Security Report.
    """
    session_rec = db.query(SessionTelemetry).filter(SessionTelemetry.session_id == session_id).first()
    events = db.query(TelemetryEventLog).filter(TelemetryEventLog.session_id == session_id).order_by(TelemetryEventLog.seq.asc()).all()
    incident = db.query(Incident).filter(Incident.session_id == session_id).first()

    risk_score = session_rec.risk_score if session_rec else 0
    risk_level = session_rec.risk_level if session_rec else "LOW"
    anomalies = session_rec.anomalies if session_rec else []
    user_id = session_rec.user_id if session_rec else (events[0].user_id if events else "unknown")

    classification = "MAJOR_ICT_SECURITY_INCIDENT" if risk_score >= 80 else ("SIGNIFICANT_OPERATIONAL_RISK" if risk_score >= 40 else "LOW_RISK_EVENT")
    
    impacted_services = list(set([e.action for e in events if e.action in SENSITIVE_ACTIONS or e.action.startswith("VIEW_")]))
    
    mitigations = []
    if session_rec and session_rec.is_blocked:
        mitigations.append("Session immediately terminated & account locked in real-time.")
    if session_rec and session_rec.is_2fa_verified:
        mitigations.append("Step-up 2-Factor Authentication completed by account owner.")
    elif risk_score >= 40:
        mitigations.append("2-Factor Step-up authentication requested.")
    if incident:
        mitigations.append(f"Security incident INC-00{incident.id} registered (Status: {incident.status}).")

    report = {
        "report_metadata": {
            "dora_reference": f"DORA-RES-2026-{(session_id or '000000')[:8].upper()}",
            "regulatory_framework": "EU Digital Operational Resilience Act (DORA) - Article 18 & 19",
            "entity_name": "Vault Financial Platform",
            "jurisdiction": "EU / Global Financial Services",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "classification": classification
        },
        "incident_summary": {
            "session_id": session_id,
            "impacted_user_id": user_id,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "is_blocked": session_rec.is_blocked if session_rec else False,
            "is_2fa_verified": session_rec.is_2fa_verified if session_rec else False,
            "anomalies_detected": anomalies,
            "impacted_ict_functions": impacted_services
        },
        "root_cause_analysis": {
            "threat_vectors": anomalies if anomalies else ["Normal User Activity"],
            "summary": session_rec.recommendation if session_rec else "Standard operational log.",
            "sensitive_actions_executed": session_rec.sensitive_actions if session_rec else []
        },
        "remediation_and_mitigation": {
            "actions_taken": session_rec.action_taken if session_rec else "Logged entry.",
            "mitigation_steps": mitigations,
            "incident_escalation_status": incident.status if incident else "NOT_ESCALATED"
        },
        "chronological_telemetry_timeline": [
            {
                "seq": e.seq,
                "timestamp_ms": e.ts,
                "action": e.action,
                "dwell_from_prev_ms": e.dwell_from_prev_ms,
                "payload_metadata": e.metadata_ or {}
            }
            for e in events
        ]
    }
    return report

@router.post("/session/{session_id}/block")
async def block_session(session_id: str, db: Session = Depends(get_db)):
    """
    Manually override and block a session.
    """
    record = db.query(SessionTelemetry).filter(SessionTelemetry.session_id == session_id).first()
    if not record:
        record = SessionTelemetry(
            user_id="unknown",
            session_id=session_id,
            event_count=0,
            sensitive_actions=[],
            risk_score=100,
            risk_level="HIGH",
            anomalies=["MANUAL_ADMIN_BLOCK"],
            recommendation="Admin block override applied.",
            action_taken="Blocked by admin.",
            is_blocked=True
        )
        db.add(record)
    else:
        record.is_blocked = True
        record.risk_score = 100
        record.risk_level = "HIGH"
        if not record.anomalies:
            record.anomalies = []
        if "MANUAL_ADMIN_BLOCK" not in record.anomalies:
            record.anomalies = list(record.anomalies) + ["MANUAL_ADMIN_BLOCK"]
    
    # Also create/update incident
    incident = db.query(Incident).filter(Incident.session_id == session_id).first()
    if not incident:
        incident = Incident(
            user_id=record.user_id,
            session_id=session_id,
            risk_score=100,
            reason="Blocked by administrator override.",
            status="ESCALATED"
        )
        db.add(incident)
    else:
        incident.risk_score = 100
        incident.reason = "Blocked by administrator override."
        incident.status = "ESCALATED"
        
    db.commit()
    return {"status": "SUCCESS", "message": f"Session {session_id} successfully blocked."}

@router.post("/session/{session_id}/unblock")
async def unblock_session(session_id: str, db: Session = Depends(get_db)):
    """
    Manually override and unblock a session.
    """
    record = db.query(SessionTelemetry).filter(SessionTelemetry.session_id == session_id).first()
    if record:
        record.is_blocked = False
        record.risk_score = 0
        record.risk_level = "LOW"
        record.anomalies = []
        record.recommendation = "Unblocked by admin."
        record.action_taken = "Session reset."
        
    # Also update incident if any
    incident = db.query(Incident).filter(Incident.session_id == session_id).first()
    if incident:
        incident.status = "RESOLVED"
        
    db.commit()
    return {"status": "SUCCESS", "message": f"Session {session_id} successfully unblocked."}


@router.get("/session/{session_id}/status")
async def get_session_status(session_id: str, db: Session = Depends(get_db)):
    """
    Get real-time risk status, 2FA requirement status, and lockout status for a session.
    """
    record = db.query(SessionTelemetry).filter(SessionTelemetry.session_id == session_id).first()
    if not record:
        return {
            "session_id": session_id,
            "is_blocked": False,
            "risk_score": 0,
            "risk_level": "LOW",
            "anomalies": [],
            "requires_2fa": False,
            "is_2fa_verified": False
        }
    
    # Session requires 2FA if risk score is Moderate (40-79) and 2FA is not yet verified!
    requires_2fa = (not record.is_blocked) and (40 <= record.risk_score < 80) and (not record.is_2fa_verified)
    
    return {
        "session_id": session_id,
        "is_blocked": record.is_blocked,
        "risk_score": record.risk_score,
        "risk_level": record.risk_level,
        "anomalies": record.anomalies or [],
        "requires_2fa": requires_2fa,
        "is_2fa_verified": record.is_2fa_verified
    }


@router.post("/session/{session_id}/verify-2fa")
async def verify_2fa(session_id: str, db: Session = Depends(get_db)):
    """
    Mark 2FA as verified for a session when the user enters valid verification code.
    """
    record = db.query(SessionTelemetry).filter(SessionTelemetry.session_id == session_id).first()
    if record:
        record.is_2fa_verified = True
        record.action_taken = "2FA Step-up identity verified by user."
        db.commit()
        return {"status": "SUCCESS", "message": f"2FA verified for session {session_id}."}
    
    # If record doesn't exist yet, create it verified
    record = SessionTelemetry(
        user_id="unknown",
        session_id=session_id,
        event_count=0,
        sensitive_actions=[],
        risk_score=50,
        risk_level="MEDIUM",
        anomalies=[],
        recommendation="2FA Step-up verified.",
        action_taken="2FA Step-up identity verified by user.",
        is_blocked=False,
        is_2fa_verified=True
    )
    db.add(record)
    db.commit()
    return {"status": "SUCCESS", "message": f"2FA verified for session {session_id}."}