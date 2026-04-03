"""FastAPI application entrypoint."""
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .routers import documents, query
from .schemas import envelope

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Path(settings.chroma_dir).mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="RegDoc Q&A API",
    description="Retrieval-Augmented Generation over controlled regulatory documents.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router, prefix="/api")
app.include_router(query.router, prefix="/api")


@app.get("/api/health", tags=["meta"])
async def health() -> dict:
    return envelope(
        {"status": "ok", "model": settings.claude_model, "key_configured": bool(settings.anthropic_api_key)},
        message="Service healthy.",
    )


@app.get("/", tags=["meta"])
async def root() -> dict:
    return envelope({"name": "RegDoc Q&A API", "docs": "/docs"}, message="See /docs for the API.")


# --- Envelope-shaped error responses so the client always gets { success, data, message } ---
@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=envelope(None, str(exc.detail), success=False))


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content=envelope(None, "Invalid request.", success=False))


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(status_code=500, content=envelope(None, "Internal server error.", success=False))
