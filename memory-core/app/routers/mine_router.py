from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.services.memory_repository import list_all_units
from app.services.mining import simple_tag_cooccurrence

router = APIRouter(prefix="/api/v1/mine", tags=["mine"])


@router.post("/patterns")
async def mine_patterns(session: AsyncSession = Depends(get_session)):
    units = await list_all_units(session)
    return simple_tag_cooccurrence(units)
