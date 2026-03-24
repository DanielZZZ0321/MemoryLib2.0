from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.services.memory_repository import search_units_keyword
from app.stores import lance_store, vector_store

router = APIRouter(prefix="/api/v1", tags=["search"])


@router.get("/search")
async def search(q: str, session: AsyncSession = Depends(get_session)):
    kw = await search_units_keyword(session, q)
    chroma = vector_store.query_memory(q, n=8)
    lance = lance_store.vector_search(q, k=8)
    return {"keyword": kw, "semantic_chroma": chroma, "semantic_lance": lance}
