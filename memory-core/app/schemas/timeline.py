"""
Timeline schema aligned with frontend `frontend/src/types/event.ts`
and normalization logic from `frontend/src/stores/eventStore.ts`.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class MediaItem(BaseModel):
    type: str  # 'image' | 'video'
    url: str
    thumbnail: str | None = None
    timestamp: str | None = None
    caption: str | None = None
    duration: float | None = None


class TimelineEventInput(BaseModel):
    """Single segment from video_analysis.py or manual JSON."""

    event_index: int | None = None
    start_sec: float = 0
    end_sec: float = 0
    start_hms: str | None = None
    end_hms: str | None = None
    title: str = ""
    summary: str = ""
    tags: list[str] = Field(default_factory=list)
    mediaUrl: str | None = None
    mediaType: str | None = None
    media: list[dict[str, Any]] | None = None
    activity_type: str | None = None
    environment: str | None = None


class MemoryUnitOut(BaseModel):
    """Extended event shape stored server-side (mirrors EventExtended)."""

    id: str
    videoId: str
    eventIndex: int
    startSec: float
    endSec: float
    startHms: str
    endHms: str
    title: str
    summary: str
    userTitle: str | None = None
    userSummary: str | None = None
    tags: list[str] = Field(default_factory=list)
    notes: str = ""
    mediaUrl: str | None = None
    mediaType: str | None = None
    media: list[MediaItem] | None = None
    createdAt: str
    updatedAt: str


class VideoMetaOut(BaseModel):
    id: str
    filename: str
    duration: float
    importedAt: str
    eventCount: int


class ImportTimelineRequest(BaseModel):
    """Import payload: either full timeline array or raw video-analysis events."""

    filename: str = "imported.json"
    timeline: list[TimelineEventInput] | None = None
    """Full timeline rows (with optional event_index, hms)."""
    raw_events: list[TimelineEventInput] | None = None
    """Same as Node `importFromVideoAnalysis`: start_sec/end_sec/title/summary only."""


class ImportTimelineResponse(BaseModel):
    video: VideoMetaOut
    events: list[MemoryUnitOut]
