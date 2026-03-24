from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.schemas.timeline import ImportTimelineRequest, ImportTimelineResponse, MemoryUnitOut
from app.services.memory_repository import list_all_units
from app.services.timeline_commit import commit_timeline_import

router = APIRouter(prefix="/api/v1/timeline", tags=["timeline"])


@router.post("/import", response_model=ImportTimelineResponse)
async def import_timeline(body: ImportTimelineRequest, session: AsyncSession = Depends(get_session)):
    try:
        return await commit_timeline_import(session, body)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.get("/events", response_model=list[MemoryUnitOut])
async def get_events(session: AsyncSession = Depends(get_session)):
    return await list_all_units(session)
