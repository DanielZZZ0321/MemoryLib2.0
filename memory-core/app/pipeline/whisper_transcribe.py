"""Optional Whisper transcription → timeline segments (start/end/text)."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

log = logging.getLogger(__name__)

_whisper_model = None
_whisper_model_name: str | None = None


def _get_model(size: str):
    global _whisper_model, _whisper_model_name
    try:
        import whisper
    except ImportError:
        return None
    if _whisper_model is not None and _whisper_model_name == size:
        return _whisper_model
    _whisper_model = whisper.load_model(size)
    _whisper_model_name = size
    return _whisper_model


def transcribe_video_segments(wav_or_video: Path, *, model_size: str | None = None) -> list[dict[str, Any]]:
    """
    Returns list of {start_sec, end_sec, title, summary} suitable for raw_events / timeline_builder.
    """
    from app.config import settings

    size = model_size or settings.whisper_model
    model = _get_model(size)
    if model is None:
        log.warning("openai-whisper not installed")
        return []

    try:
        result = model.transcribe(str(wav_or_video), verbose=False, word_timestamps=False)
    except Exception as e:
        log.exception("Whisper failed: %s", e)
        return []

    segments = result.get("segments") or []
    out: list[dict[str, Any]] = []
    for i, seg in enumerate(segments):
        start = float(seg.get("start", 0))
        end = float(seg.get("end", start))
        text = (seg.get("text") or "").strip()
        if not text:
            continue
        out.append(
            {
                "start_sec": start,
                "end_sec": end,
                "title": f"Segment {i + 1}",
                "summary": text,
                "tags": ["whisper", "audio"],
            }
        )
    return out
