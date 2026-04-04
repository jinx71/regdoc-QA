"""Pydantic models for requests and the standard { success, data, message } responses."""
from typing import Optional

from pydantic import BaseModel, Field


# --------------------------- Requests ---------------------------
class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)
    top_k: Optional[int] = Field(default=None, ge=1, le=12)


# --------------------------- Data models ---------------------------
class Source(BaseModel):
    """A retrieved document chunk used as grounding for an answer."""
    id: int                      # 1-based index used for inline [n] citations
    doc_id: str
    filename: str
    page: Optional[int] = None
    chunk_index: int
    snippet: str
    relevance: float             # 0..1 (cosine similarity), rounded
    cited: bool = False          # whether the answer referenced this source by [n]


class AnswerData(BaseModel):
    answer: str
    sources: list[Source]
    model: str
    grounded: bool               # False when the DB had no documents to search


class DocumentInfo(BaseModel):
    doc_id: str
    filename: str
    chunks: int
    pages: int
    uploaded_at: str


class IngestResult(BaseModel):
    doc_id: str
    filename: str
    chunks: int
    pages: int


class SeedResult(BaseModel):
    ingested: list[IngestResult]
    skipped: list[str]           # filenames already present


# --------------------------- Response envelope ---------------------------
def envelope(data, message: str = "OK", success: bool = True) -> dict:
    """Build the standard API response body used across every endpoint."""
    return {"success": success, "data": data, "message": message}
