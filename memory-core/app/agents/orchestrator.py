"""
Agent orchestration stubs — wire LangChain / LLM tools here.

Memory retrieval agent: combine SQL keyword + Chroma semantic hits.
Mining agent: periodic clustering over embeddings (not implemented in scaffold).
"""

from __future__ import annotations

from dataclasses import dataclass

from app.schemas.timeline import MemoryUnitOut


@dataclass
class RetrievalResult:
    keyword_hits: list[MemoryUnitOut]
    vector_hits: list[dict]


def format_context_for_llm(units: list[MemoryUnitOut], max_items: int = 20) -> str:
    lines = []
    for u in units[:max_items]:
        lines.append(f"[{u.eventIndex}] {u.title}: {u.summary[:300]}")
    return "\n".join(lines) if lines else "(no memories loaded)"
