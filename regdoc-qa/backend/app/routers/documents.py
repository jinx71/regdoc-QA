"""Document management endpoints: upload, list, delete, and seed sample pharma SOPs."""
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile

from ..config import Settings, get_settings
from ..dependencies import get_vector_store
from ..schemas import DocumentInfo, IngestResult, SeedResult, envelope
from ..services.chunking import chunk_pages
from ..services.document_loader import SUPPORTED_EXTENSIONS, load_document
from ..services.vector_store import VectorStore

router = APIRouter(prefix="/documents", tags=["documents"])

SAMPLE_DIR = Path(__file__).resolve().parent.parent.parent / "sample_docs"


def _ingest_bytes(store: VectorStore, settings: Settings, filename: str, content: bytes) -> IngestResult:
    pages = load_document(filename, content)
    chunks = chunk_pages(pages, settings.chunk_size, settings.chunk_overlap)
    doc_id, chunk_count, page_count = store.ingest(filename, chunks)
    return IngestResult(doc_id=doc_id, filename=filename, chunks=chunk_count, pages=page_count)


@router.post("/upload")
async def upload_document(
    file: UploadFile,
    store: VectorStore = Depends(get_vector_store),
    settings: Settings = Depends(get_settings),
):
    filename = file.filename or "upload"
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type '{ext or filename}'.")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(content) > settings.max_upload_bytes:
        raise HTTPException(status_code=413, detail=f"File exceeds {settings.max_upload_mb} MB limit.")

    try:
        result = _ingest_bytes(store, settings, filename, content)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    return envelope(result, message=f"Ingested '{filename}' into {result.chunks} chunks.")


@router.get("")
async def list_documents(store: VectorStore = Depends(get_vector_store)):
    docs = [DocumentInfo(**d) for d in store.list_documents()]
    return envelope(docs, message=f"{len(docs)} document(s) in the library.")


@router.delete("/{doc_id}")
async def delete_document(doc_id: str, store: VectorStore = Depends(get_vector_store)):
    if not store.delete_document(doc_id):
        raise HTTPException(status_code=404, detail="Document not found.")
    return envelope({"doc_id": doc_id}, message="Document removed.")


@router.post("/seed")
async def seed_documents(
    store: VectorStore = Depends(get_vector_store),
    settings: Settings = Depends(get_settings),
):
    """Ingest the bundled sample pharma SOPs. Files already present are skipped."""
    existing = store.existing_filenames()
    ingested: list[IngestResult] = []
    skipped: list[str] = []

    for path in sorted(SAMPLE_DIR.glob("*.md")):
        if path.name in existing:
            skipped.append(path.name)
            continue
        result = _ingest_bytes(store, settings, path.name, path.read_bytes())
        ingested.append(result)

    return envelope(
        SeedResult(ingested=ingested, skipped=skipped),
        message=f"Seeded {len(ingested)} document(s); skipped {len(skipped)}.",
    )
