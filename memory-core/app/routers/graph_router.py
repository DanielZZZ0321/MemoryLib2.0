from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

from app.graph import knowledge_graph

router = APIRouter(prefix="/api/v1/graph", tags=["graph"])


@router.get("/stats")
async def graph_stats():
    return knowledge_graph.graph_stats()


@router.get("/export")
async def graph_export():
    return PlainTextResponse(knowledge_graph.export_graph_json(), media_type="application/json")
