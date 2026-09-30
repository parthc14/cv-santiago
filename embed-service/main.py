"""
Self-hosted embedding service — sentence-transformers + numpy, served via
FastAPI. Replaces OpenAI's embeddings API for cv-santiago's RAG pipeline
(both ingest scripts and the live search_portfolio tool call this over
HTTP, the same way the app already calls Groq/Qdrant).

Run locally:
    uvicorn main:app --reload --port 8000

Run in production: see Dockerfile / docker-compose.yml in this directory.
"""

import os

import numpy as np
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"
EMBED_API_KEY = os.getenv("EMBED_API_KEY")

app = FastAPI(title="cv-santiago embedding service")

# Loaded once at process startup, reused across requests.
model = SentenceTransformer(MODEL_NAME)


class EmbedRequest(BaseModel):
    texts: list[str]


class EmbedResponse(BaseModel):
    embeddings: list[list[float]]
    model: str
    dimensions: int


def _check_auth(authorization: str | None) -> None:
    if not EMBED_API_KEY:
        # Fail closed: never serve unauthenticated if the server itself
        # wasn't configured with a key.
        raise HTTPException(status_code=500, detail="EMBED_API_KEY is not configured on the server")
    expected = f"Bearer {EMBED_API_KEY}"
    if authorization != expected:
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_NAME}


@app.post("/embed", response_model=EmbedResponse)
def embed(request: EmbedRequest, authorization: str | None = Header(default=None)):
    _check_auth(authorization)

    if not request.texts:
        raise HTTPException(status_code=400, detail="texts must be a non-empty list")

    # sentence-transformers returns a numpy.ndarray of shape (n_texts, dims).
    vectors: np.ndarray = model.encode(request.texts, convert_to_numpy=True)

    return EmbedResponse(
        embeddings=vectors.tolist(),
        model=MODEL_NAME,
        dimensions=int(vectors.shape[1]),
    )
