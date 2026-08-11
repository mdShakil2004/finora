from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    CORS_ORIGINS: str
    ENVIRONMENT: str = "production"
    MAX_REWARD_COINS_PER_TRANSACTION: int = 500
    DEMO_USER_ID: str = "demo-user"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
