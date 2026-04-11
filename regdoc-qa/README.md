# RegDoc Q&A — Regulatory Document Question Answering (RAG)

Ask natural-language questions about your controlled regulatory documents (SOPs,
validation protocols, calibration procedures) and get answers that are **grounded
only in those documents** and **cite the exact source passages** they used.

This is a full **Retrieval-Augmented Generation (RAG)** system: documents are
chunked and embedded into a vector store, the most relevant passages are retrieved
for each question, and a language model composes an answer constrained to that
retrieved context — with inline `[n]` citations you can click to trace every claim
back to its origin.

> Built for a pharma / quality-assurance context, where traceability and "show me
> where this came from" are non-negotiable. The sample documents are **synthetic**
> SOPs created for this demo.

---

## Why this exists

In regulated environments, an answer is only useful if you can trust and trace it.
A plain chatbot will happily invent a swab-recovery threshold; an auditor will not.
This project demonstrates the engineering pattern that makes LLM answers
defensible:

1. **Retrieve** the relevant controlled text.
2. **Constrain** the model to answer *only* from that text.
3. **Cite** the specific passages used, and **refuse** when the documents don't
   contain the answer.

---

## Architecture

```
┌──────────────┐     upload / seed      ┌─────────────────────────────────────┐
│   React UI   │ ─────────────────────▶ │           FastAPI backend           │
│ (Vite + TS)  │                        │                                     │
│              │                        │  Document loader (PDF / TXT / MD)   │
│  • library   │                        │            │                        │
│  • chat +    │                        │            ▼                        │
│    citations │                        │  Chunking (RecursiveCharacter…)     │
└──────┬───────┘                        │            │                        │
       │                                │            ▼                        │
       │   POST /api/query              │  Embeddings (local all-MiniLM-L6)   │
       │  { question }                  │            │                        │
       │                                │            ▼                        │
       │                                │  ┌────────────────────────────┐     │
       │                                │  │   ChromaDB (persistent)    │     │
       │                                │  │   cosine similarity        │     │
       │                                │  └────────────┬───────────────┘     │
       │                                │      top-k retrieved chunks         │
       │                                │            │                        │
       │                                │            ▼                        │
       │     answer + sources           │  RAG service → Claude (generation)  │
       └◀───────────────────────────────│  grounded prompt + [n] citations    │
                                         └─────────────────────────────────────┘
```

**The retrieval → grounded-generation → citation pipeline:**

1. **Ingest.** A document is parsed (per-page for PDFs), split into overlapping
   chunks with `RecursiveCharacterTextSplitter`, embedded, and stored in ChromaDB
   with `{ filename, page, chunk_index }` metadata.
2. **Retrieve.** A question is embedded with the same model; ChromaDB returns the
   top-*k* most similar chunks by cosine similarity.
3. **Ground.** The retrieved chunks are numbered `[1..k]` and injected into a
   system prompt that instructs the model to answer **only** from them, cite with
   inline `[n]` markers, and respond *"The provided documents do not contain this
   information."* when the answer isn't present.
4. **Attribute.** The answer text is scanned for `[n]` markers to flag which
   sources were actually cited. The UI renders each marker as a clickable chip
   that highlights and scrolls to the matching source card.

---

## Tech stack

| Layer        | Choice                                  | Why |
|--------------|-----------------------------------------|-----|
| Frontend     | React 18, TypeScript, Vite, Tailwind v3 | Fast, typed, single-page; no router needed |
| Backend      | FastAPI (Python)                        | Async, typed, auto OpenAPI docs at `/docs` |
| Vector store | ChromaDB (local, persistent)            | Zero-config, runs on disk, no external service |
| Embeddings   | all-MiniLM-L6-v2 (ONNX, local)          | **Free**, no API key, no network at query time |
| Generation   | Anthropic Claude (`claude-sonnet-4-6`)  | High-quality grounded answering & refusal |
| Chunking     | `langchain-text-splitters`              | Battle-tested recursive splitter only |

---

## Project structure

```
regdoc-qa/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app, CORS, lifespan, error envelopes
│   │   ├── config.py               # pydantic-settings configuration
│   │   ├── schemas.py              # request/response models + { success, data, message }
│   │   ├── dependencies.py         # cached vector store & RAG service providers
│   │   ├── routers/
│   │   │   ├── documents.py        # upload / list / delete / seed
│   │   │   └── query.py            # ask a question
│   │   └── services/
│   │       ├── document_loader.py  # PDF / TXT / MD → pages
│   │       ├── chunking.py         # pages → overlapping chunks
│   │       ├── vector_store.py     # ChromaDB wrapper (ingest / query / list / delete)
│   │       └── rag_service.py      # retrieval + grounded prompt + Claude call
│   ├── sample_docs/                # synthetic pharma SOPs
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/             # Header, Sidebar, ChatView, Message, CitationMarker, …
│   │   ├── hooks/                  # useDocuments, useChat
│   │   ├── lib/                    # api client, citation parser
│   │   └── types/
│   ├── package.json
│   └── .env.example
└── README.md
```

---

## Getting started

You need **Python 3.10+** and **Node 18+**.

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env                 # then add your Anthropic API key
# ANTHROPIC_API_KEY=sk-ant-...

uvicorn app.main:app --reload --port 8000
```

The API is now at `http://localhost:8000` (interactive docs at `/docs`).

> **Embeddings download once.** The first ingest downloads the ~80 MB MiniLM model
> and caches it locally. After that, ingestion and retrieval run fully offline.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` to the backend,
so there's no CORS setup locally.

### 3. Try it

Click **Load sample SOPs** in the sidebar, then ask something like
*"What swab recovery percentage is required for cleaning validation?"* — the answer
will cite the exact SOP passage it used.

---

## Configuration

All backend settings come from environment variables (see `backend/.env.example`):

| Variable            | Default               | Purpose |
|---------------------|-----------------------|---------|
| `ANTHROPIC_API_KEY` | *(required)*          | Generation. Embeddings need no key. |
| `CLAUDE_MODEL`      | `claude-sonnet-4-6`   | Use `claude-haiku-4-5` for lowest cost. |
| `TOP_K`             | `4`                   | Chunks retrieved per question. |
| `CHUNK_SIZE`        | `1000`                | Characters per chunk. |
| `CHUNK_OVERLAP`     | `150`                 | Overlap between adjacent chunks. |
| `MAX_UPLOAD_MB`     | `15`                  | Upload size limit. |
| `CORS_ORIGINS`      | `localhost:5173, …`   | Allowed frontend origins. |

---

## Interview talking points

These are the deliberate decisions behind the build — the "why", not just the "what".

**Why local embeddings instead of an embeddings API?**
Claude has no embeddings endpoint, so retrieval is handled by a local
`all-MiniLM-L6-v2` model (ONNX) bundled with ChromaDB. This keeps the project
**free to run**, requires **a single credential** (only generation needs a key),
and runs retrieval **offline**. The embedding function is the one seam to swap if
you want a hosted model — point ChromaDB at OpenAI or Voyage embeddings and
re-ingest; nothing else changes.

**Why framework-light instead of a full RAG framework?**
The retrieval loop is hand-rolled — direct ChromaDB calls, a direct Anthropic SDK
call, and only `langchain-text-splitters` for chunking. For a system this size that
means **fewer moving parts, easier debugging, and a pipeline I can explain
end-to-end** rather than one hidden behind framework abstractions. The seams
(loader → chunker → vector store → RAG service) are clean, so dropping in a
heavier framework later is a contained change.

**How are citations actually guaranteed?**
Two layers. (1) The system prompt numbers the retrieved chunks and instructs the
model to cite inline with `[n]` and to **refuse** when the context doesn't support
an answer. (2) The backend post-processes the answer with a regex to flag which
sources were genuinely referenced, and the UI only treats in-range markers as
citations. The model is *asked* to cite; the system *verifies* what it cited.

**Why refuse instead of answering from general knowledge?**
In a regulated setting a confident-but-unsourced answer is worse than no answer.
The grounded prompt makes refusal an explicit, expected behavior — ask the sample
docs something they don't cover and you'll see it decline rather than hallucinate.

**Why per-page chunking?**
PDFs are split page-by-page before chunking so every chunk carries a real page
number. That makes each citation point to a *locatable* spot in the source
document — exactly what someone verifying a claim needs.

**The standard response envelope.**
Every endpoint returns `{ success, data, message }`, including errors (via FastAPI
exception handlers). The frontend has one unwrap-or-throw path, so the UI never has
to special-case error shapes.

---

## Security & robustness notes

- **Deleting a missing document returns `404`**, not a silent success.
- **Upload validation** rejects unsupported extensions, empty files, and oversize
  uploads before any processing.
- **Scanned/empty PDFs** are detected and reported clearly rather than ingested as
  empty noise.
- **No secrets in the frontend** — the API key lives only on the backend.

---

## Possible extensions

- Streaming answers (token-by-token) with citations resolved on completion.
- Swap the local embedder for a hosted one (OpenAI / Voyage) via ChromaDB's
  embedding-function interface.
- Hybrid retrieval (keyword + vector) and a reranking pass.
- Per-document access control and audit logging of every question/answer.

---

*Sample documents are synthetic and for demonstration only. They are not real
controlled documents and must not be used for actual regulatory work.*
