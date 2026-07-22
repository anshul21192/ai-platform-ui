"""
Fraud Pattern Library & Signal Weights
Incorporates behavioral fraud detection patterns and signal weights
from the comprehensive risk scenarios catalogue.
"""

# ============ RISK BANDS ============
RISK_BANDS = {
    "LOW": {"range": (0, 39), "action": "ALLOW"},
    "MEDIUM": {"range": (40, 69), "action": "STEP_UP_AUTH"},
    "HIGH": {"range": (70, 100), "action": "BLOCK"}
}

# ============ SIGNAL WEIGHTS (Evidence-Based Scoring) ============
SIGNAL_WEIGHTS = {
    "LOGIN_new_device": 15,
    "LOGIN_new_location": 10,
    "LOGIN_lockout_before_success": 25,
    "credential_change_rare": 30,
    "credential_change_under_2min_after_login": 20,
    "add_payee_then_transfer": 25,
    "edit_beneficiary_then_transfer": 30,
    "multiple_add_payee_in_session": 30,
    "transfer_above_baseline_max": 20,
    "bulk_download_over_10x_baseline": 30,
    "toggle_alerts_off_before_transfer": 30,
    "direct_route_access": 30,
    "delete_then_add_payee": 25,
    "audit_logs_breadth_access": 20,
    "abnormal_dwell_sensitive_screen": 15,
    "rapid_sensitive_action_sequence": 25,
    "suspicious_navigation_pattern": 15,
    "keystroke_bot_speed": 25,
    "keystroke_unrealistic_flight_time": 20,
    "keystroke_excessive_hesitation": 15
}

# ============ FRAUD PATTERNS (Typologies) ============
FRAUD_PATTERNS = [
     {
        "id": "KEYSTROKE-BOT-001",
        "typology": "Bot / Scripted Attack",
        "name": "Scripted / Bot Keystroke Dynamics",
        "description": "Unusually fast typing speed, near-zero dwell or flight time indicating automated script injection or credential stuffing bot.",
        "indicators": ["keystroke_bot_speed", "keystroke_unrealistic_flight_time"],
        "risk_score_if_matched": 88,
        "scenario_id": "F13"
    },
    {
        "id": "KEYSTROKE-COERCION-001",
        "typology": "Social Engineering / Coercion",
        "name": "Coerced / Erratic Keystroke Behavior",
        "description": "High backspace ratio combined with frequent pauses and erratic dwell time during sensitive input execution.",
        "indicators": ["keystroke_excessive_hesitation"],
        "risk_score_if_matched": 65,
        "scenario_id": "F14"
    },
    {
        "id": "ATO-001",
        "typology": "Account Takeover",
        "name": "Classic ATO Chain",
        "description": "Login from new device/location → credential changes → add payee → large transfer. Attacker locks out genuine user.",
        "indicators": ["newDevice", "newLocation", "credential_change_after_login", "add_payee", "large_transfer"],
        "risk_score_if_matched": 92,
        "scenario_id": "F1"
    },
    {
        "id": "ATO-002",
        "typology": "Account Takeover",
        "name": "Lockout + Credential Change",
        "description": "Repeated failed logins (lockout) → successful login from new device → immediate credential changes.",
        "indicators": ["login_lockout", "newDevice", "change_password", "change_email"],
        "risk_score_if_matched": 85,
        "scenario_id": "F2"
    },
    {
        "id": "MULE-001",
        "typology": "Mule / APP Fraud",
        "name": "Add Payee to Max Transfer",
        "description": "New payee added and immediately paid at/near user's maximum limit with no cooling-off.",
        "indicators": ["add_payee", "immediate_transfer", "transfer_near_max"],
        "risk_score_if_matched": 80,
        "scenario_id": "F4"
    },
    {
        "id": "FANOUT-001",
        "typology": "Fund Fan-out",
        "name": "Rapid Multiple Payees",
        "description": "Multiple new payees added rapidly in single session → transfers to mule network.",
        "indicators": ["multiple_add_payee", "multiple_transfers"],
        "risk_score_if_matched": 72,
        "scenario_id": "F6"
    },
    {
        "id": "REDIRECT-001",
        "typology": "Payee Redirection",
        "name": "Beneficiary Hijack",
        "description": "Existing beneficiary details edited → transfer sent to modified payee (invoice hijack).",
        "indicators": ["edit_beneficiary", "transfer_to_edited"],
        "risk_score_if_matched": 75,
        "scenario_id": "F5"
    },
    {
        "id": "EXFIL-001",
        "typology": "Data Exfiltration",
        "name": "Bulk Download Spike",
        "description": "Records downloaded far exceed historical average, often with breadth browsing. Indicates scraping/insider theft.",
        "indicators": ["bulk_download_spike", "breadth_access"],
        "risk_score_if_matched": 82,
        "scenario_id": "F7"
    },
    {
        "id": "COERCION-001",
        "typology": "Social Engineering / Coercion",
        "name": "APP Scam (Genuine Device)",
        "description": "Genuine device but abnormal dwell on sensitive screens + high-value transfer to new payee. Real-time coaching.",
        "indicators": ["long_dwell_sensitive", "new_payee", "max_transfer", "genuine_device"],
        "risk_score_if_matched": 66,
        "scenario_id": "F9"
    },
    {
        "id": "GUARDRAIL-001",
        "typology": "Guardrail Removal",
        "name": "Disable Alerts + Transfer",
        "description": "Transaction alerts disabled before high-value transfer to avoid detection.",
        "indicators": ["toggle_alerts_off", "transfer"],
        "risk_score_if_matched": 68,
        "scenario_id": "F10"
    },
    {
        "id": "NAV-001",
        "typology": "Navigation Anomaly",
        "name": "Direct Route Access",
        "description": "User reaches sensitive route without valid predecessor. Goal-directed or automated attacker behavior.",
        "indicators": ["direct_route_access", "unusual_sequence"],
        "risk_score_if_matched": 78,
        "scenario_id": "F3"
    }
]

# ============ USER BASELINES ============
BASELINES = {
    "U1001": {
        "userId": "U1001",
        "persona": "Retail saver",
        "actionFrequency": {
            "VIEW_DASHBOARD": 0.95,
            "VIEW_TRANSACTIONS": 0.70,
            "ADD_PAYEE": 0.02,
            "TRANSFER": 0.10,
            "CHANGE_EMAIL": 0.00,
            "CHANGE_MOBILE": 0.00,
            "CHANGE_PASSWORD": 0.01,
            "BULK_DOWNLOAD": 0.01
        },
        "maxTransferAmount": 500,
        "maxBulkDownloadRecords": 10,
        "commonLoginHours": [8, 9, 18, 19, 20]
    },
    "U1002": {
        "userId": "U1002",
        "persona": "Active payer",
        "actionFrequency": {
            "VIEW_DASHBOARD": 0.90,
            "VIEW_BENEFICIARIES": 0.75,
            "VIEW_SEND_MONEY": 0.70,
            "TRANSFER": 0.65,
            "ADD_PAYEE": 0.15,
            "CHANGE_EMAIL": 0.00,
            "CHANGE_MOBILE": 0.00,
            "BULK_DOWNLOAD": 0.02
        },
        "maxTransferAmount": 1500,
        "maxBulkDownloadRecords": 10,
        "commonLoginHours": [7, 8, 12, 13, 21]
    },
    "U1003": {
        "userId": "U1003",
        "persona": "Business user",
        "actionFrequency": {
            "VIEW_DASHBOARD": 0.85,
            "VIEW_TRANSACTIONS": 0.90,
            "BULK_DOWNLOAD": 0.60,
            "TRANSFER": 0.30,
            "ADD_PAYEE": 0.10,
            "CHANGE_EMAIL": 0.00,
            "VIEW_AUDIT_LOGS": 0.20
        },
        "maxTransferAmount": 5000,
        "maxBulkDownloadRecords": 100,
        "commonLoginHours": [9, 10, 11, 14, 15, 16]
    }
}

# ============ TEST SCENARIOS ============
TEST_SCENARIOS = {
    "G1": {"name": "Routine Check", "expected_score": 8, "expected_band": "LOW"},
    "G2": {"name": "Known Payee Payment", "expected_score": 15, "expected_band": "LOW"},
    "G3": {"name": "Request Money", "expected_score": 12, "expected_band": "LOW"},
    "F1": {"name": "Classic ATO Chain", "expected_score": 92, "expected_band": "HIGH"},
    "F2": {"name": "Lockout + Credential Change", "expected_score": 85, "expected_band": "HIGH"},
    "F3": {"name": "Direct Route + Email Change", "expected_score": 78, "expected_band": "HIGH"},
    "F4": {"name": "Add Payee to Max Transfer", "expected_score": 80, "expected_band": "HIGH"},
    "F5": {"name": "Beneficiary Hijack", "expected_score": 75, "expected_band": "HIGH"},
    "F6": {"name": "Rapid Multiple Payees", "expected_score": 72, "expected_band": "HIGH"},
    "F7": {"name": "Bulk Download Spike", "expected_score": 82, "expected_band": "HIGH"},
    "F8": {"name": "Exfil + Recon", "expected_score": 76, "expected_band": "HIGH"},
    "F9": {"name": "APP Scam (Genuine Device)", "expected_score": 66, "expected_band": "MEDIUM"},
    "F10": {"name": "Disable Alerts + Transfer", "expected_score": 68, "expected_band": "MEDIUM"},
    "F11": {"name": "Never-Visited Path", "expected_score": 55, "expected_band": "MEDIUM"},
    "F12": {"name": "Delete + Add Payee", "expected_score": 50, "expected_band": "MEDIUM"},
    "E1": {"name": "Rare Action, Safe Context", "expected_score": 38, "expected_band": "LOW"},
    "E2": {"name": "New Device Only", "expected_score": 30, "expected_band": "LOW"},
    "E3": {"name": "Benign Profile Update", "expected_score": 35, "expected_band": "LOW"}
}

def get_risk_band(score: int) -> dict:
    """Get risk band information based on score"""
    for band_name, band_info in RISK_BANDS.items():
        if band_info["range"][0] <= score <= band_info["range"][1]:
            return {"name": band_name, "action": band_info["action"]}
    return {"name": "LOW", "action": "ALLOW"}

def get_signal_weight(signal_key: str) -> int:
    """Get weight for a specific signal"""
    return SIGNAL_WEIGHTS.get(signal_key, 0)

def match_fraud_pattern(indicators: list) -> list:
    """
    Match detected indicators against fraud patterns.
    Returns list of matched patterns.
    """
    matched_patterns = []
    for pattern in FRAUD_PATTERNS:
        pattern_indicators = set(pattern["indicators"])
        if pattern_indicators.issubset(set(indicators)):
            matched_patterns.append({
                "pattern_id": pattern["id"],
                "typology": pattern["typology"],
                "name": pattern["name"],
                "risk_contribution": pattern["risk_score_if_matched"]
            })
    return matched_patterns

def get_baseline(user_id: str) -> dict:
    """Get baseline profile for a user"""
    return BASELINES.get(user_id, BASELINES["U1001"])  # Default to U1001 profile
