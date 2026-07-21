from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func  # 🚨 Added to compute baseline averages efficiently
from app.database import get_db
from app.models import UserBehaviour, KnownPattern
from app.schemas import BehaviourPayload, AnalysisResponse
from app.services.ai_service import ai_service
from app.services.email_service import email_service

router = APIRouter(prefix="/behaviour", tags=["Telemetry Evaluation Engine"])

@router.post("/analyse-behaviour", response_model=AnalysisResponse)
async def analyse_behaviour(payload: BehaviourPayload, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Keep your exact match filter as a high-performance first-pass cache
    known = db.query(KnownPattern).filter(
        KnownPattern.user_id == payload.user_id,
        KnownPattern.typing_speed_wpm == payload.typing_speed_wpm,
        KnownPattern.tab_switches == payload.tab_switches
    ).first()

    if known:
        return AnalysisResponse(
            risk_score=0,
            risk_level="LOW",
            reason="Activity correlates with a previously verified signature.",
            action_taken="Bypassed checks."
        )

    # 1. 📊 Extract user's unique profile averages from past valid interactions
    baseline_data = db.query(
        func.avg(UserBehaviour.typing_speed_wpm).label("avg_typing"),
        func.avg(UserBehaviour.tab_switches).label("avg_tabs"),
        func.avg(UserBehaviour.mouse_idle_time_sec).label("avg_idle"),
        func.count(UserBehaviour.id).label("total_sessions")
    ).filter(
        UserBehaviour.user_id == payload.user_id,
        UserBehaviour.risk_level != "HIGH"  # Filter out malicious records to keep baselines clean
    ).first()

    # 2. 🧩 Formulate baseline context dictionary if historical metrics exist
    baseline = None
    if baseline_data and baseline_data.total_sessions > 0:
        baseline = {
            "avg_typing_speed": round(float(baseline_data.avg_typing), 1),
            "avg_tab_switches": round(float(baseline_data.avg_tabs), 1),
            "avg_mouse_idle": round(float(baseline_data.avg_idle), 1),
            "total_sessions": baseline_data.total_sessions
        }

    # 3. 🧠 Provide the current payload AND the historical pattern to the AI service
    analysis = ai_service.analyze_pattern(payload.model_dump(), baseline=baseline)
    
    score = analysis.get("risk_score", 0)
    level = analysis.get("risk_level", "LOW")
    reason = analysis.get("reason", "Evaluation complete.")

    action_taken = "Logged entry. No anomaly action requirements."
    if score > 60:
        background_tasks.add_task(email_service.send_verification, payload.user_id, payload.session_id)
        action_taken = "Verification email triggered via background worker."

    # 4. 📝 Persist the current snapshot to further train the baseline profile
    db_log = UserBehaviour(
        user_id=payload.user_id,
        session_id=payload.session_id,
        typing_speed_wpm=payload.typing_speed_wpm,
        tab_switches=payload.tab_switches,
        mouse_idle_time_sec=payload.mouse_idle_time_sec,
        known_device=payload.known_device,
        ip_changed=payload.ip_changed,
        risk_score=score,
        risk_level=level
    )
    db.add(db_log)
    db.commit()

    return AnalysisResponse(risk_score=score, risk_level=level, reason=reason, action_taken=action_taken)