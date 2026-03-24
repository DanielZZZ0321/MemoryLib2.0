"""Runtime capability flags (what optional deps are available)."""

from __future__ import annotations

import shutil
import subprocess
from functools import lru_cache

from app.config import settings


def _has_module(name: str) -> bool:
    try:
        __import__(name)
        return True
    except ImportError:
        return False


@lru_cache
def detect_capabilities() -> dict:
    caps = {
        "chromadb": _has_module("chromadb"),
        "lancedb": _has_module("lancedb"),
        "sentence_transformers": _has_module("sentence_transformers"),
        "langchain_openai": _has_module("langchain_openai"),
        "whisper": _has_module("whisper"),
        "cv2": _has_module("cv2"),
        "mcap": _has_module("mcap"),
        "torch": _has_module("torch"),
        "transformers": _has_module("transformers"),
        "ffmpeg_on_path": shutil.which(settings.ffmpeg_bin) is not None,
        "llm_configured": settings.effective_llm_key() is not None,
    }
    try:
        import torch

        caps["cuda"] = bool(torch.cuda.is_available())
    except ImportError:
        caps["cuda"] = False
    return caps


def ffmpeg_version() -> str | None:
    bin_name = settings.ffmpeg_bin
    path = shutil.which(bin_name)
    if not path:
        return None
    try:
        out = subprocess.run([path, "-version"], capture_output=True, text=True, timeout=5)
        line = (out.stdout or "").splitlines()[0] if out.stdout else ""
        return line or None
    except (OSError, subprocess.TimeoutExpired):
        return None
