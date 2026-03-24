from __future__ import annotations

import logging
from typing import Any

from app.config import settings

log = logging.getLogger(__name__)

_chroma_client: Any = None
_collection: Any = None


def _embedding_function():
    try:
        from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

        return SentenceTransformerEmbeddingFunction(model_name=settings.embedding_model)
    except Exception as e:
        log.warning("SentenceTransformer embedding disabled: %s", e)
        return None


def _ensure_chroma():
    global _chroma_client, _collection
    if _collection is not None:
        return _collection
    try:
        import chromadb  # type: ignore
    except ImportError:
        log.warning("chromadb not installed; vector search disabled")
        return None

    settings.data_dir.mkdir(parents=True, exist_ok=True)
    path = settings.data_dir / settings.chroma_path
    _chroma_client = chromadb.PersistentClient(path=str(path))
    ef = _embedding_function()
    kwargs: dict = {"name": settings.chroma_collection, "metadata": {"description": "Personal memory embeddings"}}
    if ef is not None:
        kwargs["embedding_function"] = ef
    try:
        _collection = _chroma_client.get_or_create_collection(**kwargs)
    except Exception as e:
        log.warning("Chroma collection init failed (%s); retrying without custom embeddings", e)
        _collection = _chroma_client.get_or_create_collection(
            name=settings.chroma_collection + "_default",
            metadata={"description": "Personal memory embeddings (default embedder)"},
        )
    return _collection


def reset_client_cache() -> None:
    """Test / reload hooks."""
    global _chroma_client, _collection
    _chroma_client = None
    _collection = None


def upsert_memory_texts(ids: list[str], documents: list[str], metadatas: list[dict] | None = None) -> bool:
    col = _ensure_chroma()
    if col is None:
        return False
    col.upsert(ids=ids, documents=documents, metadatas=metadatas)
    return True


def query_memory(query: str, n: int = 8) -> list[dict]:
    col = _ensure_chroma()
    if col is None:
        return []
    res = col.query(query_texts=[query], n_results=n)
    out = []
    ids = (res.get("ids") or [[]])[0]
    docs = (res.get("documents") or [[]])[0]
    dist = (res.get("distances") or [[]])[0] if res.get("distances") else [0.0] * len(ids)
    metas = (res.get("metadatas") or [[]])[0] if res.get("metadatas") else [{}] * len(ids)
    for i, mid in enumerate(ids):
        out.append(
            {
                "id": mid,
                "document": docs[i] if i < len(docs) else "",
                "distance": dist[i] if i < len(dist) else None,
                "metadata": metas[i] if i < len(metas) else {},
            }
        )
    return out
