from fastapi import APIRouter

from app.services.capabilities import detect_capabilities, ffmpeg_version

router = APIRouter(prefix="/api/v1", tags=["capabilities"])


@router.get("/capabilities")
async def capabilities():
    c = detect_capabilities()
    c["ffmpeg_version"] = ffmpeg_version()
    return c
