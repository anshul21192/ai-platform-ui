# Low-Level Design: AI-Based Behavioral Fraud Detection PoC

**Version:** 1.0
**Status:** Draft for Implementation
**Duration:** 2 days
**Author:** Solution Architecture

---

## 1. Objective

Demonstrate how AI (Vertex AI / Gemini with a RAG approach) can detect
behavioral fraud patterns in a banking session by comparing live user
interaction events against a pre-existing user behavioral baseline and a
curated fraud-pattern knowledge base.

### In-Scope Fraud Patterns
1. Account Takeover (rare sensitive action shortly after login from new device)
2. Data Exfiltration (bulk record download vs. baseline)
3. Navigation Sequence Anomaly (unusual screen flow)

### Out of Scope
- Model training / fine-tuning
- Real PII / production data
- Keystroke/mouse biometrics (future phase)
- Production-grade auth, persistence, scaling

---

## 2. Assumptions

| # | Assumption |
|---|------------|
| A1 | All data is synthetic; no real PII sent to Vertex AI. |
| A2 | User baselines are pre-computed and stored as JSON files. |
| A3 | 2–3 demo users ship with the PoC. |
| A4 | New-device / new-geo signals are simulated via a UI toggle. |
| A5 | RAG vector search runs in-memory (swappable for Vertex Vector Search in prod). |
| A6 | Baseline retrieval is a direct keyed lookup (userId), not vector search. |
| A7 | Risk scoring is performed by Gemini; code only pre-computes signals. |
| A8 | AI is called on sensitive-action flush and at session end (not per keystroke). |

---

## 3. High-Level Architecture

```
┌──────────────┐   events   ┌─────────────────────────────────┐   RAG    ┌──────────────┐
│  React UI    │ ─────────► │      Node.js / Express          │ ───────► │  Vertex AI   │
│ (mock bank)  │            │  Aggregate → Retrieve → Prompt  │          │   (Gemini)   │
│ EventTracker │ ◄───────── │  → Score → Return               │ ◄─────── │ text-embed-004│
└──────────────┘  risk JSON └─────────────────────────────────┘          └──────────────┘
                                      │
                              ┌───────┴────────┐
                              │ baselines/*.json│
                              │ fraud-patterns  │
                              └────────────────┘
```

---

## 4. Component Design

### 4.1 Frontend (React)

**Screens**
| Screen | Route | Emits Actions |
|--------|-------|---------------|
| Login | `/login` | `LOGIN` (+ `newDevice` flag) |
| Dashboard | `/dashboard` | `VIEW_DASHBOARD` |
| Accounts | `/accounts` | `VIEW_ACCOUNTS` |
| Transactions | `/transactions` | `VIEW_TRANSACTIONS` |
| Statements | `/statements` | `BULK_DOWNLOAD` (metadata.recordCount) |
| Transfer | `/transfer` | `ADD_PAYEE`, `TRANSFER` |
| Settings | `/settings` | `CHANGE_EMAIL`, `CHANGE_MOBILE`, `CHANGE_PASSWORD` |

**EventTracker Module**
- Generates one `sessionId` per session (UUID).
- Maintains monotonic `seq`.
- Computes `dwellFromPrevMs`.
- Buffers events; flushes on sensitive action, 5s timer, and logout.

**Event Schema**
```json
{
  "userId": "U1023",
  "sessionId": "S-uuid",
  "seq": 3,
  "action": "CHANGE_EMAIL",
  "ts": 1700000000000,
  "dwellFromPrevMs": 4200,
  "metadata": { "newDevice": true, "recordCount": 0 }
}
```

**Sensitive actions (trigger immediate flush)**
`CHANGE_EMAIL, CHANGE_MOBILE, CHANGE_PASSWORD, ADD_PAYEE, TRANSFER, BULK_DOWNLOAD`

---

### 4.2 Backend (Node.js + Express)

**Directory Layout**
```
backend/
├── src/
│   ├── index.js                 # Express bootstrap
│   ├── routes/events.js         # POST /events, GET /session/:id
│   ├── store/baselineStore.js   # load user baselines
│   ├── scoring/
│   │   ├── summarize.js         # session -> NL summary
│   │   ├── signals.js           # deterministic pre-checks
│   │   └── aiRiskEngine.js      # orchestrates RAG + Gemini
│   ├── ai/
│   │   ├── vertexClient.js      # Gemini model client
│   │   ├── embeddings.js        # text-embedding-004
│   │   ├── retriever.js         # cosine similarity retrieval
│   │   └── prompt.js            # grounded prompt builder
│   └── data/
│       ├── baselines/U1023.json
│       └── fraud-patterns/patterns.json
├── .env                         # GCP_PROJECT, LOCATION
└── package.json
```

**API Contract**

`POST /events`
```json
// Request
{ "sessionId": "S-uuid", "events": [ /* Event[] */ ] }

// Response
{
  "riskScore": 85,
  "riskBand": "HIGH",
  "matchedTypologies": ["Account Takeover", "Data Exfiltration"],
  "reasons": [
    "CHANGE_EMAIL performed 90s after login (historical freq 0%)",
    "Bulk download of 500 records vs avg 6",
    "Login from unrecognized device"
  ],
  "recommendedAction": "BLOCK"
}
```

---

### 4.3 Data Model — User Baseline

```json
{
  "userId": "U1023",
  "typicalSequences": [
    ["LOGIN","VIEW_DASHBOARD","VIEW_ACCOUNTS","LOGOUT"]
  ],
  "actionFrequency": {
    "VIEW_DASHBOARD": 0.95,
    "CHANGE_EMAIL": 0.00,
    "BULK_DOWNLOAD": 0.02
  },
  "avgRecordsPerSession": 6,
  "avgSessionDurationSec": 90,
  "commonLoginHours": [8,9,18,19,20]
}
```

### 4.4 Data Model — Fraud Pattern (RAG corpus)

```json
{
  "id": "ATO-001",
  "typology": "Account Takeover",
  "description": "Login from a new device followed within minutes by changes to contact details or password, then transfers.",
  "indicators": ["new_device","credential_change_after_login","add_payee","large_transfer"]
}
```

---

## 5. Scoring Pipeline (Sequence)

```
1. POST /events received
2. baselineStore.load(userId)              -> profile (direct lookup)
3. signals.compute(profile, events)        -> preSignals (facts)
4. summarize(events)                        -> NL session summary
5. retriever.topK(summary, k=3)             -> retrieved fraud patterns  [RAG]
6. prompt.build(profile, events, preSignals, patterns)
7. vertexClient.generateContent(prompt)     -> JSON risk verdict
8. parse & return to UI
```

### 5.1 Deterministic Pre-Signals (grounding)
Computed in code, passed to the model to reduce hallucination:
- `rareActionsDetected[]` (freq < 0.05 and sensitive)
- `downloadVolume` vs `avgRecordsPerSession`
- `sensitiveActionAfterLoginSec`
- `newDevice`
- `sequenceDeviation` (1st-order Markov unlikelihood)

### 5.2 RAG Retrieval
- Pre-embed all fraud-pattern descriptions at startup (`text-embedding-004`).
- Embed session NL summary at request time.
- Cosine similarity → top-3 patterns.

### 5.3 Vertex AI Call
- Model: `gemini-1.5-pro`
- `temperature: 0.1`, `responseMimeType: application/json`
- Prompt sections: BASELINE | SESSION EVENTS | PRE-COMPUTED SIGNALS | RETRIEVED PATTERNS | OUTPUT SCHEMA

**Output Schema (enforced)**
```json
{
  "riskScore": 0,
  "riskBand": "LOW|MEDIUM|HIGH",
  "matchedTypologies": [],
  "reasons": [],
  "recommendedAction": "ALLOW|STEP_UP_AUTH|BLOCK"
}
```

---

## 6. Configuration

```
# .env
GCP_PROJECT=db-uat-x49q-mp-cbps
GCP_LOCATION=europe-west3
GEMINI_MODEL=gemini-1.5-pro
EMBED_MODEL=text-embedding-004
```

**Auth:** Application Default Credentials (`gcloud auth application-default login`)
or service account key in the sandbox project.

---

## 7. Error Handling & Fallback

| Scenario | Handling |
|----------|----------|
| Vertex timeout / error | Fall back to deterministic `signals` score; flag `aiUnavailable=true` |
| Invalid JSON from model | Retry once; else fallback score |
| Unknown userId | Treat as no baseline → higher default risk |
| Empty event batch | 204 No Content |

---

## 8. Non-Functional (PoC-level)

| Aspect | Target |
|--------|--------|
| Latency (AI call) | < 3s per scoring call |
| AI call frequency | Sensitive-action flush + session end only |
| Data | Synthetic, PII-free |
| Persistence | Files (JSON); in-memory session cache |

---

## 9. Demo Script

1. **Genuine session:** login (known device) → dashboard → accounts → logout → risk LOW (~10).
2. **Fraud session:** toggle *new device* → login → Settings → Change Email → Add Payee → Bulk download 500 records → Transfer.
3. Risk climbs in real time; final verdict **HIGH / BLOCK** with AI-generated reasons and matched typologies.

---

## 10. Task Breakdown (2 Days)

| Day | Slot | Task | Owner |
|-----|------|------|-------|
| 1 | AM | React app + EventTracker + screens | FE |
| 1 | PM | Node backend, `/events`, baseline store, buffering | BE |
| 2 | AM | Vertex client, embeddings, retriever, pre-signals | BE |
| 2 | PM | Grounded prompt, wire risk JSON to dashboard, demo polish | FE+BE |

---

## 11. Future Enhancements
- Vertex AI Vector Search for large fraud-pattern corpus
- Keystroke/mouse biometric layer
- Persist sessions to Firestore/BigQuery
- Real device fingerprinting & geo-velocity
- Feedback loop to refine baselines