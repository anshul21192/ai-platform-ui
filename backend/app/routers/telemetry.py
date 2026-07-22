from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
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
    
    session_id = payload.sessionId
    user_id = payload.events[0].userId  # Assume all events in batch are from same user
    
    # ============ STEP 1: PERSIST ALL EVENTS ============
    for event in payload.events:
        db_event = TelemetryEventLog(
            user_id=event.userId,
            session_id=event.sessionId,
            seq=event.seq,
            action=event.action,
            ts=event.ts,
            dwell_from_prev_ms=event.dwellFromPrevMs,
            metadata=event.metadata
        )
        db.add(db_event)
    
    db.commit()
    
    # ============ STEP 2: ANALYZE FOR ANOMALIES ============
    anomalies = detect_anomalies(payload.events)
    sensitive_actions_detected = [e.action for e in payload.events if e.action in SENSITIVE_ACTIONS]
    
    # ============ STEP 3: RUN FRAUD DETECTION (UNCONDITIONAL) ============
    # Runs for all sessions so riskAssessment is never null
    risk_analysis = analyze_fraud_risk(
        user_id=user_id,
        session_id=session_id,
        events=payload.events,
        anomalies=anomalies,
        db=db
    )
    
    # ============ STEP 4: PERSIST SESSION TELEMETRY ============
    session_telemetry = SessionTelemetry(
        user_id=user_id,
        session_id=session_id,
        event_count=len(payload.events),
        sensitive_actions=sensitive_actions_detected,
        risk_score=risk_analysis.get("risk_score", 0),
        risk_level=risk_analysis.get("risk_level", "LOW"),
        anomalies=anomalies,
        recommendation=risk_analysis.get("recommendation", "No action needed"),
        action_taken=risk_analysis.get("action_taken", "Logged entry.")
    )
    db.merge(session_telemetry)
    db.commit()
    
    # ============ STEP 5: TRIGGER BACKGROUND ACTIONS (if HIGH risk) ============
    if risk_analysis and risk_analysis.get("risk_score", 0) > 60:
        background_tasks.add_task(
            email_service.send_verification,
            user_id,
            session_id
        )
        
        # Create incident record
        incident = Incident(
            user_id=user_id,
            session_id=session_id,
            risk_score=risk_analysis["risk_score"],
            reason=f"Telemetry-based detection: {', '.join(anomalies[:3]) if anomalies else 'High risk behavior'}",
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



     # ============ PATTERN 9: KEYSTROKE DYNAMICS ANOMALIES ============
    keystroke_events = [e for e in events if e.action == "KEYSTROKE_DYNAMICS" or "averageDwellTime" in e.metadata or "typingSpeed" in e.metadata]
    for ks_event in keystroke_events:
        meta = ks_event.metadata or {}
        typing_speed = meta.get("typingSpeed", 0)
        avg_dwell = meta.get("averageDwellTime", 0)
        avg_flight = meta.get("averageFlightTime", 0)
        total_keys = meta.get("totalKeystrokes", 0)
        backspace_count = meta.get("backspaceCount", 0)
        pause_count = meta.get("pauseCount", 0)

        # Bot / Script Injection speed (e.g. typing speed > 15 char/sec or dwell time < 15ms)
        if typing_speed > 15 or (avg_dwell > 0 and avg_dwell < 15):
            anomalies.append("KEYSTROKE_BOT_SPEED")

        # Synthetic Flight Time (near zero or negative flight time indicating automation)
        if avg_flight > 0 and avg_flight < 10:
            anomalies.append("KEYSTROKE_UNREALISTIC_FLIGHT_TIME")

        # Coercion / Excessive Hesitation / High Error Ratio (backspaces > 40% of keystrokes or pause count >= 4)
        if (total_keys >= 5 and backspace_count / total_keys > 0.4) or pause_count >= 4:
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
    keystroke_events = [e for e in events if e.action == "KEYSTROKE_DYNAMICS" or "typingSpeed" in e.metadata]
    
    new_device = False
    new_location = False
    
    if login_events:
        login_meta = login_events[0].metadata or {}
        new_device = login_meta.get("newDevice", False)
        new_location = login_meta.get("newLocation", False)

    keystroke_summary = None
    if keystroke_events:
        latest_ks = keystroke_events[-1].metadata
        keystroke_summary = {
            "typingSpeed": latest_ks.get("typingSpeed"),
            "averageDwellTime": latest_ks.get("averageDwellTime"),
            "averageFlightTime": latest_ks.get("averageFlightTime"),
            "totalKeystrokes": latest_ks.get("totalKeystrokes"),
            "backspaceCount": latest_ks.get("backspaceCount"),
            "pauseCount": latest_ks.get("pauseCount")
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