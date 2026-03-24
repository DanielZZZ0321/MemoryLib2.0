"""OpenCV frame sampling + optional CLIP-style captions (stub metadata)."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

log = logging.getLogger(__name__)


def sample_frame_paths(video_path: Path, interval_sec: float, max_frames: int) -> list[tuple[float, Path]]:
    try:
        import cv2
    except ImportError:
        log.warning("opencv not installed")
        return []

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        return []
    _ = cap.get(cv2.CAP_PROP_FPS)
    frames: list[tuple[float, Path]] = []
    from app.pipeline.media_ffmpeg import save_upload_bytes

    idx = 0
    t = 0.0
    while len(frames) < max_frames:
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
        ok, frame = cap.read()
        if not ok:
            break
        _, buf = cv2.imencode(".jpg", frame)
        p = save_upload_bytes(buf.tobytes(), f"_frame_{idx}.jpg")
        frames.append((t, p))
        idx += 1
        t += interval_sec
    cap.release()
    return frames


def describe_frames_stub(frames: list[tuple[float, Path]]) -> list[dict[str, Any]]:
    """Placeholder until SigLIP/CLIP wired — returns visual index events."""
    events = []
    for t, p in frames:
        events.append(
            {
                "start_sec": t,
                "end_sec": t + 0.1,
                "title": "Visual keyframe",
                "summary": f"Sampled frame at {t:.1f}s ({p.name}). CLIP/SigLIP embedding not run in this build.",
                "tags": ["vision", "keyframe"],
            }
        )
    return events
