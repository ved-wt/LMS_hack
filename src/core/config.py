"""Core configuration module - loads settings from environment variables."""

from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Application
    APP_NAME: str = "L&D Portal"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # Database
    DATABASE_URL: str = Field(..., description="PostgreSQL connection string")
    DATABASE_ECHO: bool = False

    # Security / JWT
    JWT_SECRET_KEY: str = Field(..., description="Secret key for JWT signing")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    CORS_ORIGINS: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000"],
        description="Allowed CORS origins",
    )

    # Redis (optional for MVP)
    REDIS_URL: Optional[str] = None

    # SMTP / Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM: Optional[str] = None


@lru_cache
def get_settings() -> Settings:
    """
    Singleton settings provider with caching.

    Returns cached Settings instance across application lifecycle.
    """
    return Settings()
