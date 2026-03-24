from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path

from fastapi import APIRouter, Body, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import get_session
from app.pipeline.media_ffmpeg import extract_audio_wav, save_upload_bytes
from app.pipeline.mcap_reader import mcap_to_raw_events, summarize_mcap
from app.pipeline.video_cv import describe_frames_stub, sample_frame_paths
from app.pipeline.whisper_transcribe import transcribe_video_segments
from app.schemas.timeline import ImportTimelineRequest, ImportTimelineResponse, TimelineEventInput
from app.services.timeline_commit import commit_timeline_import

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/ingest", tags=["ingest"])


@router.post("/video", response_model=ImportTimelineResponse)
async def ingest_video(
    file: UploadFile = File(...),
    visual: bool = False,
    session: AsyncSession = Depends(get_session),
):
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="empty file")
    suffix = Path(file.filename or "video.bin").suffix or ".mp4"
    path = save_upload_bytes(raw, suffix)
    wav = extract_audio_wav(path)
    target = wav or path
    loop = asyncio.get_running_loop()
    segments = await loop.run_in_executor(None, lambda: transcribe_video_segments(target))
    if visual:
        frames = sample_frame_paths(path, settings.clip_frame_interval_sec, settings.clip_max_frames)
        segments.extend(describe_frames_stub(frames))
    if not segments:
        raise HTTPException(
            status_code=422,
            detail="未能从视频生成时间线。请安装 openai-whisper + torch，并确保 ffmpeg 可用；"
            "或使用 /api/v1/timeline/import 导入已有 JSON。",
        )
    ev = [TimelineEventInput.model_validate(s) for s in segments]
    body = ImportTimelineRequest(filename=file.filename or path.name, raw_events=ev)
    return await commit_timeline_import(session, body)


@router.post("/mcap", response_model=ImportTimelineResponse)
async def ingest_mcap(
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_session),
):
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="empty file")
    suffix = Path(file.filename or "data.mcap").suffix or ".mcap"
    path = save_upload_bytes(raw, suffix)
    info = summarize_mcap(path)
    if info.get("error"):
        log.warning("mcap: %s", info["error"])
    events_dicts = mcap_to_raw_events(path)
    ev = [TimelineEventInput.model_validate(x) for x in events_dicts]
    body = ImportTimelineRequest(filename=file.filename or path.name, raw_events=ev)
    return await commit_timeline_import(session, body)


class SensorIngestBody(BaseModel):
    readings: list


@router.post("/sensor", response_model=ImportTimelineResponse)
async def ingest_sensor(
    payload: SensorIngestBody = Body(...),
    session: AsyncSession = Depends(get_session),
):
    """原始传感器 JSON 批次 → 单条结构化记忆（可后续按 schema 拆分）。"""
    text = json.dumps(payload.readings[:200], ensure_ascii=False)
    body = ImportTimelineRequest(
        filename="sensor_batch.json",
        raw_events=[
            TimelineEventInput(
                title="传感器批次",
                summary=text[:12000],
                start_sec=0,
                end_sec=0,
                tags=["sensor"],
            )
        ],
    )
    return await commit_timeline_import(session, body)
