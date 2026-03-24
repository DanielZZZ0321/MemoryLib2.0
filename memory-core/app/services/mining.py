"""
Deep mining scaffold: pattern discovery over memory_units.
Extend with clustering, association rules, or LLM-synthesized insights.
"""

from __future__ import annotations

from collections import Counter

from app.schemas.timeline import MemoryUnitOut


def segment_duration_stats(units: list[MemoryUnitOut]) -> dict:
    if not units:
        return {"count": 0}
    lengths = [max(0.0, u.endSec - u.startSec) for u in units]
    s = sorted(lengths)
    n = len(s)
    return {
        "count": n,
        "avg_sec": sum(s) / n,
        "min_sec": s[0],
        "max_sec": s[-1],
        "p50_sec": s[n // 2],
    }


def simple_tag_cooccurrence(units: list[MemoryUnitOut]) -> dict:
    """Cheap structural insight without ML."""
    tag_counts: Counter[str] = Counter()
    for u in units:
        for t in u.tags:
            tag_counts[t.lower()] += 1
    pairs: Counter[tuple[str, str]] = Counter()
    for u in units:
        ts = sorted({t.lower() for t in u.tags})
        for i in range(len(ts)):
            for j in range(i + 1, len(ts)):
                pairs[(ts[i], ts[j])] += 1
    top_pairs = [{"a": a, "b": b, "count": c} for (a, b), c in pairs.most_common(12)]
    title_words: Counter[str] = Counter()
    for u in units:
        for w in (u.title or "").lower().split():
            if len(w) > 2:
                title_words[w] += 1
    return {
        "tag_frequency": dict(tag_counts.most_common(24)),
        "cooccurrence": top_pairs,
        "title_keywords": dict(title_words.most_common(24)),
        "segment_duration": segment_duration_stats(units),
    }
