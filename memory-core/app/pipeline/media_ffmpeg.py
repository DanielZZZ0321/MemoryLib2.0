"""FFmpeg helpers — extract audio / probe duration."""

from __future__ import annotations

import json
import logging
import subprocess
import uuid
from pathlib import Path

from app.config import settings

log = logging.getLogger(__name__)


def probe_duration_sec(video_path: Path) -> float | None:
    if not settings.ffmpeg_bin:
        return None
    try:
        cmd = [
            settings.ffmpeg_bin,
            "-hide_banner",
            "-i",
            str(video_path),
            "-f",
            "null",
            "-",
        ]
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        text = (p.stderr or "") + (p.stdout or "")
        # Duration: 00:01:23.45
        import re

        m = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", text)
        if not m:
            return None
        h, mn, s = int(m.group(1)), int(m.group(2)), float(m.group(3))
        return h * 3600 + mn * 60 + s
    except (OSError, subprocess.TimeoutExpired) as e:
        log.warning("ffprobe duration failed: %s", e)
        return None


def extract_audio_wav(video_path: Path, out_wav: Path | None = None) -> Path | None:
    """16k mono wav for Whisper."""
    if not settings.ffmpeg_bin:
        return None
    out_wav = out_wav or video_path.with_suffix(".wav")
    cmd = [
        settings.ffmpeg_bin,
        "-y",
        "-i",
        str(video_path),
        "-vn",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-f",
        "wav",
        str(out_wav),
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=600)
        return out_wav if out_wav.is_file() else None
    except (OSError, subprocess.TimeoutExpired, subprocess.CalledProcessError) as e:
        log.warning("ffmpeg extract audio failed: %s", e)
        return None


def save_upload_bytes(data: bytes, suffix: str) -> Path:
    settings.uploads_dir.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{suffix}"
    path = settings.uploads_dir / name
    path.write_bytes(data)
    return path
