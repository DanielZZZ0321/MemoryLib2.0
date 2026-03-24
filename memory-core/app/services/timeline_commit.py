"""Persist a normalized timeline: SQLite, graph, Chroma, Lance."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.graph import knowledge_graph
from app.schemas.timeline import ImportTimelineRequest, ImportTimelineResponse
from app.services.memory_repository import replace_video_timeline
from app.services.timeline_builder import build_memory_units, timeline_from_request
from app.stores import lance_store, vector_store


async def commit_timeline_import(session: AsyncSession, body: ImportTimelineRequest) -> ImportTimelineResponse:
    rows, filename = timeline_from_request(body)
    video, units = build_memory_units(rows, filename=filename)
    await replace_video_timeline(session, video, units)
    knowledge_graph.sync_units_to_graph(units, link_entities=True)
    docs = [f"{u.title}\n{u.summary}" for u in units]
    vector_store.upsert_memory_texts(
        ids=[u.id for u in units],
        documents=docs,
        metadatas=[{"videoId": u.videoId, "startSec": u.startSec} for u in units],
    )
    lance_store.upsert_memory_rows(
        [
            {
                "id": u.id,
                "videoId": u.videoId,
                "title": u.title,
                "summary": u.summary,
                "startSec": u.startSec,
                "endSec": u.endSec,
                "text": f"{u.title}\n{u.summary}",
            }
            for u in units
        ]
    )
    return ImportTimelineResponse(video=video, events=units)
