# 💳 Client Banking App (React Frontend)

A React + Vite + TypeScript frontend application simulating a retail banking interface. It is instrumented with event logging to track user behavior, keystroke dynamics, and navigation sequences in real-time.

---

## 🚀 Getting Started

### 1. Install Dependencies
Run from the `frontend/` directory (or use workspace installation at the root):
```bash
pnpm install
```

### 2. Start Development Server
```bash
pnpm dev
```
The application will be available locally at `http://localhost:5173`.

---

## 📡 Live Telemetry & Security Protection

### 1. Telemetry Capture
The client captures user interactions via `frontend/src/utils/eventLogger.ts` and buffers them.
* **Regular Events**: Navigation views, tab clicks, and inputs are buffered and flushed in batches.
* **Sensitive Events**: Sensitive actions (e.g. `TRANSFER`, `ADD_PAYEE`, `TOGGLE_TRANSACTION_ALERTS`, `DELETE_BENEFICIARY`) trigger an **immediate** flush to `/api/v1/fraud/telemetry/events`.
* **Keystroke Dynamics**: Typing speed, backspace rates, pause durations, and flight times are recorded on login inputs to identify bots or automated script injection.

### 2. Real-Time Blocking & Protective Logout
Inside `frontend/src/contexts/AuthContext.tsx`, two concurrent protection loops monitor session status:
1. **Background Polling**: Queries the backend endpoint `/session/{session_id}/status` every 3 seconds.
2. **Immediate Event Callbacks**: Inspects response payloads returned from immediate telemetry flushes.

If `is_blocked = true` is detected:
* A browser `alert()` notifies the user of session termination.
* The local session is cleared, credentials are deleted, and `logout()` is triggered immediately.
* A security flag and the risk score are saved in `localStorage`.
* The user is redirected to the Login Screen, which displays a bold red alert card: `"SECURITY ALERT: Your previous session was terminated due to suspicious behavioral fraud activities. (Risk Score: X%)"`.

---

## 📊 Risk Showcase Dashboard

Accessible in the **Admin Control Center** (Port 5174) under the **"Risk Engine Showcase"** tab, this view loads live details directly from the backend to showcase:
* **Active Database Stats**: Ingested events, unique tracked sessions, escalated audit counts.
* **Signal Weights**: Threat indicators and their rule-based fallback weights.
* **Typologies**: Deep behavioral patterns matched by the system (e.g. Account Takeover, Mule networks, exfiltration).
* **Baselines**: Persona profiles detailing normal activity limits.
