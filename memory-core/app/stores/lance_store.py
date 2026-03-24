from __future__ import annotations

import logging
from typing import Any

from app.config import settings

log = logging.getLogger(__name__)

_db: Any = None


def _embed_texts(texts: list[str]) -> list[list[float]] | None:
    try:
        from sentence_transformers import SentenceTransformer

        model = SentenceTransformer(settings.embedding_model)
        arr = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        if arr.ndim == 1:
            return [arr.astype(float).tolist()]
        return [row.astype(float).tolist() for row in arr]
    except Exception as e:
        log.debug("Lance embeddings skipped: %s", e)
        return None


def _connect():
    global _db
    if _db is not None:
        return _db
    try:
        import lancedb
    except ImportError:
        return None
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    p = settings.data_dir / settings.lance_path
    _db = lancedb.connect(str(p))
    return _db


def _row_dim(rows: list[dict]) -> int:
    v = rows[0].get("vector")
    if isinstance(v, list) and v:
        return len(v)
    return 384


def upsert_memory_rows(rows: list[dict]) -> bool:
    db = _connect()
    if db is None:
        return False
    if not rows:
        return True
    texts = [r.get("text") or f"{r.get('title', '')}\n{r.get('summary', '')}" for r in rows]
    vectors = _embed_texts(texts)
    dim = _row_dim(rows) if vectors is None else len(vectors[0])
    prepared: list[dict] = []
    for i, r in enumerate(rows):
        vec = vectors[i] if vectors and i < len(vectors) else [0.0] * dim
        prepared.append({**r, "vector": vec})
    tbl_name = settings.lance_table
    try:
        if tbl_name in db.table_names():
            db.open_table(tbl_name).add(prepared)
        else:
            db.create_table(tbl_name, data=prepared)
    except Exception as e:
        log.warning("LanceDB upsert failed: %s", e)
        return False
    return True


def vector_search(query: str, k: int = 8) -> list[dict]:
    db = _connect()
    if db is None:
        return []
    if settings.lance_table not in db.table_names():
        return []
    vec = _embed_texts([query])
    if not vec:
        return []
    try:
        tbl = db.open_table(settings.lance_table)
        return tbl.search(vec[0]).limit(k).to_list()
    except Exception as e:
        log.warning("Lance search failed: %s", e)
        return []
