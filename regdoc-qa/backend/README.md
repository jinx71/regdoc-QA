# RegDoc Q&A — Backend

FastAPI service implementing the RAG pipeline: document ingestion, vector
retrieval (ChromaDB), and grounded answer generation (Anthropic Claude).

## Run

```bash
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                 # add ANTHROPIC_API_KEY
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: `http://localhost:8000/docs`

> The first ingest downloads the local embedding model (~80 MB) once, then caches
> it. Embeddings need no API key; only `/api/query` requires `ANTHROPIC_API_KEY`.

## API

All responses use the envelope `{ "success": bool, "data": <T>, "message": str }`,
including errors.

| Method   | Path                       | Body / Params            | Description |
|----------|----------------------------|--------------------------|-------------|
| `GET`    | `/api/health`              | —                        | Status, model, whether a key is configured |
| `GET`    | `/api/documents`           | —                        | List documents in the library |
| `POST`   | `/api/documents/upload`    | `multipart/form-data` `file` | Ingest a PDF / TXT / MD file |
| `DELETE` | `/api/documents/{doc_id}`  | —                        | Remove a document (`404` if absent) |
| `POST`   | `/api/documents/seed`      | —                        | Ingest bundled sample SOPs (idempotent) |
| `POST`   | `/api/query`               | `{ "question": str, "top_k"?: int }` | Ask a grounded, cited question |

### Example

```bash
# Seed the sample documents
curl -X POST http://localhost:8000/api/documents/seed

# Ask a question
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What swab recovery percentage is required for cleaning validation?"}'
```

## Layout

```
app/
├── main.py                 # app, CORS, lifespan, envelope error handlers
├── config.py               # pydantic-settings configuration
├── schemas.py              # request/response models + envelope() helper
├── dependencies.py         # cached VectorStore & RagService providers
├── routers/
│   ├── documents.py        # upload / list / delete / seed
│   └── query.py            # ask
└── services/
    ├── document_loader.py  # PDF / TXT / MD → pages
    ├── chunking.py         # pages → overlapping chunks (one page per chunk)
    ├── vector_store.py     # ChromaDB wrapper
    └── rag_service.py      # retrieval + grounded prompt + Claude call
```

## How answers stay grounded

`rag_service.py` retrieves the top-*k* chunks, numbers them `[1..k]`, and passes
them to Claude under a system prompt that requires answering **only** from the
provided context, citing inline with `[n]`, and refusing with *"The provided
documents do not contain this information."* when unsupported. The service then
flags which sources were actually cited (regex on `[n]`) before returning.

## Configuration

See `.env.example`. Key variables: `ANTHROPIC_API_KEY`, `CLAUDE_MODEL`
(default `claude-sonnet-4-6`), `TOP_K`, `CHUNK_SIZE`, `CHUNK_OVERLAP`,
`MAX_UPLOAD_MB`, `CORS_ORIGINS`.

## Swapping the embedding model

Embeddings are produced by ChromaDB's default local `all-MiniLM-L6-v2`. To use a
hosted embedder (OpenAI, Voyage, etc.), set ChromaDB's embedding function in
`vector_store.py` and re-ingest your documents — the rest of the pipeline is
unchanged.
