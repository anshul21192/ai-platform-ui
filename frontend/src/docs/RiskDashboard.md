# Risk Dashboard — Technical & Functional Specification

<img width="1164" height="767" alt="image" src="https://github.com/user-attachments/assets/eeb44436-5e76-4dd4-a7a8-e33f335f7065" />



## Purpose

The Risk Dashboard is a purpose-built analytics page for the AI-powered fraud detection platform. It is designed to make behavioral risk visible, explainable, and actionable for security, fraud, and operations teams.

It combines:

- real-time risk scoring
- behavioral anomaly detection
- incident escalation
- evidence capture
- decision outcomes

All in one place.

---

## Functional Overview

### 1. Risk Summary Cards

These cards surface the most important operational metrics:

- **Current Risk Score**
  - Latest AI-generated risk score for the active or most recent session.
  - Indicates whether the current session should be treated as safe or suspicious.

- **High-Risk Sessions**
  - Number of recent sessions flagged as `HIGH` risk.
  - Allows operations to understand fraud volume at a glance.

- **Open Incidents**
  - Current count of incidents created by the decision engine.
  - Measures active investigation load and remediation requirements.

- **Average Risk Score**
  - Rolling average across recent sessions.
  - Shows baseline fraud pressure and trending changes.

### 2. Risk Trend Chart

A time-series visualization showing risk scores over the last 7 days or recent sessions.

Benefits:

- Visualizes upward or downward momentum.
- Helps identify attack waves.
- Supports monitoring of remediation effectiveness.

### 3. Risk Level Distribution

A pie chart or donut chart showing the proportion of sessions by:

- `LOW`
- `MEDIUM`
- `HIGH`

This helps stakeholders understand:

- whether risk is concentrated in a small number of sessions
- whether a large share of sessions is suspicious
- whether the model is producing too many medium/high flags

### 4. Latest Risk Sessions Table

A session-level listing of:

- `sessionId`
- `riskLevel`
- `riskScore`
- `decision`

This section supports:

- fast triage
- session review
- validation of AI behavior decisions

### 5. Selected Session Detail Panel

Displays detailed evidence for a chosen session:

- risk score
- anomalies detected
- decision outcome
- summary of suspicious behavior

This section is critical for:

- investigation context
- auditability
- justifying step-up actions

### 6. Incident Log Table

Shows incident metadata:

- incident ID
- user ID
- session ID
- risk score
- reason
- status

This supports:

- operations workflow
- incident lifecycle management
- compliance reporting

### 7. Decision Engine Summary

A narrative section that explains:

- how high risk triggers step-up authentication
- what action is taken on suspicious sessions
- how evidence is stored for audit and compliance

This is especially useful for business stakeholders and audit teams.

---

## Technical Architecture

### Frontend

- `React` + `TypeScript` + `Vite`
- `MUI` for UI components
- `@mui/x-charts` for charts
- New page: `frontend/src/pages/RiskDashboardPage.tsx`
- Navigation route: `/risk-dashboard`
- Sidebar menu item: `Risk Dashboard`

### Backend

- `FastAPI` service in `backend/app/`
- Database models in `backend/app/models.py`
  - `TelemetryEventLog`
  - `SessionTelemetry`
  - `Incident`
  - `UserBehaviour`
- Core analysis endpoints:
  - `/api/v1/fraud/telemetry/events`
  - `/api/behaviour/analyse-behaviour`
  - `/api/incidents/`
  - `/api/v1/fraud/telemetry/sessions/{user_id}`
  - `/api/v1/fraud/telemetry/events/{session_id}`

### Data flow

#### 1. Behavioral telemetry ingestion

Frontend sends UI events to:

- `POST /api/v1/fraud/telemetry/events`

Payload:

```json
{
  "sessionId": "session_critical_100",
  "events": [
    {
      "userId": "U1023",
      "sessionId": "session_critical_100",
      "seq": 1,
      "action": "LOGIN",
      "ts": 1680000000000,
      "dwellFromPrevMs": 0,
      "metadata": { "newDevice": false, "newLocation": false }
    }
  ]
}
```
