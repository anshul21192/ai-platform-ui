import os
from dotenv import load_dotenv

load_dotenv(override=True)

class Settings:
    # ============ VERTEX AI CONFIGURATION ============
    GOOGLE_CLOUD_PROJECT_ID: str = os.getenv("GOOGLE_CLOUD_PROJECT_ID", "")
    VERTEX_AI_LOCATION: str = os.getenv("VERTEX_AI_LOCATION", "us-central1")
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/behaviour.db")
    BASE_URL: str = os.getenv("BASE_URL", "http://localhost:8000")
    
    # ============ SMTP CONFIGURATION ============
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "shagun6093@gmail.com")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "ehndsmkpjkwmylop")
    
    # ============ TWILIO 2FA CONFIGURATION ============
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "")
    TWILIO_PHONE_NUMBER: str = os.getenv("TWILIO_PHONE_NUMBER", "+15550192834")

settings = Settings()
