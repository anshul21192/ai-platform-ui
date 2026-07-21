import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

class EmailService:
    def send_verification(self, user_id: str, session_id: str):
        yes_link = f"{settings.BASE_URL}/api/verification/verify?user_id={user_id}&session_id={session_id}&action=yes"
        no_link = f"{settings.BASE_URL}/api/verification/verify?user_id={user_id}&session_id={session_id}&action=no"
        
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
                <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 8px; border: 1px solid #ddd;">
                    <h3 style="color: #d9534f; border-bottom: 2px solid #d9534f; padding-bottom: 10px;">🛡️ Security Alert: Unusual Activity</h3>
                    <p>Hello User <b>{user_id}</b>,</p>
                    <p>Our AI fraud system detected an anomalous behavioral profile during your active banking dashboard session.</p>
                    <p style="background: #f0f0f0; padding: 10px; border-left: 4px solid #d9534f;">
                        <b>Session ID:</b> {session_id}<br>
                        <b>Status:</b> Telemetry variance mismatch flagged.
                    </p>
                    <p><b>Did you intentionally authorize this operation?</b></p>
                    <div style="margin-top: 25px; margin-bottom: 25px;">
                        <a href="{yes_link}" style="background-color: #5cb85c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-right: 15px; display: inline-block;">YES, That Was Me</a>
                        <a href="{no_link}" style="background-color: #d9534f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">NO, Secure My Account</a>
                    </div>
                    <p style="font-size: 11px; color: #777;">This is a real-time automated threat management transaction profile.</p>
                </div>
            </body>
        </html>
        """

        # 1. Build the actual MIME email payload data structure
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"🚨 URGENT: Fraud Verification Profile Alert [{user_id}]"
        msg["From"] = settings.SMTP_USER
        msg["To"] = "shagun6093@gmail.com"
        msg.attach(MIMEText(html_body, "html"))

        # 2. Fire it off over the SMTP network layer using your .env credentials
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            try:
                with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                    server.starttls()
                    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                    server.sendmail(msg["From"], msg["To"], msg.as_string())
                print(f"✅ Real HTML alert successfully delivered to Mailtrap inbox for session {session_id}!")
            except Exception as e:
                print(f"❌ Network SMTP dispatch error occurred: {e}")
        else:
            # Fallback configuration indicator if the environment file hasn't read yet
            print(f"\n--- [OUTBOUND EMAIL SIMULATOR] ---\nTo: user_{user_id}@domain.com\nYES Link: {yes_link}\nNO Link: {no_link}\n-----------------------------------\n")

    def trigger_bank_escalation(self, user_id: str, session_id: str):
        print(f"\n🚨 [CRITICAL ALERT] Account user: {user_id} rejected session identity validation.")
        print("SYSTEM ACTION: Account frozen. Dispatching fraud team alert.\n")

email_service = EmailService()