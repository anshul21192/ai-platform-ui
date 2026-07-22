from pydantic import BaseModel
from datetime import datetime
from typing import Any, Dict, List, Optional

class IncidentResponse(BaseModel):
    id: int
    user_id: str
    session_id: str
    risk_score: int
    reason: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# ============ TELEMETRY EVENT SCHEMAS (UI Integration) ============
class TelemetryEvent(BaseModel):
    """Individual event captured from the UI"""
    userId: str
    sessionId: str
    seq: int
    action: str
    ts: int  # Unix timestamp in milliseconds
    dwellFromPrevMs: int
    metadata: Dict[str, Any]

    class Config:
        from_attributes = True

class TelemetryFlushRequest(BaseModel):
    """Batch of events flushed from the UI"""
    sessionId: str
    events: List[TelemetryEvent]

class TelemetryEventResponse(BaseModel):
    """Response after ingesting telemetry"""
    status: str
    message: str
    eventsProcessed: int
    riskAssessment: Optional[Dict[str, Any]] = None

class EventFraudAnalysis(BaseModel):
    """Fraud analysis result from telemetry event batch"""
    sessionId: str
    userId: str
    risk_score: int
    risk_level: str
    anomalies_detected: List[str]
    recommendation: str
    action_taken: str
