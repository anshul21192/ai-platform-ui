import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # ============ VERTEX AI CONFIGURATION (ACTIVE) ============
    GOOGLE_CLOUD_PROJECT_ID: str = os.getenv("GOOGLE_CLOUD_PROJECT_ID", "")
    VERTEX_AI_LOCATION: str = os.getenv("VERTEX_AI_LOCATION", "us-central1")
    
    # ============ GEMINI API CONFIGURATION (COMMENTED - OPTIONAL) ============
    # Uncomment below to use direct Gemini API instead of Vertex AI
    # GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/behaviour.db")
    BASE_URL: str = os.getenv("BASE_URL", "http://localhost:8000")
    
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")

settings = Settings()
