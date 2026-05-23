from pathlib import Path

from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env from the project root (one level above backend/)
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)


class Settings(BaseSettings):
    api_host: str = "0.0.0.0"
    api_port: int = 8080
    debug: bool = True

    groq_api_key: str = ""
    exa_api_key: str = ""

    class Config:
        env_file = str(_env_path)


settings = Settings()
