"""Question-answering endpoint."""
from fastapi import APIRouter, Depends, HTTPException

from ..dependencies import get_rag_service
from ..schemas import AnswerData, QueryRequest, envelope
from ..services.rag_service import RagService

router = APIRouter(prefix="/query", tags=["query"])


@router.post("")
async def ask_question(
    payload: QueryRequest,
    rag: RagService = Depends(get_rag_service),
):
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question must not be empty.")

    try:
        result = rag.answer(question, payload.top_k)
    except RuntimeError as exc:
        # Missing API key etc. — surface as a clean, actionable error.
        raise HTTPException(status_code=503, detail=str(exc))

    return envelope(AnswerData(**result), message="Answer generated.")
