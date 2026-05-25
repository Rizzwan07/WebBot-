from pathlib import Path
import os

from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Try to load .env from parent directory (for local dev only)
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    load_dotenv(_env_path)


class Settings(BaseSettings):
    api_host: str = "0.0.0.0"
    api_port: int = 8080
    debug: bool = True

    groq_api_key: str = ""
    exa_api_key: str = ""

    class Config:
        # Don't require env_file to exist (works on Vercel with env vars)
        extra = "ignore"  # Ignore extra fields like VITE_API_URL


settings = Settings()
