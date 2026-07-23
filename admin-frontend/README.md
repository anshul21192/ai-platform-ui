# 🛡️ Security Analyst Hub (Admin Dashboard)

A React + Vite + TypeScript administration portal designed for security analysts to monitor active user sessions, analyze threat risk scores in real-time, trigger overrides, and simulate threat patterns.

---

## 🚀 Getting Started

### 1. Install Dependencies
Run from the `admin-frontend/` directory (or use workspace installation at the root):
```bash
pnpm install
```

### 2. Start Development Server
```bash
pnpm dev
```
The application will be available locally at `http://localhost:5174`.

---

## 📊 Dashboard Modules & Features

### 1. Analytics Overview
* Displays key database metrics (Total Monitored Sessions, Ingested Telemetry Logs, Active Session Blocks, Escalated Audits).
* Includes visualization charts showing anomaly distribution and overall threat level ratios.

### 2. Active Session Threat Log
* Lists all active and historical sessions sorted by activity.
* Shows the calculated risk score (green for low, orange for medium, red for high).
* Displays tags for detected anomalies (e.g. `GUARDRAIL_REMOVAL_BEFORE_TRANSFER`, `DIRECT_ROUTE_ACCESS`, `KEYSTROKE_BOT_SPEED`).
* Provides **Block** and **Unblock** manual override buttons to enforce immediate security lockout or reset a cleared user.
* Refreshes silently in the background every 3 seconds to capture live behavior updates.

### 3. Chronological Session Inspector (Drawer)
* Clicking **Inspect** on any session opens a side drawer showing a complete timeline of that session.
* Lists every user action in sequence, complete with dwell times, flight times, and metadata payloads (e.g. transfer amounts).

### 4. Interactive Live Attack Simulator
* Located under the **Threat Intelligence & Simulator** tab.
* Allows analysts to inject simulated user sequences directly to test threat detection:
  * **Inject Bot Script**: Simulates a scraper collecting audit logs at super-human typing speed.
  * **Inject Account Takeover**: Simulates a login from a new device/location followed by direct settings routing, transaction alerts disable, and a transfer.

### 5. Escalated Security Audits (Incidents)
* Lists escalated incidents requiring manual review and resolution.
* Displays the **Escalation Time** (the exact timestamp when the session was blocked) and status.
* Allows analysts to resolve audit files once a threat is mitigated.
