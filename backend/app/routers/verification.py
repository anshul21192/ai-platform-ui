from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SessionTelemetry, UserBehaviour, KnownPattern, Incident
from app.services.email_service import email_service

router = APIRouter(prefix="/verification", tags=["Verification Callbacks"])

@router.get("/verify")
async def verify_user_callback(user_id: str, session_id: str, action: str, db: Session = Depends(get_db)):
    # Look up session matching both user_id and session_id
    record = db.query(SessionTelemetry).filter(
        SessionTelemetry.session_id == session_id,
        SessionTelemetry.user_id == user_id
    ).first()

    if not record:
        raise HTTPException(
            status_code=404, 
            detail="Target session reference not found."
        )

    # Find the corresponding incident record created during ingestion
    incident = db.query(Incident).filter(
        Incident.session_id == session_id,
        Incident.user_id == user_id
    ).first()

    action_clean = action.lower()

    if action_clean == "yes":
        if incident:
            incident.status = "VERIFIED_BY_USER"
        db.commit()
        return {"status": "Accepted", "message": "Signature verified. Incident resolved."}

    elif action_clean == "no":
        if incident:
            incident.status = "ESCALATED"
        else:
            incident = Incident(
                user_id=user_id, 
                session_id=session_id, 
                risk_score=getattr(record, 'risk_score', 0), 
                reason="User disavowed session activity.", 
                status="ESCALATED"
            )
            db.add(incident)
        db.commit()
        
        email_service.trigger_bank_escalation(user_id, session_id)
        return {"status": "Escalated", "message": "Account validation denied. Sent to forensics."}

    raise HTTPException(status_code=400, detail="Invalid action parameter.")