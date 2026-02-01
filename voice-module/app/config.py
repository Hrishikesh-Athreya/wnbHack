"""
Configuration settings for the voice interaction backend.
Uses pydantic-settings for environment variable management.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Application
    app_name: str = "Voice Interaction Backend"
    debug: bool = False
    
    # Daily.co Configuration
    daily_api_key: str = ""
    daily_api_url: str = "https://api.daily.co/v1"
    
    # Redis Configuration (placeholder)
    redis_url: str = "redis://localhost:6379"
    redis_password: str = ""
    redis_db: int = 0
    
    # Redis Vector Store Configuration
    redis_vector_index: str = "voice_context_idx"
    redis_vector_dim: int = 768  # Gemini embedding dimension
    
    # OpenAI Configuration
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    
    # Gemini Configuration (for embeddings)
    gemini_api_key: str = ""
    
    # Browserbase Configuration (for pre-call research)
    browserbase_api_key: str = ""
    browserbase_project_id: str = ""
    
    # Logging
    log_level: str = "INFO"
    log_file: str = "logs/voice_backend.log"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
