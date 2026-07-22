from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from datetime import datetime
from app.database import Base


class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    session_id = Column(String)
    risk_score = Column(Integer)
    reason = Column(String)
    status = Column(String, default="PENDING")
    created_at = Column(DateTime, default=datetime.utcnow)

# ============ TELEMETRY EVENT MODEL (UI Integration) ============
class TelemetryEventLog(Base):
    """Stores individual telemetry events from the UI"""
    __tablename__ = "telemetry_events"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    session_id = Column(String, index=True)
    seq = Column(Integer)  # Sequence number for ordering
    action = Column(String, index=True)  # e.g., TRANSFER, LOGIN, VIEW_DASHBOARD
    ts = Column(Integer)  # Unix timestamp in milliseconds
    dwell_from_prev_ms = Column(Integer)  # Time since previous event
    metadata_ = Column("metadata", JSON)  # Action-specific payload
    created_at = Column(DateTime, default=datetime.utcnow)

class SessionTelemetry(Base):
    """Stores aggregated telemetry data per session for fraud detection"""
    __tablename__ = "session_telemetry"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    session_id = Column(String, unique=True, index=True)
    event_count = Column(Integer, default=0)
    sensitive_actions = Column(JSON)  # List of sensitive actions detected
    risk_score = Column(Integer)
    risk_level = Column(String)
    anomalies = Column(JSON)  # List of anomalies detected
    recommendation = Column(String)
    action_taken = Column(String)
    dora_report = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
