import os
from typing import List
from dotenv import load_dotenv

# Load local environment variables from .env file if present
load_dotenv()

class Settings:
    SERVICE_NAME: str = os.getenv("SERVICE_NAME", "Threat Prevention Backend")
    SERVICE_VERSION: str = os.getenv("SERVICE_VERSION", "0.1.0")
    STAGE: str = os.getenv("STAGE", "Stage 2 - Backend Foundation")
    HOST: str = os.getenv("HOST", "127.0.0.1")
    # Default to port 8005 to avoid conflicting with port 8000 on platforms where 8000 is reserved
    PORT: int = int(os.getenv("PORT", "8005"))
    
    # Storage settings (Ephemeral local storage in container / local dev)
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.join(BASE_DIR, "storage", "temp_uploads"))
    MAX_UPLOAD_SIZE_BYTES: int = int(os.getenv("MAX_UPLOAD_SIZE_BYTES", str(100 * 1024 * 1024)))  # 100 MB
    ALLOWED_EXTENSIONS: set = {".mp4", ".mov", ".avi", ".webm"}
    ALLOWED_MIME_TYPES: set = {
        "video/mp4", 
        "video/quicktime", 
        "video/x-msvideo", 
        "video/webm", 
        "video/avi",
        "application/octet-stream"
    }

    # Allowed CORS origins for frontend communication
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "*"
    ]

settings = Settings()

# Ensure temporary upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
