# 🔐 Real-Time Anomaly & Fraud Detection Engine (FastAPI Backend)

An enterprise-grade backend system for detecting fraudulent behavior in banking applications using rule-based heuristics and AI-powered sequence analysis.

---

## 🚀 Getting Started

### 1. Install Dependencies
Ensure you have activated your Python virtual environment, then install requirements:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment
Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL=sqlite:///./data/behaviour.db
# (Optional) Credentials for AI service fallback overrides:
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
VERTEX_AI_LOCATION=us-central1
```

### 3. Run the Backend
```bash
uvicorn app.main:app --reload --port 8000
```
- **API Base URL**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`

---

## 💾 Database Schema (SQLite)

The engine stores telemetry metrics in `data/behaviour.db` across three main tables:

1. **`telemetry_events`**: Stores raw event logs (user actions, timestamps, dwell times, and JSON metadata payloads).
2. **`session_telemetry`**: Aggregates metrics per session (event counts, detected anomaly lists, computed risk scores, and `is_blocked` flags).
3. **`incidents`**: Tracks escalated audits that require manual review or admin resolution.

---

## 📡 Core API Endpoints

### 1. Telemetry Ingestion & Real-Time Analysis
* **Route**: `POST /api/v1/fraud/telemetry/events`
* **Payload**: `TelemetryFlushRequest` containing the `sessionId` and a list of telemetry `events`.
* **Behavior**: Saves incoming events in the database, queries **all historical events in the current session**, evaluates them for sequence anomalies (e.g. guardrail removal before transfer), and updates the session's overall risk score. Returns the latest risk assessment.

### 2. Session Blocking Status
* **Route**: `GET /api/v1/fraud/telemetry/session/{session_id}/status`
* **Response**: Returns the current `is_blocked`, `risk_score`, `risk_level`, and list of `anomalies` for a session. Polled by the client app to trigger real-time session termination.

### 3. Standalone Risk Showcase
* **Route**: `GET /api/v1/fraud/telemetry/dashboard-showcase`
* **Response**: Exposes the engine's internal setup (evidence-based signal weights, user persona baselines, and active typologies) and live database stats for developer dashboards.

### 4. Admin Override Controllers
* **Block Session**: `POST /api/v1/fraud/telemetry/session/{session_id}/block` (Overrides status to blocked and generates an escalated audit incident).
* **Unblock Session**: `POST /api/v1/fraud/telemetry/session/{session_id}/unblock` (Clears block flags and marks escalated incidents as resolved).
