"""Thin wrapper around a persistent ChromaDB collection.

Embeddings: Chroma's built-in `all-MiniLM-L6-v2` (ONNX) runs locally and free — no API
key, no external embedding service. The model (~80 MB) downloads automatically on first
ingest/query. Swap points for OpenAI/Voyage embeddings are noted in the README.

Distance space is cosine; we report `relevance = 1 - distance` clamped to [0, 1].
"""
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional

import chromadb
from chromadb.config import Settings as ChromaSettings

from .chunking import Chunk


@dataclass
class RetrievedChunk:
    doc_id: str
    filename: str
    page: Optional[int]
    chunk_index: int
    text: str
    relevance: float


class VectorStore:
    def __init__(self, persist_dir: str, collection_name: str) -> None:
        self._client = chromadb.PersistentClient(
            path=persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False, allow_reset=True),
        )
        # Default embedding function (local MiniLM) is applied automatically.
        self._collection = self._client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"},
        )

    def ingest(self, filename: str, chunks: list[Chunk]) -> tuple[str, int, int]:
        """Embed and store chunks. Returns (doc_id, chunk_count, page_count)."""
        doc_id = uuid.uuid4().hex
        uploaded_at = datetime.now(timezone.utc).isoformat()

        ids = [f"{doc_id}:{i}" for i in range(len(chunks))]
        documents = [c.text for c in chunks]
        metadatas = []
        for i, c in enumerate(chunks):
            meta = {
                "doc_id": doc_id,
                "filename": filename,
                "chunk_index": i,
                "uploaded_at": uploaded_at,
            }
            if c.page is not None:  # Chroma metadata cannot hold None values.
                meta["page"] = c.page
            metadatas.append(meta)

        self._collection.add(ids=ids, documents=documents, metadatas=metadatas)
        page_count = len({c.page for c in chunks if c.page is not None})
        return doc_id, len(chunks), page_count

    def query(self, question: str, k: int) -> list[RetrievedChunk]:
        if self._collection.count() == 0:
            return []
        n = min(k, self._collection.count())
        res = self._collection.query(
            query_texts=[question],
            n_results=n,
            include=["documents", "metadatas", "distances"],
        )
        docs = res.get("documents", [[]])[0]
        metas = res.get("metadatas", [[]])[0]
        dists = res.get("distances", [[]])[0]

        out: list[RetrievedChunk] = []
        for text, meta, dist in zip(docs, metas, dists):
            relevance = max(0.0, min(1.0, 1.0 - float(dist)))
            out.append(
                RetrievedChunk(
                    doc_id=str(meta.get("doc_id", "")),
                    filename=str(meta.get("filename", "unknown")),
                    page=meta.get("page"),
                    chunk_index=int(meta.get("chunk_index", 0)),
                    text=text,
                    relevance=round(relevance, 3),
                )
            )
        return out

    def list_documents(self) -> list[dict]:
        """Aggregate stored chunks into per-document summaries (newest first)."""
        result = self._collection.get(include=["metadatas"])
        metas = result.get("metadatas", []) or []

        docs: dict[str, dict] = {}
        for meta in metas:
            doc_id = str(meta.get("doc_id", ""))
            if not doc_id:
                continue
            entry = docs.setdefault(
                doc_id,
                {
                    "doc_id": doc_id,
                    "filename": str(meta.get("filename", "unknown")),
                    "chunks": 0,
                    "pages": set(),
                    "uploaded_at": str(meta.get("uploaded_at", "")),
                },
            )
            entry["chunks"] += 1
            if meta.get("page") is not None:
                entry["pages"].add(meta["page"])

        summaries = [
            {
                "doc_id": d["doc_id"],
                "filename": d["filename"],
                "chunks": d["chunks"],
                "pages": len(d["pages"]),
                "uploaded_at": d["uploaded_at"],
            }
            for d in docs.values()
        ]
        summaries.sort(key=lambda d: d["uploaded_at"], reverse=True)
        return summaries

    def existing_filenames(self) -> set[str]:
        return {d["filename"] for d in self.list_documents()}

    def delete_document(self, doc_id: str) -> bool:
        """Delete all chunks for a document. Returns False if the id was not present."""
        existing = {d["doc_id"] for d in self.list_documents()}
        if doc_id not in existing:
            return False
        self._collection.delete(where={"doc_id": doc_id})
        return True
