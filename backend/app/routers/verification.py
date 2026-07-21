from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import UserBehaviour, KnownPattern, Incident
from app.services.email_service import email_service

router = APIRouter(prefix="/verification", tags=["Verification Callbacks"])

@router.get("/verify")
async def verify_user_callback(user_id: str, session_id: str, action: str, db: Session = Depends(get_db)):
    record = db.query(UserBehaviour).filter(UserBehaviour.session_id == session_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Target session reference not found.")

    if action.lower() == "yes":
        trusted = KnownPattern(user_id=user_id, typing_speed_wpm=record.typing_speed_wpm, tab_switches=record.tab_switches)
        db.add(trusted)
        db.commit()
        return {"status": "Accepted", "message": "Signature verified and saved to trusted storage."}

    elif action.lower() == "no":
        incident = Incident(user_id=user_id, session_id=session_id, risk_score=record.risk_score, reason="User disavowed pattern metrics.", status="ESCALATED")
        db.add(incident)
        db.commit()
        
        email_service.trigger_bank_escalation(user_id, session_id)
        return {"status": "Escalated", "message": "Account validation denied. Sent to forensics."}

    raise HTTPException(status_code=400, detail="Invalid action parameter.")
