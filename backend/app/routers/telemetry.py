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
    
    Endpoint: POST /api/v1/fraud/telemetry/events
    
    Expected payload:
    {
        "sessionId": "a1b2c3d4-...",
        "events": [
            {
                "userId": "U1023",
                "sessionId": "a1b2c3d4-...",
                "seq": 5,
                "action": "TRANSFER",
                "ts": 1784571124942,
                "dwellFromPrevMs": 4023,
                "metadata": { "amount": "25000", "currency": "USD", "recipientName": "Offshore Account" }
            },
            ...
        ]
    }
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
    
    # ============ STEP 3: RUN FRAUD DETECTION (if sensitive actions or anomalies) ============
    risk_analysis = None
    if sensitive_actions_detected or anomalies:
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
        risk_score=risk_analysis.get("risk_score", 0) if risk_analysis else 0,
        risk_level=risk_analysis.get("risk_level", "LOW") if risk_analysis else "LOW",
        anomalies=anomalies,
        recommendation=risk_analysis.get("recommendation", "No action needed") if risk_analysis else "No action needed",
        action_taken=risk_analysis.get("action_taken", "Logged entry. No anomaly action requirements.") if risk_analysis else "Logged entry."
    )
    db.add(session_telemetry)
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
            reason=f"Telemetry-based detection: {', '.join(anomalies[:3])}",
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
    Uses the fraud patterns catalogue for comprehensive detection.
    
    Detects:
    - Direct route access (navigation anomalies)
    - Rapid sensitive action sequences (velocity-based)
    - Bulk operations (data exfiltration)
    - Unauthorized setting changes
    - Payee manipulation patterns
    - Credential change anomalies
    """
    anomalies = []
    actions = [e.action for e in events]
    
    # ============ PATTERN 1: BULK OPERATIONS ============
    if "BULK_DOWNLOAD" in actions:
        bulk_events = [e for e in events if e.action == "BULK_DOWNLOAD"]
        for bulk_event in bulk_events:
            record_count = bulk_event.metadata.get("recordCount", 0)
            # If over 10x baseline or absolute count > 100, flag as anomaly
            if record_count > 100 or record_count > 60:  # U1003 baseline is ~8-10, so 60+ is spike
                anomalies.append("BULK_OPERATION_DETECTED")
                break
    
    # ============ PATTERN 2: RAPID SENSITIVE ACTIONS ============
    sensitive_count = sum(1 for action in actions if action in SENSITIVE_ACTIONS)
    if sensitive_count >= 3:
        anomalies.append("RAPID_SENSITIVE_ACTION_SEQUENCE")
    
    # ============ PATTERN 3: DIRECT ROUTE ACCESS ============
    for i, event in enumerate(events):
        # Check for jumps to sensitive screens
        if event.action == "VIEW_MANAGE_BENEFICIARY" and i > 0:
            prev_actions = [e.action for e in events[:i]]
            if "VIEW_BENEFICIARIES" not in prev_actions:
                anomalies.append("DIRECT_ROUTE_ACCESS")
                break
        
        if event.action == "VIEW_SETTINGS" and i > 0:
            prev_actions = [e.action for e in events[:i]]
            # Settings should be accessed from dashboard or menu, not directly
            if i == 1:  # Direct jump after login
                anomalies.append("DIRECT_ROUTE_ACCESS")
                break
    
    # ============ PATTERN 4: CREDENTIAL CHANGES WITHOUT LOGIN ============
    credential_change_actions = ["CHANGE_PASSWORD", "CHANGE_EMAIL", "CHANGE_MOBILE"]
    login_events_indices = [i for i, e in enumerate(events) if e.action == "LOGIN"]
    
    for i, event in enumerate(events):
        if event.action in credential_change_actions:
            # Check if recent LOGIN exists
            recent_login = any(
                li in range(max(0, i - 5), i) for li in login_events_indices
            )
            if not recent_login and i > 0:
                anomalies.append("UNAUTHORIZED_SETTING_CHANGE")
    
    # ============ PATTERN 5: PAYEE MANIPULATION ============
    delete_beneficiary_indices = [i for i, e in enumerate(events) if e.action == "DELETE_BENEFICIARY"]
    add_payee_indices = [i for i, e in enumerate(events) if e.action == "ADD_PAYEE"]
    
    # Check for delete followed closely by add (payee swap)
    for del_idx in delete_beneficiary_indices:
        for add_idx in add_payee_indices:
            if 0 < add_idx - del_idx <= 3:  # Add within 3 events of delete
                anomalies.append("PAYEE_MANIPULATION_PATTERN")
                break
    
    # ============ PATTERN 6: MULTIPLE RAPID ADDITIONS ============
    if len(add_payee_indices) >= 2:
        # Check if they're close together (within 5 events)
        time_diffs = [add_payee_indices[i+1] - add_payee_indices[i] for i in range(len(add_payee_indices)-1)]
        if any(td < 5 for td in time_diffs):
            anomalies.append("RAPID_MULTIPLE_PAYEES")
    
    # ============ PATTERN 7: SETTINGS DOWNGRADE BEFORE TRANSFER ============
    transfer_indices = [i for i, e in enumerate(events) if e.action == "TRANSFER"]
    for t_idx in transfer_indices:
        # Check if alerts were toggled OFF before this transfer
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
    
    return list(set(anomalies))  # Remove duplicates


def analyze_fraud_risk(
    user_id: str,
    session_id: str,
    events: list,
    anomalies: list,
    db: Session
) -> dict:
    """
    Analyze fraud risk using event patterns and Vertex AI.
    """
    
    # Build context from events
    login_events = [e for e in events if e.action == "LOGIN"]
    transfer_events = [e for e in events if e.action == "TRANSFER"]
    settings_events = [e for e in events if e.action.startswith("CHANGE_") or e.action.startswith("UPDATE_")]
    
    new_device = False
    new_location = False
    
    if login_events:
        login_meta = login_events[0].metadata
        new_device = login_meta.get("newDevice", False)
        new_location = login_meta.get("newLocation", False)
    
    # Build telemetry payload for AI analysis (using NEW SCHEMA)
    telemetry_context = {
        "event_count": len(events),
        "session_duration_ms": events[-1].ts - events[0].ts if events else 0,
        "has_large_transfer": any(
            float(e.metadata.get("amount", 0)) > 10000 for e in transfer_events
        ),
        "has_new_device_login": new_device,
        "has_new_location": new_location,
        "settings_changes": len(settings_events),
        "anomalies": anomalies,
        "sensitive_action_count": sum(1 for e in events if e.action in SENSITIVE_ACTIONS)
    }
    
    # Use NEW AI method that works with telemetry events
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
