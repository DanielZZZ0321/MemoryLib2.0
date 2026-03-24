from __future__ import annotations

import json

from sqlalchemy import delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import MemoryUnitRow, VideoRow
from app.schemas.timeline import MemoryUnitOut, VideoMetaOut


async def replace_video_timeline(
    session: AsyncSession,
    video: VideoMetaOut,
    units: list[MemoryUnitOut],
) -> None:
    await session.execute(delete(MemoryUnitRow).where(MemoryUnitRow.video_id == video.id))
    await session.execute(delete(VideoRow).where(VideoRow.id == video.id))

    session.add(
        VideoRow(
            id=video.id,
            filename=video.filename,
            duration=video.duration,
            imported_at=video.importedAt,
            event_count=video.eventCount,
        )
    )
    for u in units:
        session.add(
            MemoryUnitRow(
                id=u.id,
                video_id=u.videoId,
                event_index=u.eventIndex,
                start_sec=u.startSec,
                end_sec=u.endSec,
                start_hms=u.startHms,
                end_hms=u.endHms,
                title=u.title,
                summary=u.summary,
                user_title=u.userTitle,
                user_summary=u.userSummary,
                tags_json=json.dumps(u.tags, ensure_ascii=False),
                notes=u.notes,
                created_at=u.createdAt,
                updated_at=u.updatedAt,
            )
        )
    await session.commit()


def row_to_unit(row: MemoryUnitRow) -> MemoryUnitOut:
    try:
        tags = json.loads(row.tags_json or "[]")
    except json.JSONDecodeError:
        tags = []
    return MemoryUnitOut(
        id=row.id,
        videoId=row.video_id,
        eventIndex=row.event_index,
        startSec=row.start_sec,
        endSec=row.end_sec,
        startHms=row.start_hms,
        endHms=row.end_hms,
        title=row.title,
        summary=row.summary,
        userTitle=row.user_title,
        userSummary=row.user_summary,
        tags=tags,
        notes=row.notes or "",
        createdAt=row.created_at,
        updatedAt=row.updated_at,
    )


async def list_all_units(session: AsyncSession) -> list[MemoryUnitOut]:
    result = await session.execute(select(MemoryUnitRow).order_by(MemoryUnitRow.start_sec))
    return [row_to_unit(r) for r in result.scalars()]


async def search_units_keyword(session: AsyncSession, q: str) -> list[MemoryUnitOut]:
    q_lower = f"%{q.lower()}%"
    stmt = select(MemoryUnitRow).where(
        or_(
            MemoryUnitRow.title.ilike(q_lower),
            MemoryUnitRow.summary.ilike(q_lower),
            MemoryUnitRow.tags_json.ilike(q_lower),
        )
    )
    result = await session.execute(stmt.order_by(MemoryUnitRow.start_sec))
    return [row_to_unit(r) for r in result.scalars()]
