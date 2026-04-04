"""Retrieval-Augmented Generation: combine vector retrieval with a Claude completion.

The grounding contract is enforced entirely through prompt engineering:
  * Claude may only use the supplied numbered context.
  * Every claim must carry an inline [n] citation matching a context block.
  * If the answer is not in the context, Claude must say so rather than guess.

Keeping this prompt explicit (rather than hidden inside a framework chain) is the
point of the project — it is the part you can read, defend, and tune in an interview.
"""
import re

from anthropic import Anthropic

from ..config import Settings
from .vector_store import RetrievedChunk, VectorStore

SYSTEM_PROMPT = """You are a regulatory documentation assistant for a pharmaceutical \
quality team. You answer questions strictly from the controlled documents provided to \
you (SOPs, validation protocols, deviation/CAPA procedures, audit records).

Rules:
1. Use ONLY the information in the numbered context blocks below. Do not rely on outside \
knowledge or assumptions.
2. Support every factual statement with an inline citation in square brackets that refers \
to the context block it came from, e.g. "Balances must be calibrated monthly [2]." Cite \
multiple blocks where relevant, e.g. [1][3].
3. If the context does not contain the answer, reply exactly: "The provided documents do \
not contain this information." Do not invent procedures, numbers, or acceptance criteria.
4. Quote specific limits, intervals, roles, and acceptance criteria verbatim when present.
5. Be concise and precise. Write in the register of a quality/regulatory professional."""

_CITATION_RE = re.compile(r"\[(\d+)\]")


class RagService:
    def __init__(self, store: VectorStore, settings: Settings) -> None:
        self._store = store
        self._settings = settings
        self._client: Anthropic | None = None

    def _anthropic(self) -> Anthropic:
        if not self._settings.anthropic_api_key:
            raise RuntimeError(
                "ANTHROPIC_API_KEY is not set. Add it to backend/.env to enable answers. "
                "(Document upload and retrieval work without it.)"
            )
        if self._client is None:
            self._client = Anthropic(api_key=self._settings.anthropic_api_key)
        return self._client

    @staticmethod
    def _build_context(chunks: list[RetrievedChunk]) -> str:
        blocks = []
        for i, c in enumerate(chunks, start=1):
            loc = f"{c.filename}, page {c.page}" if c.page is not None else c.filename
            blocks.append(f"[{i}] (source: {loc})\n{c.text}")
        return "\n\n".join(blocks)

    def answer(self, question: str, top_k: int | None = None) -> dict:
        k = top_k or self._settings.top_k
        chunks = self._store.query(question, k)

        if not chunks:
            return {
                "answer": "No documents have been added yet. Upload an SOP or load the "
                "sample pharma documents, then ask again.",
                "sources": [],
                "model": self._settings.claude_model,
                "grounded": False,
            }

        context = self._build_context(chunks)
        user_content = (
            f"Question: {question}\n\n"
            f"Numbered context blocks:\n\n{context}\n\n"
            "Answer the question using only these blocks, with inline [n] citations."
        )

        client = self._anthropic()
        response = client.messages.create(
            model=self._settings.claude_model,
            max_tokens=self._settings.max_tokens,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_content}],
        )
        answer_text = "".join(
            block.text for block in response.content if getattr(block, "type", None) == "text"
        ).strip()

        cited_ids = {int(n) for n in _CITATION_RE.findall(answer_text)}
        sources = []
        for i, c in enumerate(chunks, start=1):
            sources.append(
                {
                    "id": i,
                    "doc_id": c.doc_id,
                    "filename": c.filename,
                    "page": c.page,
                    "chunk_index": c.chunk_index,
                    "snippet": c.text,
                    "relevance": c.relevance,
                    "cited": i in cited_ids,
                }
            )

        return {
            "answer": answer_text,
            "sources": sources,
            "model": self._settings.claude_model,
            "grounded": True,
        }
