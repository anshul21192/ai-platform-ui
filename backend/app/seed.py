import time
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import TelemetryEventLog, SessionTelemetry, Incident
from app.database import Base, engine

def seed_db(db: Session):
    # Clear existing tables to ensure clean schema rebuild and fresh test dataset
    db.query(Incident).delete()
    db.query(TelemetryEventLog).delete()
    db.query(SessionTelemetry).delete()
    db.commit()

    print("🌱 Database cleared. Inserting predefined fraud scenarios...")

    now_ms = int(time.time() * 1000)

    # ==========================================
    # SCENARIO 1: Normal Retail Session (John Doe)
    # ==========================================
    john_session = "session_john_normal"
    john_user = "john@vault.bank"
    
    john_events_data = [
        ("LOGIN", 0, {"username": john_user, "newDevice": False, "newLocation": False}),
        ("VIEW_DASHBOARD", 1500, {}),
        ("VIEW_TRANSACTIONS", 3000, {}),
        ("VIEW_BENEFICIARIES", 2000, {}),
        ("VIEW_SEND_MONEY", 1500, {}),
        ("TRANSFER", 4000, {"amount": "120.00", "currency": "USD", "recipientName": "Sarah Johnson", "accountNumber": "7834019256"}),
        ("LOGOUT", 1200, {})
    ]
    
    john_events = []
    current_ts = now_ms - (3600 * 1000 * 2) # 2 hours ago
    for seq, (action, dwell, meta) in enumerate(john_events_data):
        current_ts += dwell
        john_events.append(TelemetryEventLog(
            user_id=john_user,
            session_id=john_session,
            seq=seq + 1,
            action=action,
            ts=current_ts,
            dwell_from_prev_ms=dwell,
            metadata_=meta
        ))
    db.add_all(john_events)

    john_summary = SessionTelemetry(
        user_id=john_user,
        session_id=john_session,
        event_count=len(john_events_data),
        sensitive_actions=["TRANSFER"],
        risk_score=8,
        risk_level="LOW",
        anomalies=[],
        recommendation="No action required.",
        action_taken="Logged entry. Allowed.",
        is_blocked=False
    )
    db.add(john_summary)

    # ==========================================
    # SCENARIO 2: Classic Account Takeover (Attacker)
    # ==========================================
    ato_session = "session_attacker_ato"
    ato_user = "john@vault.bank" # Attacker hijacking John's account
    
    ato_events_data = [
        ("LOGIN", 0, {"username": ato_user, "newDevice": True, "newLocation": True}),
        ("VIEW_SETTINGS", 2200, {}),
        ("CHANGE_PASSWORD", 4500, {}),
        ("CHANGE_EMAIL", 3200, {"new_email": "attacker@evil.com"}),
        ("VIEW_BENEFICIARIES", 1800, {}),
        ("ADD_PAYEE", 2900, {"name": "Mule Recipient", "email": "mule@networks.net"}),
        ("TRANSFER", 3500, {"amount": "4900.00", "currency": "USD", "recipientName": "Mule Recipient", "accountNumber": "9999019256"})
    ]

    # Note: "true" in JS metadata translates to Python dict as True
    for i, event in enumerate(ato_events_data):
        meta = event[2]
        if "newDevice" in meta:
            meta["newDevice"] = True
            meta["newLocation"] = True

    ato_events = []
    current_ts = now_ms - (3600 * 1000) # 1 hour ago
    for seq, (action, dwell, meta) in enumerate(ato_events_data):
        current_ts += dwell
        ato_events.append(TelemetryEventLog(
            user_id=ato_user,
            session_id=ato_session,
            seq=seq + 1,
            action=action,
            ts=current_ts,
            dwell_from_prev_ms=dwell,
            metadata_=meta
        ))
    db.add_all(ato_events)

    ato_summary = SessionTelemetry(
        user_id=ato_user,
        session_id=ato_session,
        event_count=len(ato_events_data),
        sensitive_actions=["CHANGE_PASSWORD", "CHANGE_EMAIL", "ADD_PAYEE", "TRANSFER"],
        risk_score=92,
        risk_level="HIGH",
        anomalies=["DIRECT_ROUTE_ACCESS", "UNAUTHORIZED_SETTING_CHANGE", "PAYEE_MANIPULATION_PATTERN"],
        recommendation="Recommend immediate user verification and account freeze.",
        action_taken="Verification email triggered. Incident escalated to fraud team. Session Blocked.",
        is_blocked=True
    )
    db.add(ato_summary)

    db.add(Incident(
        user_id=ato_user,
        session_id=ato_session,
        risk_score=92,
        reason="Telemetry-based ATO detection: Direct route setting change, password and email modified, payee added and immediate high value transfer.",
        status="PENDING"
    ))

    # ==========================================
    # SCENARIO 3: Keystroke Bot Script Injection (Attacker)
    # ==========================================
    bot_session = "session_bot_attack"
    bot_user = "attacker@evil.com"
    
    bot_events_data = [
        ("LOGIN", 0, {"username": bot_user, "newDevice": True, "newLocation": False}),
        ("VIEW_DASHBOARD", 800, {}),
        ("KEYSTROKE_DYNAMICS", 500, {
            "schemaVersion": 1,
            "inputMethod": "script-injection",
            "dwell": {"mean": 8, "stdDev": 1},
            "flight": {"mean": 5, "stdDev": 1},
            "totalKeystrokes": 15,
            "backspaceRate": 0.0,
            "longestPause": 0,
            "typingSpeed": 20.0
        }),
        ("VIEW_AUDIT_LOGS", 400, {}),
        ("BULK_DOWNLOAD", 1200, {"recordCount": 150})
    ]
    
    bot_events = []
    current_ts = now_ms - (1800 * 1000) # 30 mins ago
    for seq, (action, dwell, meta) in enumerate(bot_events_data):
        current_ts += dwell
        bot_events.append(TelemetryEventLog(
            user_id=bot_user,
            session_id=bot_session,
            seq=seq + 1,
            action=action,
            ts=current_ts,
            dwell_from_prev_ms=dwell,
            metadata_=meta
        ))
    db.add_all(bot_events)

    bot_summary = SessionTelemetry(
        user_id=bot_user,
        session_id=bot_session,
        event_count=len(bot_events_data),
        sensitive_actions=["BULK_DOWNLOAD"],
        risk_score=88,
        risk_level="HIGH",
        anomalies=["KEYSTROKE_BOT_SPEED", "BULK_OPERATION_DETECTED"],
        recommendation="Deactivate session instantly. Perform forensics check for bulk scraping activity.",
        action_taken="Session auto-blocked. IP flagged for throttling.",
        is_blocked=True
    )
    db.add(bot_summary)

    db.add(Incident(
        user_id=bot_user,
        session_id=bot_session,
        risk_score=88,
        reason="Super-human keystroke speed (20 chars/sec) matched with bulk download of 150 records.",
        status="PENDING"
    ))

    # ==========================================
    # SCENARIO 4: Medium Risk Verification (John Doe)
    # ==========================================
    john_med_session = "session_john_suspicious"
    
    john_med_events_data = [
        ("LOGIN", 0, {"username": john_user, "newDevice": True, "newLocation": False}),
        ("VIEW_SETTINGS", 1800, {}),
        ("TOGGLE_TRANSACTION_ALERTS", 2100, {"enabled": False}),
        ("VIEW_DASHBOARD", 1500, {})
    ]
    
    john_med_events = []
    current_ts = now_ms - (900 * 1000) # 15 mins ago
    for seq, (action, dwell, meta) in enumerate(john_med_events_data):
        current_ts += dwell
        john_med_events.append(TelemetryEventLog(
            user_id=john_user,
            session_id=john_med_session,
            seq=seq + 1,
            action=action,
            ts=current_ts,
            dwell_from_prev_ms=dwell,
            metadata_=meta
        ))
    db.add_all(john_med_events)

    john_med_summary = SessionTelemetry(
        user_id=john_user,
        session_id=john_med_session,
        event_count=len(john_med_events_data),
        sensitive_actions=["TOGGLE_TRANSACTION_ALERTS"],
        risk_score=50,
        risk_level="MEDIUM",
        anomalies=["DIRECT_ROUTE_ACCESS"],
        recommendation="Monitor session for transfers. Step-up authorization suggested.",
        action_taken="Flagged for monitoring.",
        is_blocked=False
    )
    db.add(john_med_summary)

    db.commit()
    print("🌱 Database seeded successfully!")
