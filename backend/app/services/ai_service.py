import os
import json
from openai import OpenAI
from app.fraud_patterns import (
    SIGNAL_WEIGHTS, FRAUD_PATTERNS, RISK_BANDS, get_risk_band, 
    match_fraud_pattern, get_baseline
)
class AIService:
    def __init__(self):
        # Initialize OpenRouter client
        api_key = os.getenv("OPENROUTER_API_KEY")
        if api_key:
            self.client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=api_key,
            )
            # Choose any model available on OpenRouter
            self.model_name = "openai/gpt-4o-mini"  # or "meta-llama/llama-3-70b-instruct"
        else:
            self.client = None

    def analyze_telemetry_events(self, telemetry_context: dict, anomalies: list, events: list = None) -> dict:
        if not self.client:
            return self._fallback_telemetry_analysis(telemetry_context, anomalies)
        
        fraud_patterns_context = "\n".join([
            f"- {p['typology']}: {p['name']} (score: {p['risk_score_if_matched']})"
            for p in FRAUD_PATTERNS
        ])
        
        signal_weights_context = "\n".join([
            f"- {k}: {v} points" for k, v in SIGNAL_WEIGHTS.items()
        ])
        
        has_history = telemetry_context.get('has_established_history', False)
        
        # PROMPT UPDATED TO RESPECT ESTABLISHED HISTORY RULE
        prompt = f'''
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
1. **Historical Limit Check**: 
   - If `Has Established History` is **True**, you **MUST NOT** evaluate or penalize the current transfer amount against any historical maximum limit. Treat the transfer amount purely on its standalone context.
   - If `Has Established History` is **False** (brand-new user), evaluate transfer amounts strictly against standard cold-start baselines.
2. **Proportional Scoring**: Avoid binary 0 or 100 extremes unless a major multi-step attack pattern (like an ATO chain or guardrail removal) is explicitly detected in the anomalies. A new device login with a standard transfer for an established user should yield a balanced LOW or MEDIUM risk score.

 KEYSTROKE BOT SPEED / SCRIPT INJECTION → Risk 80+
- KEYSTROKE UNREALISTIC FLIGHT TIME → Risk 75+
- KEYSTROKE EXCESSIVE HESITATION / COERCION → Risk 60+

RISK BANDS:
- LOW (0-39): Allow, normal activity
- MEDIUM (40-69): Step-up authentication required
- HIGH (70-100): Block, incident escalation

Respond in STRICT JSON format:
{{
    "risk_score": <integer 0-100>,
    "risk_level": "<LOW|MEDIUM|HIGH>",
    "matched_patterns": ["pattern names if any"],
    "reason": "<detailed 2-3 sentence explanation acknowledging the user's history status and evaluating anomalies proportionally>"
}}
'''
        try:
            response = self.client.chat.completions.create(
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
            elif "KEYSTROKE_BOT_SPEED" in anomaly:
                risk_score += SIGNAL_WEIGHTS.get("keystroke_bot_speed", 25)
                matched_patterns.append("Scripted / Bot Keystroke Speed")
            elif "KEYSTROKE_UNREALISTIC_FLIGHT_TIME" in anomaly:
                risk_score += SIGNAL_WEIGHTS.get("keystroke_unrealistic_flight_time", 20)
                matched_patterns.append("Unrealistic Keystroke Flight Time")
            elif "KEYSTROKE_EXCESSIVE_HESITATION" in anomaly:
                risk_score += SIGNAL_WEIGHTS.get("keystroke_excessive_hesitation", 15)
                matched_patterns.append("Coerced / Erratic Keystroke Behavior")
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

ai_service = AIService()