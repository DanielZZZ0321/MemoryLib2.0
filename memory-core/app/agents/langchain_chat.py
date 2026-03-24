"""LangChain + OpenAI-compatible LLM (AiHubMix, OpenAI, etc.) with memory RAG context."""

from __future__ import annotations

import logging
from collections.abc import AsyncIterator

from app.agents.orchestrator import format_context_for_llm
from app.config import settings
from app.db.session import SessionLocal
from app.services.memory_repository import list_all_units

log = logging.getLogger(__name__)


async def _memory_context() -> str:
    async with SessionLocal() as session:
        units = await list_all_units(session)
    return format_context_for_llm(units, max_items=40)


def _build_llm(streaming: bool = True):
    key = settings.effective_llm_key()
    if not key:
        return None
    try:
        from langchain_openai import ChatOpenAI
    except ImportError:
        log.warning("langchain_openai not installed")
        return None

    kwargs: dict = {
        "api_key": key,
        "base_url": settings.effective_llm_base_url(),
        "model": settings.llm_model,
        "temperature": 0.3,
        "streaming": streaming,
    }
    if settings.llm_app_code and str(settings.llm_app_code).strip():
        kwargs["default_headers"] = {"APP-Code": str(settings.llm_app_code).strip()}
    return ChatOpenAI(**kwargs)


async def stream_chat(messages: list[tuple[str, str]]) -> AsyncIterator[str]:
    ctx = await _memory_context()
    key_ok = bool(settings.effective_llm_key())
    llm = _build_llm(streaming=True)
    if llm is None:
        if not key_ok:
            hint = "[memory-core] 未检测到 API Key。请在 app/backend/.env 或 memory-core/.env 中设置 AIHUBMIX_API_KEY 或 OPENAI_API_KEY。"
        else:
            hint = "[memory-core] 已检测到 API Key，但未安装 langchain-openai。请在 memory-core 虚拟环境中执行: pip install langchain-openai"
        yield hint + "\n\n" + ctx[:1200]
        return

    from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

    sys = SystemMessage(
        content=(
            "你是个人记忆助手。根据「记忆上下文」用自然、简洁的中文回答。"
            "若记忆中没有相关信息，请明确说明。不要编造具体日期或事件。\n\n记忆上下文:\n"
            + ctx
        )
    )
    mapped: list = [sys]
    for role, content in messages:
        if role == "user":
            mapped.append(HumanMessage(content=content))
        elif role == "assistant":
            mapped.append(AIMessage(content=content))

    try:
        async for chunk in llm.astream(mapped):
            c = getattr(chunk, "content", None)
            if c:
                yield c
    except Exception as e:
        log.exception("LLM stream error")
        yield f"\n[错误] {e}\n"


async def complete_chat(messages: list[tuple[str, str]]) -> str:
    parts: list[str] = []
    async for t in stream_chat(messages):
        parts.append(t)
    return "".join(parts)
