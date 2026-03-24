"""MCAP introspection — list channels; decode JSON/text payloads into memory snippets."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

log = logging.getLogger(__name__)


def summarize_mcap(mcap_path: Path, max_messages: int = 200) -> dict[str, Any]:
    try:
        from mcap.reader import make_reader
    except ImportError:
        return {"error": "mcap package not installed", "channels": []}

    channels_info: list[dict[str, Any]] = []
    text_blobs: list[str] = []
    with open(mcap_path, "rb") as f:
        reader = make_reader(f)
        summary = reader.get_summary()
        if summary and summary.channels:
            for ch_id, ch in summary.channels.items():
                channels_info.append(
                    {
                        "id": ch_id,
                        "topic": ch.topic,
                        "schema": getattr(ch, "message_encoding", "") or "",
                    }
                )
        count = 0
        for schema, channel, message in reader.iter_messages():
            if count >= max_messages:
                break
            count += 1
            data = message.data
            if isinstance(data, (bytes, bytearray)):
                try:
                    s = data.decode("utf-8", errors="ignore")
                    if s.isprintable() or "\n" in s:
                        text_blobs.append(s[:2000])
                except Exception:
                    pass
            elif isinstance(data, str):
                text_blobs.append(data[:2000])

    merged = "\n---\n".join(text_blobs[:50])
    return {
        "channels": channels_info,
        "messages_scanned": count,
        "text_preview": merged[:8000],
    }


def mcap_to_raw_events(mcap_path: Path) -> list[dict[str, Any]]:
    """Turn MCAP text preview into coarse memory units (one per chunk)."""
    info = summarize_mcap(mcap_path)
    if info.get("error"):
        return [
            {
                "start_sec": 0,
                "end_sec": 0,
                "title": "MCAP ingest",
                "summary": info["error"],
                "tags": ["mcap"],
            }
        ]
    preview = info.get("text_preview") or ""
    if not preview.strip():
        preview = json.dumps(info.get("channels") or [], ensure_ascii=False)
    chunks = [c.strip() for c in preview.split("\n---\n") if c.strip()]
    if not chunks:
        chunks = [preview[:4000]]
    events = []
    for i, c in enumerate(chunks[:40]):
        events.append(
            {
                "start_sec": float(i),
                "end_sec": float(i) + 1.0,
                "title": f"MCAP chunk {i + 1}",
                "summary": c[:4000],
                "tags": ["mcap", "multimodal"],
            }
        )
    return events
