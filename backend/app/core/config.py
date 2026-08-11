import os
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./finora.db")
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    MAX_REWARD_COINS_PER_TRANSACTION: int = int(os.getenv("MAX_REWARD_COINS_PER_TRANSACTION", "500"))
    DEMO_USER_ID: str = os.getenv("DEMO_USER_ID", "demo-user")

    class Config:
        env_file = ".env"

settings = Settings()
