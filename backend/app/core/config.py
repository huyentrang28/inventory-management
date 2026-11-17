from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "StockManager WMS"
    APP_ENV: str = "production"
    DEBUG: bool = False
    APP_PORT: int = 8000
    API_V1_PREFIX: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://warehouse_user:warehouse_pass@postgres:5432/warehouse_db"
    
    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # Security
    JWT_SECRET_KEY: str = "secret-key-change-in-production-needs-to-be-at-least-32-chars-long"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = ["*"]

    # Initial Superuser
    FIRST_SUPERUSER_EMAIL: str = "admin@stockmanager.local"
    FIRST_SUPERUSER_PASSWORD: str = "Admin@123456"
    FIRST_SUPERUSER_FULLNAME: str = "Hệ Thống Quản Trị Viên"

    # Timezone
    TZ: str = "Asia/Ho_Chi_Minh"


settings = Settings()

