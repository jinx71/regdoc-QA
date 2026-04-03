"""Application configuration loaded from environment variables (.env supported)."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- Anthropic (generation only; embeddings run locally) ---
    anthropic_api_key: str = ""
    claude_model: str = "claude-sonnet-4-6"
    max_tokens: int = 1024

    # --- Vector store ---
    chroma_dir: str = "./data/chroma"
    collection_name: str = "regdocs"

    # --- Retrieval / chunking ---
    chunk_size: int = 1000
    chunk_overlap: int = 150
    top_k: int = 4

    # --- Uploads ---
    max_upload_mb: int = 15

    # --- CORS (comma-separated origins) ---
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
