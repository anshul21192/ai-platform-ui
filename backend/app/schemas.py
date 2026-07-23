# pyrefly: ignore [missing-import]
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
    userId: Optional[str] = "anonymous"
    sessionId: Optional[str] = "unknown"
    seq: Optional[int] = 0
    action: Optional[str] = "UNKNOWN"
    ts: Optional[int] = 0  # Unix timestamp in milliseconds
    dwellFromPrevMs: Optional[int] = 0
    metadata: Optional[Dict[str, Any]] = {}

    class Config:
        from_attributes = True

class TelemetryFlushRequest(BaseModel):
    """Batch of events flushed from the UI"""
    sessionId: Optional[str] = "unknown"
    events: List[TelemetryEvent] = []

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
