import os
import json
from google.cloud import aiplatform
from vertexai.preview.generative_models import GenerativeModel
from app.fraud_patterns import (
    SIGNAL_WEIGHTS, FRAUD_PATTERNS, RISK_BANDS, get_risk_band, 
    match_fraud_pattern, get_baseline
)

# OPTIONAL: Uncomment below to use direct Gemini API instead of Vertex AI
# import google.generativeai as genai

class AIService:
    def __init__(self):
        # ============ VERTEX AI INTEGRATION (ACTIVE) ============
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
        location = os.getenv("VERTEX_AI_LOCATION", "us-central1")
        
        if project_id:
            aiplatform.init(project=project_id, location=location)
            # Utilizing the optimized Gemini model from Vertex AI for processing unstructured evaluation structures
            self.model = GenerativeModel("gemini-1.5-flash")
            self.model_type = "vertex_ai"
        else:
            self.model = None
            self.model_type = None
        
        # ============ GEMINI API INTEGRATION (COMMENTED - OPTIONAL) ============
        # Uncomment the following lines to use direct Gemini API instead of Vertex AI
        # api_key = os.getenv("GEMINI_API_KEY")
        # if api_key:
        #     genai.configure(api_key=api_key)
        #     self.model = genai.GenerativeModel("gemini-1.5-flash")
        #     self.model_type = "gemini_api"
        # else:
        #     self.model = None
        #     self.model_type = None

    # ============ NEW: TELEMETRY EVENT ANALYSIS (Primary) ============
    def analyze_telemetry_events(self, telemetry_context: dict, anomalies: list, events: list = None) -> dict:
        """
        Analyze fraud risk using telemetry events from the UI.
        
        Args:
            telemetry_context: Dict with event statistics
            anomalies: List of detected anomalies
            events: Raw event list (optional, for additional context)
        
        Returns:
            {
                "risk_score": int (0-100),
                "risk_level": "LOW|MEDIUM|HIGH",
                "reason": str,
                "anomalies": list
            }
        """
        if not self.model:
            return self._fallback_telemetry_analysis(telemetry_context, anomalies)
        
        # Build detailed analysis prompt with fraud patterns context
        fraud_patterns_context = "\n".join([
            f"- {p['typology']}: {p['name']} (score: {p['risk_score_if_matched']})"
            for p in FRAUD_PATTERNS
        ])
        
        signal_weights_context = "\n".join([
            f"- {k}: {v} points" for k, v in list(SIGNAL_WEIGHTS.items())[:10]
        ])
        
        prompt = f'''
You are an advanced banking fraud detection AI system with expertise in behavioral fraud patterns.
Analyze this user session for suspicious behavior using the patterns and signal weights below.

KNOWN FRAUD PATTERNS (Typologies):
{fraud_patterns_context}

KEY SIGNAL WEIGHTS (Evidence-Based):
{signal_weights_context}

SESSION TELEMETRY CONTEXT:
- Total Events: {telemetry_context.get('event_count', 0)}
- Session Duration: {telemetry_context.get('session_duration_ms', 0)}ms ({telemetry_context.get('session_duration_ms', 0) / 60000:.1f} minutes)
- New Device Login: {telemetry_context.get('has_new_device_login', False)}
- New Location: {telemetry_context.get('has_new_location', False)}
- Large Transfer (>$10k): {telemetry_context.get('has_large_transfer', False)}
- Settings Changes Count: {telemetry_context.get('settings_changes', 0)}
- Sensitive Action Count: {telemetry_context.get('sensitive_action_count', 0)}
- Detected Anomalies: {', '.join(anomalies) if anomalies else 'None'}

FRAUD DETECTION SCORING GUIDELINES:
- NEW DEVICE + TRANSFER → Risk starts at 70+
- NEW LOCATION + LARGE TRANSFER → Risk 70+
- MULTIPLE SETTINGS CHANGES (3+) → Risk 60+
- BULK OPERATIONS (>10x baseline) → Risk 70+
- RAPID SENSITIVE ACTIONS → Risk 60+
- DIRECT ROUTE ACCESS (no predecessor) → Risk 65+
- Each anomaly detected → +15 points
- Rare action with safe context → Risk 30-50 (evaluate carefully)

RISK BANDS:
- LOW (0-39): Allow, normal activity
- MEDIUM (40-69): Step-up authentication required
- HIGH (70-100): Block, incident escalation

Respond in STRICT JSON format:
{{
    "risk_score": <integer 0-100>,
    "risk_level": "<LOW|MEDIUM|HIGH>",
    "matched_patterns": ["pattern names if any"],
    "reason": "<detailed 2-3 sentence explanation citing specific signals>"
}}
'''
        try:
            response = self.model.generate_content(prompt, generation_config={"temperature": 0.2})
            clean_json = response.text.strip().replace("```json", "").replace("```", "").strip()
            result = json.loads(clean_json)
            return {
                "risk_score": result.get("risk_score", 50),
                "risk_level": result.get("risk_level", "MEDIUM"),
                "reason": result.get("reason", "Telemetry analysis complete"),
                "anomalies": result.get("anomalies", anomalies)
            }
        except Exception as e:
            return self._fallback_telemetry_analysis(telemetry_context, anomalies, error=str(e))

    def _fallback_telemetry_analysis(self, telemetry_context: dict, anomalies: list, error: str = None) -> dict:
        """
        Rule-based fraud analysis fallback using signal weights from fraud patterns catalogue.
        """
        risk_score = 0
        matched_patterns = []
        
        # Apply signal weights for key indicators
        if telemetry_context.get('has_new_device_login'):
            risk_score += SIGNAL_WEIGHTS["LOGIN_new_device"]
            
        if telemetry_context.get('has_new_location'):
            risk_score += SIGNAL_WEIGHTS["LOGIN_new_location"]
        
        # Amplify if new device/location + large transfer
        if telemetry_context.get('has_new_device_login') and telemetry_context.get('has_large_transfer'):
            risk_score += 25  # Extra weight for ATO pattern
            matched_patterns.append("Account Takeover (new device + transfer)")
        
        if telemetry_context.get('has_new_location') and telemetry_context.get('has_large_transfer'):
            risk_score += 20  # Extra weight for geographic anomaly
            matched_patterns.append("Geographic Anomaly (new location + transfer)")
        
        # Credential changes
        if telemetry_context.get('settings_changes', 0) >= 3:
            risk_score += SIGNAL_WEIGHTS["credential_change_rare"]
            matched_patterns.append("Multiple Credential Changes")
        elif telemetry_context.get('settings_changes', 0) > 0:
            risk_score += 15
        
        # Anomaly scoring
        for anomaly in anomalies:
            if "BULK_OPERATION" in anomaly:
                risk_score += SIGNAL_WEIGHTS["bulk_download_over_10x_baseline"]
                matched_patterns.append("Data Exfiltration (bulk download)")
            elif "RAPID_SENSITIVE" in anomaly:
                risk_score += SIGNAL_WEIGHTS["rapid_sensitive_action_sequence"]
                matched_patterns.append("Rapid Sensitive Actions")
            elif "DIRECT_ROUTE" in anomaly:
                risk_score += SIGNAL_WEIGHTS["direct_route_access"]
                matched_patterns.append("Navigation Anomaly (direct route access)")
            elif "UNAUTHORIZED_SETTING" in anomaly:
                risk_score += SIGNAL_WEIGHTS["toggle_alerts_off_before_transfer"]
                matched_patterns.append("Guardrail Removal")
            else:
                risk_score += SIGNAL_WEIGHTS["abnormal_dwell_sensitive_screen"]
        
        # Session duration scoring
        session_duration_ms = telemetry_context.get('session_duration_ms', 0)
        if session_duration_ms < 120000 and telemetry_context.get('sensitive_action_count', 0) > 2:
            risk_score += 10  # Rapid suspicious actions
        
        risk_score = min(risk_score, 100)
        
        # Determine risk level based on RISK_BANDS
        risk_band_info = get_risk_band(risk_score)
        risk_level = risk_band_info["name"]
        
        reason = f"Rule-based analysis: {len(anomalies)} anomalies detected, {telemetry_context.get('sensitive_action_count', 0)} sensitive actions"
        if matched_patterns:
            reason = f"Pattern match: {', '.join(matched_patterns[:2])}. Score: {risk_score}/100"
        if error:
            reason += f" (AI fallback: {error[:30]})"
        
        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "reason": reason,
            "anomalies": anomalies,
            "matched_patterns": matched_patterns
        }

    # ============ LEGACY: BEHAVIOR PATTERN ANALYSIS (COMMENTED OUT - Deprecated) ============
    # def analyze_pattern(self, payload: dict, baseline: dict = None) -> dict:
    #     """
    #     DEPRECATED - Old method for analyzing typing speed, tab switches, and mouse idle time.
    #     No longer used. Use analyze_telemetry_events() instead for event-based fraud detection.
    #     
    #     This method is kept commented for reference only.
    #     Kept for backward compatibility but not recommended.
    #     """
    #     if not self.model:
    #         return self._fallback_rule_engine(payload)
    #         
    #     # 1. Build historical context if a baseline exists
    #     baseline_str = "No historical baseline available for this user (First-time session)."
    #     if baseline:
    #         baseline_str = f"""
    #         ESTABLISHED HISTORICAL BASELINE (Normal Patterns):
    #         - Avg Typing Speed: {baseline['avg_typing_speed']} WPM
    #         - Avg Tab Switches: {baseline['avg_tab_switches']} per session
    #         - Avg Mouse Idle Time: {baseline['avg_mouse_idle']} seconds
    #         - Total Verified Safe Sessions Analyzed: {baseline['total_sessions']}
    #         """
    #         
    #     # 2. Re-engineer prompt to focus on statistical variance
    #     prompt = f'''
    #     You are an advanced banking behavioral biometrics system. 
    #     Analyze the variance between this user's established historical baseline profile and their current live session telemetry to detect anomalies or session hijacking.

    #     {baseline_str}

    #     CURRENT LIVE SESSION TELEMETRY (To evaluate):
    #     - Typing Speed: {payload['typing_speed_wpm']} WPM
    #     - Tab Switches: {payload['tab_switches']}
    #     - Mouse Idle Time: {payload['mouse_idle_time_sec']} seconds
    #     - Known Device: {payload['known_device']}
    #     - IP Changed: {payload['ip_changed']}

    #     EVALUATION PROTOCOL:
    #     - If a baseline exists, minor fluctuations are expected. Flag massive spikes or changes (e.g., typing speed jumping 4x, or tab switches spiking heavily compared to their baseline).
    #     - If no baseline exists, evaluate the parameters strictly against standard human usage benchmarks.

    #     Respond strictly in JSON format with exactly these keys:
    #     - "risk_score": an integer from 0 to 100
    #     - "risk_level": "LOW", "MEDIUM", or "HIGH"
    #     - "reason": a short explanation sentence highlighting the exact baseline variance.
    #     '''
    #     try:
    #         # Enforce predictable variance outputs
    #         response = self.model.generate_content(prompt, generation_config={"temperature": 0.2})
    #         clean_json = response.text.strip().replace("```json", "").replace("```", "")
    #         return json.loads(clean_json)
    #     except Exception as e:
    #         return {"risk_score": 50, "risk_level": "MEDIUM", "reason": f"AI Parsing Fallback: {str(e)}"}

    # def _fallback_rule_engine(self, payload: dict) -> dict:
    #     """
    #     DEPRECATED - Standard safety rule engine fallback for old typing speed schema.
    #     Use fallback telemetry analysis instead.
    #     """
    #     typing_speed = payload.get("typing_speed_wpm", 0)
    #     if typing_speed > 300:
    #         return {
    #             "risk_score": 90,
    #             "risk_level": "HIGH",
    #             "reason": "Rule Engine Fallback: Typing speed exceeds realistic physical capacities."
    #         }
    #     return {
    #         "risk_score": 15,
    #         "risk_level": "LOW",
    #         "reason": "Rule Engine Fallback: Standard operating metrics recorded."
    #     }

# 🚨 THIS LINE IS WHAT RESOLVES THE IMPORT ERROR:
# It instantiates the class so the router can import the shared 'ai_service' object.
ai_service = AIService()