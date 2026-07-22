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
    "reason": "<detailed 2-3 sentence explanation acknowledging the user's history status and evaluating anomalies proportionally>",
    "executive_summary": "<business-friendly executive summary with headings and bullet reasons>",
    "dora_report": "<structured DORA incident report with Operational Incident, Severity, Root Cause, Timeline, Controls Triggered, Evidence, Recommended Controls, DORA Report>"
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
            
            executive_summary = result.get("executive_summary")
            if not executive_summary:
                executive_summary = self._build_executive_summary(
                    result.get("risk_level", "MEDIUM"),
                    result.get("reason", "Telemetry analysis complete"),
                    anomalies,
                    telemetry_context
                )

            dora_report = result.get("dora_report")
            if not dora_report:
                dora_report = self._build_dora_report(
                    result.get("risk_level", "MEDIUM"),
                    result.get("reason", "Telemetry analysis complete"),
                    anomalies,
                    telemetry_context
                )
            
            return {
                "risk_score": result.get("risk_score", 50),
                "risk_level": result.get("risk_level", "MEDIUM"),
                "reason": result.get("reason", "Telemetry analysis complete"),
                "anomalies": anomalies,
                "matched_patterns": result.get("matched_patterns", []),
                "executive_summary": executive_summary,
                "dora_report": dora_report
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
        
        executive_summary = self._build_executive_summary(risk_level, reason, anomalies, telemetry_context)
        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "reason": reason,
            "anomalies": anomalies,
            "matched_patterns": matched_patterns,
            "executive_summary": executive_summary
        }

    def _build_executive_summary(self, risk_level: str, reason: str, anomalies: list, telemetry_context: dict) -> str:
        """Build a business-friendly executive summary for the fraud decision."""
        if risk_level == "HIGH":
            summary_header = "Executive Summary\n\nThis session resembles Account Takeover or high-risk fraud behavior."
        elif risk_level == "MEDIUM":
            summary_header = "Executive Summary\n\nThis session shows suspicious behavior that warrants step-up review."
        else:
            summary_header = "Executive Summary\n\nThis session appears normal with no major fraud patterns detected."

        reason_lines = []
        if telemetry_context.get("has_new_device_login"):
            reason_lines.append("New device login detected")
        if telemetry_context.get("has_new_location"):
            reason_lines.append("Login from an unfamiliar location")
        if telemetry_context.get("has_large_transfer"):
            reason_lines.append("Large transfer amount compared to baseline")
        if telemetry_context.get("sensitive_action_count", 0) > 0:
            reason_lines.append(f"{telemetry_context.get('sensitive_action_count')} sensitive action(s) performed")
        if telemetry_context.get("keystroke_summary"):
            ks = telemetry_context["keystroke_summary"]
            if ks.get("typingSpeed"):
                reason_lines.append(f"Typing cadence deviated by {ks['typingSpeed']} WPM or equivalent")
            if ks.get("averageFlightTime") and ks["averageFlightTime"] < 15:
                reason_lines.append("Mouse/typing movements were robotic or scripted")
            if ks.get("pauseCount") and ks["pauseCount"] >= 4:
                reason_lines.append("Excessive hesitation or editing behavior detected")

        anomaly_map = {
            "BULK_OPERATION_DETECTED": "Bulk operation spike detected",
            "RAPID_SENSITIVE_ACTION_SEQUENCE": "Multiple sensitive actions executed rapidly",
            "DIRECT_ROUTE_ACCESS": "Direct route access to sensitive function",
            "UNAUTHORIZED_SETTING_CHANGE": "Guardrails disabled before payment",
            "PAYEE_MANIPULATION_PATTERN": "Payee edited or added immediately before transfer",
            "RAPID_MULTIPLE_PAYEES": "Multiple new payees added rapidly",
            "GUARDRAIL_REMOVAL_BEFORE_TRANSFER": "Alerts toggled off before transfer",
            "BREADTH_RECONNAISSANCE": "Broad reconnaissance of sensitive pages",
            "KEYSTROKE_BOT_SPEED": "Typing speed indicates scripted input",
            "KEYSTROKE_UNREALISTIC_FLIGHT_TIME": "Keystroke timing appears automated",
            "KEYSTROKE_EXCESSIVE_HESITATION": "Erratic keystroke behavior suggests coercion or fraud"
        }
        for anomaly in anomalies:
            label = anomaly_map.get(anomaly, anomaly.replace("_", " ").title())
            if label not in reason_lines:
                reason_lines.append(label)

        if not reason_lines:
            reason_lines = ["No strong fraud signals detected in the session."]

        action_lines = []
        if risk_level == "HIGH":
            action_lines = [
                "Hold transaction",
                "Notify customer",
                "Escalate to Fraud Team"
            ]
        elif risk_level == "MEDIUM":
            action_lines = [
                "Require additional verification",
                "Monitor the session closely"
            ]
        else:
            action_lines = [
                "Allow transaction",
                "Continue monitoring"
            ]

        summary = [summary_header, "\nReasons"]
        for line in reason_lines:
            summary.append(f"• {line}")
        summary.append("\nRecommended Action")
        for line in action_lines:
            summary.append(f"✔ {line}")
        summary.append(f"\nDetails: {reason}")

        return "\n".join(summary)

    def _build_dora_report(self, risk_level: str, reason: str, anomalies: list, telemetry_context: dict) -> str:
        """Build a DORA-style incident report."""
        incident_title = "Operational Incident"
        severity = risk_level
        root_cause = "Unusual fraud behavior detected by telemetry and behavioral anomaly scoring."
        if risk_level == "HIGH":
            root_cause = "Probable account takeover with scripted behavior and guardrail bypass."
        elif risk_level == "MEDIUM":
            root_cause = "Suspicious transaction behavior with elevated risk signals."

        timeline = (
            f"Session events: {telemetry_context.get('event_count', 0)}. "
            f"Duration: {telemetry_context.get('session_duration_ms', 0)} ms. "
            f"Sensitive actions: {telemetry_context.get('sensitive_action_count', 0)}."
        )

        controls = []
        if telemetry_context.get('has_new_device_login'):
            controls.append("New device login detected")
        if telemetry_context.get('has_new_location'):
            controls.append("Unfamiliar location detected")
        if telemetry_context.get('has_large_transfer'):
            controls.append("Large transfer threshold monitoring")
        for anomaly in anomalies:
            controls.append(anomaly.replace("_", " ").title())

        evidence_lines = []
        if telemetry_context.get('keystroke_summary'):
            ks = telemetry_context['keystroke_summary']
            if ks.get('typingSpeed'):
                evidence_lines.append(f"Typing speed: {ks['typingSpeed']} WPM")
            if ks.get('averageFlightTime'):
                evidence_lines.append(f"Flight time: {ks['averageFlightTime']} ms")
            if ks.get('pauseCount') is not None:
                evidence_lines.append(f"Pause count: {ks['pauseCount']}")
        if anomalies:
            evidence_lines.append(f"Anomaly signals: {', '.join(anomalies)}")
        if telemetry_context.get('has_new_device_login') or telemetry_context.get('has_new_location'):
            evidence_lines.append("Login context: new device/location")

        if not controls:
            controls.append("Standard session monitoring")
        if not evidence_lines:
            evidence_lines.append("Telemetry evidence collected from session events.")

        recommended_controls = []
        if risk_level == "HIGH":
            recommended_controls = [
                "Hold transaction",
                "Notify customer",
                "Escalate to fraud team",
                "Initiate formal incident report"
            ]
        elif risk_level == "MEDIUM":
            recommended_controls = [
                "Require additional verification",
                "Monitor activity closely",
                "Review transaction before settlement"
            ]
        else:
            recommended_controls = [
                "Allow transaction",
                "Continue standard monitoring"
            ]

        dora_report = [
            "Operational Incident",
            f"Severity: {severity}",
            f"Root Cause: {root_cause}",
            f"Timeline: {timeline}",
            "Controls Triggered:",
        ]
        for control in controls:
            dora_report.append(f"- {control}")
        dora_report.append("Evidence:")
        for evidence in evidence_lines:
            dora_report.append(f"- {evidence}")
        dora_report.append("Recommended Controls:")
        for control in recommended_controls:
            dora_report.append(f"- {control}")
        dora_report.append("DORA Report: This incident summary is generated to support operational resilience and regulatory reporting.")

        return "\n".join(dora_report)

ai_service = AIService()