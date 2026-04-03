"""Lazily-constructed singletons exposed as FastAPI dependencies."""
from functools import lru_cache

from .config import Settings, get_settings
from .services.rag_service import RagService
from .services.vector_store import VectorStore


@lru_cache
def get_vector_store() -> VectorStore:
    settings: Settings = get_settings()
    return VectorStore(settings.chroma_dir, settings.collection_name)


@lru_cache
def get_rag_service() -> RagService:
    return RagService(get_vector_store(), get_settings())
