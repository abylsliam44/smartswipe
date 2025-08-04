from functools import lru_cache
from pydantic_settings import BaseSettings
from pydantic import Field, SecretStr


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/dbname"
    
    # Azure OpenAI
    AZURE_OPENAI_API_KEY: SecretStr | None = None
    AZURE_OPENAI_ENDPOINT: str | None = None
    AZURE_OPENAI_DEPLOYMENT_NAME: str | None = None
    
    # OpenAI (fallback)
    OPENAI_API_KEY: SecretStr | None = None
    
    # Security & JWT
    SECRET_KEY: SecretStr = Field(default="your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS Settings
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173,https://smart-swipe-ml-app.vercel.app,https://smart-swipe.vercel.app,https://smart-swipe-chi.vercel.app,https://smartswipe-app.vercel.app,https://smartswipe-ml.vercel.app"
    
    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings() 