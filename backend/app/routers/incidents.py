from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Incident
from app.schemas import IncidentResponse

router = APIRouter(prefix="/incidents", tags=["Operations Portal View"])

@router.get("/", response_model=List[IncidentResponse])
async def fetch_incidents(db: Session = Depends(get_db)):
    return db.query(Incident).all()
