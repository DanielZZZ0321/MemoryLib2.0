"""Lightweight entity / phrase extraction without large transformer downloads."""

from __future__ import annotations

import re
from collections import Counter


def extract_entity_candidates(text: str, max_n: int = 40) -> list[str]:
    """Capitalized phrases + hashtags as graph entity candidates."""
    if not text.strip():
        return []
    cap = re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\b", text)
    tags = re.findall(r"#([\w\u4e00-\u9fff]+)", text)
    c = Counter([x.strip() for x in cap if len(x) > 2])
    c.update(tags)
    return [w for w, _ in c.most_common(max_n)]


def pseudo_summary(text: str, max_len: int = 200) -> str:
    t = " ".join(text.split())
    return t if len(t) <= max_len else t[: max_len - 1] + "…"
