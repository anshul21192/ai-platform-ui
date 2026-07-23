import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

class EmailService:
    def send_fraud_alert_email(
        self, 
        user_id: str, 
        session_id: str, 
        risk_score: int, 
        risk_level: str, 
        anomalies: list, 
        reason: str = ""
    ):
        """
        Dispatches a real security alert email via Gmail SMTP when suspicious/fraudulent activity occurs.
        """
        recipient_email = "shagun6093@gmail.com"
        
        anomalies_html = "".join([f"<li style='color: #d9534f; font-weight: bold;'>⚠️ {a}</li>" for a in anomalies]) if anomalies else "<li>No specific rule anomalies, elevated risk score.</li>"
        
        is_high = risk_score >= 80
        header_color = "#d9534f" if is_high else "#f0ad4e"
        badge_text = "HIGH RISK - TERMINATED" if is_high else "MODERATE RISK - 2FA STEP-UP ENFORCED"
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f6f9;">
                <div style="max-width: 650px; margin: auto; background: #ffffff; border-radius: 8px; border: 1px solid #e1e8ed; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
                    <div style="background-color: {header_color}; color: #ffffff; padding: 20px; text-align: center;">
                        <h2 style="margin: 0; font-size: 22px;">🛡️ VAULT BANK SECURITY ALERT</h2>
                        <p style="margin: 5px 0 0 0; font-weight: bold; font-size: 14px;">[{badge_text}]</p>
                    </div>
                    
                    <div style="padding: 25px; color: #333333;">
                        <p style="font-size: 16px; margin-top: 0;">Hello Security Administrator / User <b>{user_id}</b>,</p>
                        
                        <p style="font-size: 14px; line-height: 1.6;">
                            Our AI Behavioral Fraud Engine detected <b>suspicious activity</b> during an active banking session.
                        </p>
                        
                        <div style="background-color: #f8f9fa; border-left: 4px solid {header_color}; padding: 15px; border-radius: 4px; margin: 20px 0;">
                            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                                <tr>
                                    <td style="padding: 4px 0; color: #666;"><b>Account User ID:</b></td>
                                    <td style="padding: 4px 0;">{user_id}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 0; color: #666;"><b>Session UUID:</b></td>
                                    <td style="padding: 4px 0; font-family: monospace;">{session_id}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 0; color: #666;"><b>Risk Score:</b></td>
                                    <td style="padding: 4px 0; font-weight: bold; color: {header_color};">{risk_score}% ({risk_level})</td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 0; color: #666;"><b>Automated Action:</b></td>
                                    <td style="padding: 4px 0; font-weight: bold;">{'SESSION BLOCKED & TERMINATED' if is_high else 'MANDATORY 2FA CHALLENGE ISSUED'}</td>
                                </tr>
                            </table>
                        </div>
                        
                        <h4 style="color: #222; margin-bottom: 8px;">Anomalies Flagged:</h4>
                        <ul style="padding-left: 20px; margin-top: 0;">
                            {anomalies_html}
                        </ul>
                        
                        {f'<p style="font-size: 13px; color: #555; background: #fff3cd; padding: 10px; border-radius: 4px;"><b>Analyst Cause Notes:</b> {reason}</p>' if reason else ''}
                        
                        <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
                            <a href="http://localhost:5174" style="background-color: #155dfc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Open Admin SOC Console</a>
                        </div>
                    </div>
                    
                    <div style="background-color: #f1f3f5; padding: 12px; text-align: center; font-size: 12px; color: #777;">
                        Vault Financial Platform &bull; Automated Real-Time Threat Management Engine
                    </div>
                </div>
            </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🚨 SECURITY ALERT: Fraud Detected on Account {user_id} (Risk Score: {risk_score}%)"
        msg["From"] = settings.SMTP_USER
        msg["To"] = recipient_email
        msg.attach(MIMEText(html_body, "html"))

        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            try:
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                    server.starttls()
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.sendmail(msg["From"], [recipient_email], msg.as_string())
                print(f"✅ Real Gmail alert email sent to {recipient_email} for session {session_id}!")
            except Exception as e:
                print(f"❌ SMTP Email dispatch error: {e}")
        else:
            print(f"[SMTP SIMULATOR] Email to {recipient_email} - Risk Score: {risk_score}%")

    def send_2fa_otp_email_and_sms(self, user_id: str, session_id: str, otp_code: str = "123456", phone_number: str = "+15550192834"):
        """
        Sends 2FA Step-up OTP code via Gmail SMTP Email AND Twilio SMS!
        """
        recipient_email = "shagun6093@gmail.com"
        
        # 1. Send Email via Gmail SMTP
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f6f9;">
                <div style="max-width: 550px; margin: auto; background: #ffffff; border-radius: 8px; border: 1px solid #e1e8ed; padding: 25px;">
                    <h3 style="color: #155dfc; margin-top: 0;">🔐 Vault Bank: Security Step-Up Verification Code</h3>
                    <p>Hello <b>{user_id}</b>,</p>
                    <p>A moderate security risk was detected on your active banking session. Enter the verification code below to confirm your identity and complete your action:</p>
                    
                    <div style="background-color: #eef2ff; border: 2px dashed #155dfc; text-align: center; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #155dfc;">{otp_code}</span>
                    </div>
                    
                    <p style="font-size: 12px; color: #777;">If you did not initiate this transaction, please change your password immediately.</p>
                </div>
            </body>
        </html>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🔐 Your 2FA Step-Up Security Code: {otp_code}"
        msg["From"] = settings.SMTP_USER
        msg["To"] = recipient_email
        msg.attach(MIMEText(html_body, "html"))

        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            try:
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                    server.starttls()
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.sendmail(msg["From"], [recipient_email], msg.as_string())
                print(f"✅ Real 2FA OTP Email sent to {recipient_email}!")
            except Exception as e:
                print(f"❌ SMTP 2FA Email error: {e}")

        # 2. Send SMS via Twilio
        self.send_twilio_sms(
            to_phone=phone_number,
            message=f"[Vault Bank Security] Your 2FA Step-Up verification code for session {session_id[:8]} is: {otp_code}. Valid for 5 minutes."
        )

    def send_twilio_sms(self, to_phone: str, message: str):
        """
        Dispatches SMS via Twilio API.
        """
        sid = settings.TWILIO_ACCOUNT_SID
        token = settings.TWILIO_AUTH_TOKEN
        from_phone = settings.TWILIO_PHONE_NUMBER

        if sid and token and sid.startswith("AC") and not "mock" in sid:
            try:
                from twilio.rest import Client
                client = Client(sid, token)
                sms = client.messages.create(body=message, from_=from_phone, to=to_phone)
                print(f"✅ Twilio SMS sent to {to_phone} (SID: {sms.sid})")
            except Exception as e:
                print(f"⚠️ Twilio API call error: {e}")
        else:
            print(f"📱 [TWILIO SMS DISPATCHED] To: {to_phone} | Sender: {from_phone} | Message: '{message}'")

email_service = EmailService()