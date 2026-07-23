# 🔐 Real-Time AI Behavioral Anomaly & Fraud Detection Engine

An enterprise-grade backend system for detecting fraudulent behavior in banking applications using AI-powered event sequence analysis.

---

## 🚀 Quick Start

### 1️⃣ Clone Repository
```bash
git clone https://github.com/anshul21192/ai-platform-service.git
cd behaviour-anamaly-poc
```

### 2️⃣ Activate venv
On macOS / Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```
On Windows:
```cmd
python -m venv venv
venv\Scripts\activate
```

### 2️⃣ Install Dependencies
```bash
pip install -r requirements.txt
```

### 3️⃣ Configure Environment

Create a `.env` file in the project root with:

```env
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
VERTEX_AI_LOCATION=us-central1
DATABASE_URL=sqlite:///./data/behaviour.db
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# use this for gemini api
GEMINI_API_KEY=
# use this for vertex ai


(get the account key json and store at the root backend folder )
$env:GOOGLE_APPLICATION_CREDENTIALS="c:\Users\shagun\Downloads\ai-platform-ui\backend\service-account-key.json"
GOOGLE_CLOUD_PROJECT_ID=
VERTEX_AI_LOCATION=
OPENROUTER_API_KEY=

```




### 4️⃣ Setup Google Cloud Authentication
```bash
gcloud auth application-default login
```

### 5️⃣ Run the Server
```bash
uvicorn app.main:app --reload --port 8000
```

**Server is now running:**
- API: `http://localhost:8000`
- Swagger Docs: `http://localhost:8000/docs`

---

## 📡 Test the API

### Example: Submit Events for Fraud Analysis

```bash
{
  "sessionId": "session-testuser-low-01",
  "events": [
    {
      "userId": "testuser",
      "sessionId": "session-testuser-low-01",
      "seq": 1,
      "action": "LOGIN",
      "ts": 1784600000000,
      "dwellFromPrevMs": 0,
      "metadata": { "newDevice": false, "newLocation": false }
    },
    {
      "userId": "testuser",
      "sessionId": "session-testuser-low-01",
      "seq": 2,
      "action": "VIEW_DASHBOARD",
      "ts": 1784600003000,
      "dwellFromPrevMs": 3000,
      "metadata": {}
    },
    {
      "userId": "testuser",
      "sessionId": "session-testuser-low-01",
      "seq": 3,
      "action": "VIEW_TRANSACTIONS",
      "ts": 1784600007000,
      "dwellFromPrevMs": 4000,
      "metadata": {}
    }
  ]
}

```

**Response:**
```json
{
  "status": "ACCEPTED",
  "message": "Telemetry events ingested and analyzed",
  "eventsProcessed": 3,
  "riskAssessment": {
    "risk_score": 10,
    "risk_level": "LOW",
    "anomalies": [],
    "recommendation": "No immediate action required.",
    "action_taken": "Logged entry. No anomaly action requirements.",
    "reason": "The user has no established history, and the current session shows no anomalies or sensitive actions. The transfer amount is $0.0, which is consistent with normal activity for a new user. Therefore, the risk score is low."
  }
}

```


---

## ⚙️ Environment Variables

| Variable | Example | Description |
|----------|---------|-------------|
| `GOOGLE_CLOUD_PROJECT_ID` | `my-project-123` | GCP project ID for Vertex AI |
| `VERTEX_AI_LOCATION` | `us-central1` | Vertex AI region |
| `DATABASE_URL` | `sqlite:///./data/behaviour.db` | SQLite database path |
| `SMTP_SERVER` | `smtp.gmail.com` | Email server |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USERNAME` | `your-email@gmail.com` | Gmail address |
| `SMTP_PASSWORD` | `xxxx xxxx xxxx xxxx` | Gmail App Password |

### Get Gmail App Password:
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification
3. Search "App passwords"
4. Select Mail → Windows Computer
5. Copy the 16-character password → paste in `.env`

### Get GCP Project ID:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Copy the **Project ID**
4. Enable Vertex AI API

---

## 🧪 API Endpoints

**POST** `/api/v1/fraud/telemetry/events` - Submit telemetry events for analysis

**GET** `/api/v1/fraud/telemetry/events/{session_id}` - Get events by session

**GET** `/api/v1/fraud/telemetry/sessions/{user_id}` - Get user sessions

---




## 🐛 Troubleshooting

**Port 8000 already in use:**
```bash
python -m uvicorn app.main:app --reload --port 8001
```

**Authentication error:**
```bash
gcloud auth application-default login
```

**Install dependencies issue:**
```bash
pip install --upgrade pip
pip install -r requirements.txt
```
