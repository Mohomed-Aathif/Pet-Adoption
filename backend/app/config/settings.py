from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # JWT/Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Application
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Pet Adoption System"
    PROJECT_VERSION: str = "1.0.0"

    # CORS
    CORS_ORIGINS: List[str]

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = "noreply@petadoption.com"
    EMAILS_FROM_NAME: str = "Pet Adoption System"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Admin user ( THIS WAS MISSING BEFORE)
    ADMIN_EMAIL: str
    ADMIN_USERNAME: str
    ADMIN_PASSWORD: str
    ADMIN_FULL_NAME: str

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()