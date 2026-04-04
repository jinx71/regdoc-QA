"""Split page text into overlapping chunks suitable for embedding + retrieval.

Uses LangChain's RecursiveCharacterTextSplitter — the de-facto standard splitter.
It tries to break on paragraph, then line, then word boundaries before falling back
to a hard character cut, which keeps chunks semantically coherent.
"""
from dataclasses import dataclass
from typing import Optional

from langchain_text_splitters import RecursiveCharacterTextSplitter

from .document_loader import Page


@dataclass
class Chunk:
    text: str
    page: Optional[int]


def chunk_pages(pages: list[Page], chunk_size: int, chunk_overlap: int) -> list[Chunk]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks: list[Chunk] = []
    # Split each page independently so every chunk maps cleanly to a single page.
    for page in pages:
        for piece in splitter.split_text(page.text):
            cleaned = piece.strip()
            if cleaned:
                chunks.append(Chunk(text=cleaned, page=page.number))
    return chunks
