# Real-Time Behavioral Fraud Prevention & Security Hub

A comprehensive real-time behavioral fraud detection system for online banking. The application monitors user navigation patterns, keystroke dynamics, settings changes, and payment flows in real-time. If suspicious activity exceeds threat limits, the session is terminated instantly on the client side, and the incident is escalated to a Security Analyst Hub.

## 🏗️ Repository Architecture

This is a monorepo structured with **pnpm workspaces**:
```
├── run-local.sh            # Root launcher script (venv setup + dev servers)
├── package.json            # Workspace manager scripts
├── pnpm-workspace.yaml     # Workspaces configuration
├── frontend/               # Client Banking App (Port 5173)
├── admin-frontend/         # Security Analyst Hub (Port 5174)
└── backend/                # FastAPI Telemetry & Fraud Engine (Port 8000)
```

- **Client Banking App (`frontend`)**: React + Vite + TypeScript. Simulates a standard retail banking interface. Collects user behavioral telemetry (keystrokes, navigation history, clicks) and sends updates to the backend.
- **Security Analyst Hub (`admin-frontend`)**: React + Vite + TypeScript. Displays real-time session risk scores, event histories, threat breakdowns, manual override buttons, and live attack simulators.
- **FastAPI Telemetry Backend (`backend`)**: Python. Houses the rule-based and AI hybrid classification engine, maintains SQLite telemetry event logs, and handles session block registers.

---

## 🛠️ Prerequisites

Ensure you have the following installed on your machine:
1. **Node.js** (v18 or higher)
2. **pnpm** (preferred package manager)
3. **Python 3.10+** (with `pip` and `venv` support)

---

## 🚀 How to Run the Stack

You can set up dependencies and launch all three microservices with a single command from the repository root:

```bash
chmod +x run-local.sh
./run-local.sh
```

This script will automatically:
1. Build the Python virtual environment and install backend libraries.
2. Resolve and install package dependencies for both client apps.
3. Start the three local servers concurrently:
   - **Client Banking App**: `http://localhost:5173`
   - **Security Analyst Hub**: `http://localhost:5174`
   - **FastAPI Swagger Docs**: `http://localhost:8000/docs`

---

## 🔒 Implemented Fraud Scenarios & Verification Guide

### Scenario 1: Alert Guardrail Removal
- **Typology**: An attacker disabling transaction notifications immediately prior to a large transfer to hide unauthorized activities.
- **How to test**: Log in to the Client App (`http://localhost:5173`) as `john@vault.bank` (`demo123`). Go to **Settings** → toggle **Transaction Alerts** to Off. Go to **Send Money** → transfer any amount (e.g. `$250`).
- **Result**: The session locks immediately with a security alert popup and logs the user out. The login screen displays the red security warning banner.

### Scenario 2: Extreme Transfer Threshold
- **Typology**: Attempt to transfer an extremely large sum of money.
- **How to test**: Go to **Send Money** in the Client App. Enter any transfer amount **equal to or greater than $\$5,000$** (e.g., `$5,000` or `$10,000`) and click transfer.
- **Result**: The session is immediately blocked due to `"EXTREME_TRANSFER_AMOUNT"`, logging the user out.

### Scenario 3: Direct settings navigation + update profile (ATO)
- **Typology**: Attacker bypassing the dashboard home to update passwords or emails immediately after login.
- **How to test**: Log in. Go directly to **Settings** (triggers a `DIRECT_ROUTE_ACCESS` navigation anomaly), edit profile email or password, and click save.
- **Result**: The session is blocked instantly.

### Scenario 4: Payee Hijack / Redirection Fraud
- **Typology**: Deleting a trusted payee and immediately replacing them with a new mule account.
- **How to test**: Go to **Beneficiaries**, delete a beneficiary (trash icon), immediately add a new recipient named `Mule Account`, go to **Send Money**, choose `Mule Account`, and send funds.
- **Result**: The session blocks instantly upon submission.

### Scenario 5: Bot Automation script
- **Typology**: Automated crawler performing high-speed bulk data extraction.
- **How to test**: Go to the Security Analyst Hub (`http://localhost:5174`) → **Threat Intelligence & Simulator** tab. Click **Inject Bot Script**.
- **Result**: A synthetic bot session is registered in the Sessions log as blocked due to super-human keystroke speed and exfiltration.
