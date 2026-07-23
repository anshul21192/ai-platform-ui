import os
import json
from app.config import settings
from app.fraud_patterns import (
    SIGNAL_WEIGHTS, FRAUD_PATTERNS, RISK_BANDS, get_risk_band, 
    match_fraud_pattern, get_baseline
)

try:
    import vertexai
    from vertexai.generative_models import GenerativeModel, GenerationConfig
    HAS_VERTEX_SDK = True
except ImportError:
    HAS_VERTEX_SDK = False

try:
    from openai import OpenAI
    HAS_OPENAI_SDK = True
except ImportError:
    HAS_OPENAI_SDK = False

class AIService:
    def __init__(self):
        self.use_vertex = False
        self.use_openrouter = False
        self.vertex_model = None
        self.openai_client = None

        # 1. Attempt Vertex AI Gemini initialization (uses ADC / Attached Workload SA)
        project_id = settings.GOOGLE_CLOUD_PROJECT_ID
        location = settings.VERTEX_AI_LOCATION or "us-central1"
        if HAS_VERTEX_SDK and project_id:
            try:
                vertexai.init(project=project_id, location=location)
                self.vertex_model = GenerativeModel("gemini-1.5-flash")
                self.use_vertex = True
                print(f"[AIService] Initialized Vertex AI Gemini (gemini-1.5-flash) for project: {project_id}")
            except Exception as e:
                print(f"[AIService] Vertex AI init failed: {e}")
                self.use_vertex = False

        # 2. OpenRouter fallback if Vertex AI not configured
        if not self.use_vertex and HAS_OPENAI_SDK:
            api_key = os.getenv("OPENROUTER_API_KEY")
            if api_key:
                self.openai_client = OpenAI(
                    base_url="https://openrouter.ai/api/v1",
                    api_key=api_key,
                )
                self.model_name = "openai/gpt-4o-mini"
                self.use_openrouter = True
                print("[AIService] Initialized OpenRouter fallback client.")

    def analyze_telemetry_events(self, telemetry_context: dict, anomalies: list, events: list = None) -> dict:
        if self.use_vertex:
            return self._analyze_with_vertex(telemetry_context, anomalies)
        elif self.use_openrouter:
            return self._analyze_with_openrouter(telemetry_context, anomalies)
        else:
            return self._fallback_telemetry_analysis(telemetry_context, anomalies)

    def _build_prompt(self, telemetry_context: dict, anomalies: list) -> str:
        has_history = telemetry_context.get('has_established_history', False)
        
        return f'''
You are an advanced banking fraud detection AI system with expertise in behavioral biometrics and event pattern analysis.
Analyze this user session for suspicious behavior using the patterns, signal weights, and keystroke biometrics benchmarks below.

USER HISTORY STATUS:
- Total Verified Past Sessions Logged in DB: {telemetry_context.get('past_sessions_recorded', 0)}
- Has Established History: {has_history}

HUMAN KEYSTROKE BIOMETRICS BENCHMARKS:
- Typing Speed: Normal human range is 2.0 - 7.0 chars/sec. (>15 chars/sec indicates automated script injection / bot payload).
- Dwell Time (key press duration): Normal human range is 60ms - 150ms. (<15ms indicates synthetic key injection).
- Flight Time (inter-key pause): Normal human range is 80ms - 250ms. (<10ms indicates automated tool).
- Backspace / Error Ratio: High ratio (>40% of total keys) combined with long pauses indicates hesitation, coercion, or social engineering APP scams.

CURRENT LIVE SESSION TELEMETRY:
- Total Events: {telemetry_context.get('event_count', 0)}
- Session Duration: {telemetry_context.get('session_duration_ms', 0)}ms
- New Device Login: {telemetry_context.get('has_new_device_login', False)}
- New Location: {telemetry_context.get('has_new_location', False)}
- Current Transfer Amount: ${telemetry_context.get('current_transfer_amount', 0)}
- Sensitive Action Count: {telemetry_context.get('sensitive_action_count', 0)}
- Detected Anomalies: {', '.join(anomalies) if anomalies else 'None'}
- Keystroke Dynamics Summary: {json.dumps(telemetry_context.get('keystroke_summary', {})) if telemetry_context.get('keystroke_summary') else 'None'}

EVALUATION PROTOCOL:
1. Historical Limit Check: If Has Established History is True, do NOT penalize current transfer amount against historical max limits. Treat transfer on standalone context. If False, evaluate strictly against cold-start baselines.
2. Proportional Scoring: Avoid binary 0 or 100 extremes unless a major multi-step attack pattern is detected.
3. Keystroke Anomaly Weighting:
   - KEYSTROKE BOT SPEED / SCRIPT INJECTION -> Risk 80+
   - KEYSTROKE UNREALISTIC FLIGHT TIME -> Risk 75+
   - KEYSTROKE EXCESSIVE HESITATION / COERCION -> Risk 60+

RISK BANDS:
- LOW (0-39): Allow, normal activity
- MEDIUM (40-69): Step-up authentication required
- HIGH (70-100): Block, incident escalation

Respond in STRICT JSON format matching:
{{
    "risk_score": <integer 0-100>,
    "risk_level": "<LOW|MEDIUM|HIGH>",
    "matched_patterns": ["pattern names if any"],
    "reason": "<detailed 2-3 sentence explanation acknowledging history status and anomalies>"
}}
'''

    def _analyze_with_vertex(self, telemetry_context: dict, anomalies: list) -> dict:
        prompt = self._build_prompt(telemetry_context, anomalies)
        try:
            config = GenerationConfig(
                temperature=0.2,
                response_mime_type="application/json"
            )
            response = self.vertex_model.generate_content(
                prompt,
                generation_config=config
            )
            result = json.loads(response.text.strip())
            return {
                "risk_score": result.get("risk_score", 50),
                "risk_level": result.get("risk_level", "MEDIUM"),
                "reason": f"[Vertex AI Gemini] {result.get('reason', 'Telemetry analysis complete')}",
                "anomalies": anomalies,
                "matched_patterns": result.get("matched_patterns", [])
            }
        except Exception as e:
            print(f"[AIService] Vertex AI generation failed: {e}")
            return self._fallback_telemetry_analysis(telemetry_context, anomalies, error=f"Vertex AI error: {str(e)}")

    def _analyze_with_openrouter(self, telemetry_context: dict, anomalies: list) -> dict:
        prompt = self._build_prompt(telemetry_context, anomalies)
        try:
            response = self.openai_client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a precise fraud detection assistant that outputs only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            raw_content = response.choices[0].message.content.strip()
            result = json.loads(raw_content)
            return {
                "risk_score": result.get("risk_score", 50),
                "risk_level": result.get("risk_level", "MEDIUM"),
                "reason": result.get("reason", "Telemetry analysis complete"),
                "anomalies": anomalies,
                "matched_patterns": result.get("matched_patterns", [])
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
            risk_score += 25
            matched_patterns.append("Account Takeover (new device + transfer)")
        
        if telemetry_context.get('has_new_location') and telemetry_context.get('has_large_transfer'):
            risk_score += 20
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
            elif "RAPID_SENSITIVE" in anomaly:
                risk_score += SIGNAL_WEIGHTS["rapid_sensitive_action_sequence"]
                matched_patterns.append("Rapid Sensitive Actions")
            elif "DIRECT_ROUTE" in anomaly:
                risk_score += SIGNAL_WEIGHTS["direct_route_access"]
            elif "GUARDRAIL_REMOVAL" in anomaly:
                risk_score += SIGNAL_WEIGHTS["toggle_alerts_off_before_transfer"]
            elif "UNAUTHORIZED_SETTING" in anomaly:
                risk_score += SIGNAL_WEIGHTS["credential_change_under_2min_after_login"]
            elif "PAYEE_MANIPULATION" in anomaly:
                risk_score += SIGNAL_WEIGHTS["edit_beneficiary_then_transfer"]
            elif "RAPID_MULTIPLE" in anomaly:
                risk_score += SIGNAL_WEIGHTS["multiple_add_payee_in_session"]
            elif "BREADTH_RECONNAISSANCE" in anomaly:
                risk_score += SIGNAL_WEIGHTS["audit_logs_breadth_access"]
            elif "KEYSTROKE_BOT_SPEED" in anomaly:
                risk_score += SIGNAL_WEIGHTS.get("keystroke_bot_speed", 25)
            elif "KEYSTROKE_UNREALISTIC_FLIGHT_TIME" in anomaly:
                risk_score += SIGNAL_WEIGHTS.get("keystroke_unrealistic_flight_time", 20)
            elif "KEYSTROKE_EXCESSIVE_HESITATION" in anomaly:
                risk_score += SIGNAL_WEIGHTS.get("keystroke_excessive_hesitation", 15)
            else:
                risk_score += SIGNAL_WEIGHTS["abnormal_dwell_sensitive_screen"]
        
        # Override risk_score directly if severe fraud patterns are matched
        has_guardrail_removal = any("GUARDRAIL_REMOVAL" in a for a in anomalies)
        has_direct_route = any("DIRECT_ROUTE" in a for a in anomalies)
        has_payee_manipulation = any("PAYEE_MANIPULATION" in a for a in anomalies)
        has_rapid_payees = any("RAPID_MULTIPLE" in a for a in anomalies)
        has_bot_speed = any("KEYSTROKE_BOT_SPEED" in a for a in anomalies)
        has_unrealistic_flight = any("KEYSTROKE_UNREALISTIC_FLIGHT_TIME" in a for a in anomalies)
        has_bulk_download = any("BULK_OPERATION" in a for a in anomalies)
        has_extreme_transfer = any("EXTREME_TRANSFER" in a for a in anomalies)

        if has_bot_speed or has_unrealistic_flight:
            risk_score = max(risk_score, 88)
            matched_patterns.append("Scripted / Bot Keystroke Dynamics")
        if has_guardrail_removal:
            risk_score = max(risk_score, 85)
            matched_patterns.append("Guardrail Removal + Transfer Attack")
        if has_payee_manipulation:
            risk_score = max(risk_score, 82)
            matched_patterns.append("Payee Hijack / Redirection")
        if has_rapid_payees:
            risk_score = max(risk_score, 82)
            matched_patterns.append("Mule Network Fan-out")
        if has_bulk_download:
            risk_score = max(risk_score, 82)
            matched_patterns.append("Bulk Data Extraction")
        if has_direct_route:
            risk_score = max(risk_score, 75)
            matched_patterns.append("Navigation Anomaly (direct route access)")
        if has_extreme_transfer:
            risk_score = max(risk_score, 89)
            matched_patterns.append("Extreme Transfer Amount (>=$5000)")
        
        session_duration_ms = telemetry_context.get('session_duration_ms', 0)
        if session_duration_ms < 120000 and telemetry_context.get('sensitive_action_count', 0) > 2:
            risk_score += 10
        
        risk_score = min(risk_score, 100)
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

ai_service = AIService()