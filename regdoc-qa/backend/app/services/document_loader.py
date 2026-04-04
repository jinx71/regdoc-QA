"""Extract raw text from uploaded documents, preserving page boundaries for citations."""
from dataclasses import dataclass
from io import BytesIO
from typing import Optional

from pypdf import PdfReader

SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".md"}


@dataclass
class Page:
    """A unit of source text. `number` is the 1-based PDF page, or None for plain text."""
    text: str
    number: Optional[int]


def _load_pdf(content: bytes) -> list[Page]:
    reader = PdfReader(BytesIO(content))
    pages: list[Page] = []
    for i, page in enumerate(reader.pages):
        text = (page.extract_text() or "").strip()
        if text:
            pages.append(Page(text=text, number=i + 1))
    return pages


def _load_text(content: bytes) -> list[Page]:
    text = content.decode("utf-8", errors="replace").strip()
    return [Page(text=text, number=None)] if text else []


def load_document(filename: str, content: bytes) -> list[Page]:
    """Dispatch on file extension. Raises ValueError for unsupported types/empty files."""
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file type '{ext or filename}'. Allowed: PDF, TXT, MD.")

    pages = _load_pdf(content) if ext == ".pdf" else _load_text(content)
    if not pages:
        raise ValueError("No extractable text found. Scanned/image-only PDFs are not supported.")
    return pages
