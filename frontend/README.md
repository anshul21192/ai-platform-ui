# AI Platform UI

A React-based frontend for an AI-powered behavioral fraud detection platform. Captures semantic user interaction events in a mock banking UI and feeds them to a Node.js + Vertex AI (Gemini) backend for real-time risk scoring via a RAG approach.

## Tech Stack

- **React 19** with TypeScript
- **Vite** for dev server and bundling
- **MUI (Material UI)** for component library and theming
- **React Router** for client-side routing
- **MSW** for API mocking during development
- **oxlint** for linting

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Install dependencies

```bash
pnpm install
```

### Start development server

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`.

### Build for production

```bash
pnpm build
```

### Preview production build

```bash
pnpm preview
```

### Lint

```bash
pnpm lint
```

## Pages

| Route                     | Description                      |
| ------------------------- | -------------------------------- |
| `/`                       | Dashboard with activity summary  |
| `/login`                  | Login page                       |
| `/beneficiaries`          | List and manage beneficiaries    |
| `/manage-beneficiary`     | Add or edit a beneficiary        |
| `/transactions`           | View and export transactions     |
| `/payments/send-money`    | Send money to a beneficiary      |
| `/payments/request-money` | Request money from a beneficiary |
| `/settings`               | User settings and security       |
| `/audit-logs`             | Event log viewer and simulator   |

## Event Logging & Telemetry

The frontend captures every meaningful user interaction as a structured event, buffers them in memory, and flushes them to a backend endpoint for behavioral fraud detection.

### Event Schema

Every event conforms to this structure:

```json
{
  "userId": "U1023",
  "sessionId": "a1b2c3d4-...",
  "seq": 5,
  "action": "TRANSFER",
  "ts": 1784571124942,
  "dwellFromPrevMs": 4023,
  "metadata": {
    "amount": "25000",
    "currency": "USD",
    "recipientName": "Offshore Account"
  }
}
```

| Field             | Type                  | Description                                      |
| ----------------- | --------------------- | ------------------------------------------------ |
| `userId`          | `string`              | Synthetic user ID (`U1023`, `U9999`)             |
| `sessionId`       | `string`              | UUID generated per login session                 |
| `seq`             | `number`              | Monotonically increasing sequence number         |
| `action`          | `string`              | The event name (see captured actions below)      |
| `ts`              | `number`              | Unix timestamp in milliseconds                   |
| `dwellFromPrevMs` | `number`              | Time since previous event in milliseconds        |
| `metadata`        | `Record<string, any>` | Action-specific payload (see per-action details) |

### What Is Captured

#### Navigation Events (automatic on route change)

Emitted automatically by `NavigationTracker` on every route change. The action is derived from the route via a mapping table.

| Route                     | Action Emitted            | Metadata   |
| ------------------------- | ------------------------- | ---------- |
| `/`                       | `VIEW_DASHBOARD`          | `{ path }` |
| `/transactions`           | `VIEW_TRANSACTIONS`       | `{ path }` |
| `/beneficiaries`          | `VIEW_BENEFICIARIES`      | `{ path }` |
| `/manage-beneficiary`     | `VIEW_MANAGE_BENEFICIARY` | `{ path }` |
| `/settings`               | `VIEW_SETTINGS`           | `{ path }` |
| `/audit-logs`             | `VIEW_AUDIT_LOGS`         | `{ path }` |
| `/payments/send-money`    | `VIEW_SEND_MONEY`         | `{ path }` |
| `/payments/request-money` | `VIEW_REQUEST_MONEY`      | `{ path }` |

#### Authentication & Biometric Events

| Action               | Trigger                           | Metadata                                                                                             |
| -------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `LOGIN`              | Successful login                  | `{ newDevice, newLocation, username }`                                                               |
| `KEYSTROKE_DYNAMICS` | Keystroke dynamics biometrics log | `{ averageDwellTime, averageFlightTime, typingSpeed, totalKeystrokes, backspaceCount, pauseCount }` |
| `LOGOUT`             | User clicks logout                | `{}`                                                                                                 |
| `LOGIN_LOCKOUT`      | >3 failed login attempts          | `{ username, failedAttempts }`                                                                       |

#### Beneficiary Events

| Action               | Trigger                    | Metadata                             |
| -------------------- | -------------------------- | ------------------------------------ |
| `ADD_PAYEE`          | Save new beneficiary       | `{ payeeName, accountNumber }`       |
| `EDIT_BENEFICIARIES` | Save edited beneficiary    | `{ beneficiaryId, beneficiaryName }` |
| `DELETE_BENEFICIARY` | Confirm delete beneficiary | `{ beneficiaryId, beneficiaryName }` |

#### Payment Events

| Action          | Trigger                   | Metadata                                             |
| --------------- | ------------------------- | ---------------------------------------------------- |
| `TRANSFER`      | Submit send money form    | `{ amount, currency, recipientName, accountNumber }` |
| `REQUEST_MONEY` | Submit request money form | `{ amount, currency, recipientName, accountNumber }` |

#### Settings Events

| Action                      | Trigger                          | Metadata                                |
| --------------------------- | -------------------------------- | --------------------------------------- |
| `CHANGE_EMAIL`              | (Not yet wired in UI)            | `{ newEmail }`                          |
| `CHANGE_MOBILE`             | (Not yet wired in UI)            | `{ newPhone }`                          |
| `CHANGE_PASSWORD`           | Click "Update Password"          | `{ hasNewPassword }`                    |
| `UPDATE_PROFILE`            | Click "Save Changes" in Profile  | `{ email, phone, firstName, lastName }` |
| `TOGGLE_TRANSACTION_ALERTS` | Toggle transaction alerts switch | `{ enabled }`                           |

#### Bulk Operations

| Action          | Trigger                            | Metadata          |
| --------------- | ---------------------------------- | ----------------- |
| `BULK_DOWNLOAD` | Click "Export All" on transactions | `{ recordCount }` |

#### Navigation Anomaly Detection

| Action                | Trigger                                                                  | Metadata                                             |
| --------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------- |
| `DIRECT_ROUTE_ACCESS` | User navigates to a sensitive route without visiting a valid predecessor | `{ targetRoute, previousRoute, navHistory, reason }` |

### When Events Are Buffered

All events are pushed into an in-memory buffer as they occur. The buffer accumulates events throughout the session.

### When Events Are Flushed

Events are flushed (sent to backend and persisted) in these scenarios:

| Scenario             | Description                                                           |
| -------------------- | --------------------------------------------------------------------- |
| **Sensitive action** | Any action in the `SENSITIVE_ACTIONS` set triggers an immediate flush |
| **Logout**           | `clearSession()` calls `flush()` before clearing state                |
| **Session clear**    | `clearEvents()` flushes then wipes localStorage                       |

### Sensitive Actions (trigger immediate flush)

```
DELETE_BENEFICIARY, EDIT_BENEFICIARIES, ADD_PAYEE, BULK_DOWNLOAD,
TRANSFER, REQUEST_MONEY, CHANGE_EMAIL, CHANGE_MOBILE, CHANGE_PASSWORD,
TOGGLE_TRANSACTION_ALERTS, LOGIN_LOCKOUT
```

### Flush Endpoint

Events are POSTed to:

```
POST /api/v1/fraud/telemetry/events
Content-Type: application/json

{
  "sessionId": "a1b2c3d4-...",
  "events": [ /* AppEvent[] */ ]
}
```

During development, this is mocked via MSW which logs the payload to the console. When a real backend is available, the MSW handler should be removed.

### Dual Persistence

On flush, events are stored in two places:

1. **localStorage** (`vault_bank_events` key) — Retains up to 200 events. Used by the Audit Logs page to display event history in the UI.
2. **POST to backend** — Sent to `/api/v1/fraud/telemetry/events` for risk scoring by the Vertex AI pipeline.

### Pre-Session Events

Events like `LOGIN_LOCKOUT` occur before a session is established. These are tracked with placeholder values (`userId: "anonymous"`, `sessionId: "pre-session"`) and still flushed normally.

### Demo Credentials

| Username            | Password  | User ID | Role     |
| ------------------- | --------- | ------- | -------- |
| `john@vault.bank`   | `demo123` | `U1023` | Normal   |
| `attacker@evil.com` | `stolen`  | `U9999` | Attacker |

### Audit Logs Simulator

The `/audit-logs` page includes two simulation tools:

- **Simulate Normal** — Generates a typical user session: login (known device) → navigation → small transfer → notification toggle → logout.
- **Simulate Fraud** — Generates an account takeover session: login (new device + new location) → settings changes → add unknown payee → bulk download → large transfer → logout.

Events appear in the viewer sorted by sequence number (ascending) and can be cleared manually.
