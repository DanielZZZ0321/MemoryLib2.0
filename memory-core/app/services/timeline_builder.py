"""
Builds server-side memory units using the same rules as
`frontend/src/stores/eventStore.ts` (`importTimeline` / `importFromVideoAnalysis`).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Iterable

from app.schemas.timeline import ImportTimelineRequest, MemoryUnitOut, TimelineEventInput, VideoMetaOut


def sec_to_hms(sec: float) -> str:
    total = int(round(sec))
    h, rem = divmod(total, 3600)
    m, s = divmod(rem, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def normalize_raw_events_to_timeline(raw: Iterable[TimelineEventInput]) -> list[dict]:
    """Mirror `importFromVideoAnalysis` in eventStore.ts."""
    out: list[dict] = []
    for idx, e in enumerate(raw):
        start = e.start_sec or 0
        end = e.end_sec or 0
        out.append(
            {
                "event_index": idx,
                "start_sec": start,
                "end_sec": end,
                "start_hms": sec_to_hms(start),
                "end_hms": sec_to_hms(end),
                "title": e.title or f"Event {idx + 1}",
                "summary": e.summary or "",
                "tags": e.tags or [],
                "mediaUrl": e.mediaUrl,
                "mediaType": e.mediaType,
                "media": e.media,
            }
        )
    return out


def build_memory_units(
    timeline_rows: list[dict],
    *,
    filename: str,
    video_id: str | None = None,
) -> tuple[VideoMetaOut, list[MemoryUnitOut]]:
    """Mirror `importTimeline` in eventStore.ts (bulk replace semantics for one video batch)."""
    vid = video_id or str(uuid.uuid4())
    parsed_duration = max((float(r.get("end_sec") or 0) for r in timeline_rows), default=0.0)
    now = _now_iso()

    video_meta = VideoMetaOut(
        id=vid,
        filename=filename,
        duration=parsed_duration,
        importedAt=now,
        eventCount=len(timeline_rows),
    )

    units: list[MemoryUnitOut] = []
    for i, ev in enumerate(timeline_rows):
        raw_idx = ev.get("event_index")
        idx = int(raw_idx) if raw_idx is not None else i
        start_sec = float(ev.get("start_sec") or 0)
        end_sec = float(ev.get("end_sec") or 0)
        units.append(
            MemoryUnitOut(
                id=f"{vid}_{idx}",
                videoId=vid,
                eventIndex=idx,
                startSec=start_sec,
                endSec=end_sec,
                startHms=str(ev.get("start_hms") or sec_to_hms(start_sec)),
                endHms=str(ev.get("end_hms") or sec_to_hms(end_sec)),
                title=str(ev.get("title") or ""),
                summary=str(ev.get("summary") or ""),
                userTitle=None,
                userSummary=None,
                tags=list(ev.get("tags") or []),
                notes="",
                mediaUrl=ev.get("mediaUrl"),
                mediaType=ev.get("mediaType"),
                media=None,
                createdAt=now,
                updatedAt=now,
            )
        )

    return video_meta, units


def timeline_from_request(body: ImportTimelineRequest) -> tuple[list[dict], str]:
    if body.timeline:
        rows = [e.model_dump(exclude_none=True) for e in body.timeline]
        for i, row in enumerate(rows):
            row.setdefault("event_index", i)
            row.setdefault("start_hms", sec_to_hms(float(row.get("start_sec") or 0)))
            row.setdefault("end_hms", sec_to_hms(float(row.get("end_sec") or 0)))
        return rows, body.filename

    if body.raw_events:
        rows = normalize_raw_events_to_timeline(body.raw_events)
        return rows, body.filename

    raise ValueError("Provide `timeline` or `raw_events`")
