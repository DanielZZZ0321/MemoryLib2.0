# video_utils.py
# -*- coding: utf-8 -*-
"""
Utility functions for common video tasks:
- segment: cut a video into clips by time ranges
- sampling: export frames uniformly or by time interval/count
- compress: re-encode/compress a video with optional scaling/bitrate control
- merge: concatenate multiple clips into a single output

Dependencies:
    - ffmpeg (command-line) must be installed and on PATH
    - Python packages: opencv-python (for frame sampling)

Author: Your Name
"""

from __future__ import annotations

import os
import shlex
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional, Sequence, Tuple, Union

try:
    import cv2  # type: ignore
except Exception:  # pragma: no cover
    cv2 = None


# ----------------------------- Helpers ------------------------------------- #

class FFmpegError(RuntimeError):
    pass


def _check_ffmpeg() -> None:
    try:
        subprocess.run(["ffmpeg", "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        subprocess.run(["ffprobe", "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
    except Exception as e:
        raise FFmpegError(
            "ffmpeg/ffprobe not found. Please install ffmpeg and ensure it's on your PATH."
        ) from e


def _run_ffmpeg(cmd: Sequence[str]) -> None:
    """Run an ffmpeg command and raise informative error on failure."""
    _check_ffmpeg()
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if proc.returncode != 0:
        raise FFmpegError(f"ffmpeg failed with code {proc.returncode}\nCMD: {' '.join(cmd)}\n{proc.stderr}")


def _format_time(t: Union[float, int, str]) -> str:
    """
    Normalize time to ffmpeg-friendly string.
    Accepts seconds (int/float) or 'HH:MM:SS(.ms)' string; returns string.
    """
    if isinstance(t, (int, float)):
        secs = float(t)
        hours = int(secs // 3600)
        mins = int((secs % 3600) // 60)
        s = secs % 60
        return f"{hours:02d}:{mins:02d}:{s:06.3f}"
    if isinstance(t, str):
        # naive acceptance; ffmpeg will validate
        return t
    raise TypeError("Time must be float/int seconds or 'HH:MM:SS(.ms)' string")


# ----------------------------- Public API ---------------------------------- #

@dataclass(frozen=True)
class SegmentSpec:
    """Represents a clip defined by start and end times (in seconds or HH:MM:SS)."""
    start: Union[float, int, str]
    end: Union[float, int, str]
    # Optional: name suffix for output file
    name: Optional[str] = None


def segment(
    input_path: Union[str, Path],
    segments: Sequence[SegmentSpec],
    output_dir: Union[str, Path],
    codec: str = "libx264",
    crf: int = 18,
    preset: str = "medium",
    accurate: bool = True,
    copy_audio: bool = True,
    overwrite: bool = True,
) -> List[Path]:
    """
    Cut a video into multiple clips.

    Args:
        input_path: Video file to cut.
        segments: List of SegmentSpec(start, end, name).
        output_dir: Directory to save clips.
        codec: Video codec for re-encoding (e.g., 'libx264', 'libx265').
        crf: Constant Rate Factor (lower = higher quality). Ignored if stream-copied.
        preset: Encoder preset (faster/slower trade-off).
        accurate: If True, decode + re-encode for frame-accurate cuts. If False, use -c copy (keyframe cuts only).
        copy_audio: If True and accurate=False, copy audio stream; if accurate=True, use 'aac' re-encode.
        overwrite: Overwrite existing outputs.

    Returns:
        List of Paths to created clips.
    """
    input_path = Path(input_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    outputs: List[Path] = []
    base = input_path.stem

    for i, seg in enumerate(segments, 1):
        ss = _format_time(seg.start)
        to = _format_time(seg.end)
        suffix = seg.name or f"{i:03d}"
        out = output_dir / f"{base}_part_{suffix}.mp4"

        if not overwrite and out.exists():
            outputs.append(out)
            continue

        if accurate:
            # Accurate seek: place -ss after -i and re-encode
            cmd = [
                "ffmpeg", "-hide_banner", "-y" if overwrite else "-n",
                "-i", str(input_path),
                "-ss", ss, "-to", to,
                "-c:v", codec, "-crf", str(crf), "-preset", preset,
                "-c:a", "aac" if copy_audio else "copy",
                str(out),
            ]
        else:
            # Fast (keyframe) cut: -ss before -i and stream copy
            cmd = [
                "ffmpeg", "-hide_banner", "-y" if overwrite else "-n",
                "-ss", ss, "-to", to, "-i", str(input_path),
                "-c", "copy" if copy_audio else "copy",
                str(out),
            ]

        _run_ffmpeg(cmd)
        outputs.append(out)

    return outputs


def sampling(
    input_path: Union[str, Path],
    out_dir: Union[str, Path],
    method: str = "uniform",
    fps: Optional[float] = None,
    every_n_seconds: Optional[float] = None,
    num_frames: Optional[int] = None,
    prefix: str = "frame",
    zero_pad: int = 6,
) -> List[Path]:
    """
    Extract frames as images.

    Methods:
        - 'uniform' with `fps`: sample at constant frames-per-second.
        - 'interval' with `every_n_seconds`: sample one frame every N seconds (best-effort).
        - 'count' with `num_frames`: sample N frames evenly across the whole video.

    Notes:
        Requires OpenCV (cv2). If unavailable, raises ImportError.

    Returns:
        List of saved frame Paths.
    """
    if cv2 is None:
        raise ImportError("OpenCV (cv2) is required for frame sampling. Install with `pip install opencv-python`.")

    input_path = Path(input_path)
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    cap = cv2.VideoCapture(str(input_path))
    if not cap.isOpened():
        raise RuntimeError(f"Failed to open video: {input_path}")

    native_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    n_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    duration = n_frames / native_fps if native_fps > 0 else 0.0

    # Determine target frame indices
    indices: List[int] = []

    if method == "uniform":
        if not fps or fps <= 0:
            raise ValueError("For method='uniform', please provide a positive `fps`.")
        step = max(int(round(native_fps / fps)), 1)
        indices = list(range(0, n_frames, step))

    elif method == "interval":
        if not every_n_seconds or every_n_seconds <= 0:
            raise ValueError("For method='interval', please provide a positive `every_n_seconds`.")
        if duration <= 0:
            indices = []
        else:
            times = [t for t in frange(0.0, duration, every_n_seconds)]
            indices = [min(int(round(t * native_fps)), n_frames - 1) for t in times]

    elif method == "count":
        if not num_frames or num_frames <= 0:
            raise ValueError("For method='count', please provide a positive `num_frames`.")
        if n_frames <= 0 or num_frames == 1:
            indices = [0]
        else:
            indices = [int(round(i * (n_frames - 1) / (num_frames - 1))) for i in range(num_frames)]

    else:
        raise ValueError("Unsupported method. Use one of: 'uniform', 'interval', 'count'.")

    saved_paths: List[Path] = []
    next_idx = 0
    target_set = set(indices)

    # Efficient sequential read
    frame_idx = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx in target_set:
            out_path = out_dir / f"{prefix}_{str(next_idx).zfill(zero_pad)}.jpg"
            # Default JPEG quality ~95
            cv2.imwrite(str(out_path), frame, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
            saved_paths.append(out_path)
            next_idx += 1

            # Optional: early stop if all indices captured
            if next_idx >= len(indices):
                break

        frame_idx += 1

    cap.release()
    return saved_paths


def frange(start: float, stop: float, step: float) -> Iterable[float]:
    """Floating range generator inclusive of start, exclusive of stop."""
    x = start
    # Guard against tiny floating errors
    while x < stop - 1e-9:
        yield x
        x += step


def compress(
    input_path: Union[str, Path],
    output_path: Union[str, Path],
    codec: str = "libx264",
    crf: Optional[int] = 23,
    preset: str = "medium",
    bitrate: Optional[str] = None,
    max_width: Optional[int] = None,
    max_height: Optional[int] = None,
    audio_codec: str = "aac",
    audio_bitrate: str = "128k",
    two_pass: bool = False,
    overwrite: bool = True,
) -> Path:
    """
    Re-encode/compress a video with optional scaling and bitrate/CRF control.

    Args:
        codec: e.g., 'libx264', 'libx265', 'h264_nvenc' (if GPU available)
        crf: Quality target (lower = higher quality). If `bitrate` provided, CRF may be ignored.
        preset: Encoder speed/efficiency trade-off.
        bitrate: Target video bitrate (e.g. '2500k'). If set and two_pass=True, runs 2-pass encoding.
        max_width/max_height: If provided, scale to fit within this box, preserving aspect ratio.
        audio_codec/audio_bitrate: Audio settings.
        two_pass: Use ffmpeg two-pass when bitrate is provided.
    """
    input_path = Path(input_path)
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    scale_filter = None
    if max_width or max_height:
        # Use 'scale' with -2 to keep even dimensions and preserve AR
        w = max_width if max_width else -2
        h = max_height if max_height else -2
        if max_width and not max_height:
            # limit width, auto height
            scale_filter = f"scale='if(gt(iw,ih),{w},-2)':'if(gt(iw,ih),-2,{w})':flags=lanczos"
        elif max_height and not max_width:
            scale_filter = f"scale='if(gt(iw,ih),-2,{h})':'if(gt(iw,ih),{h},-2)':flags=lanczos"
        else:
            scale_filter = f"scale='min(iw,{w})':'min(ih,{h})':flags=lanczos"

    vf = []
    if scale_filter:
        vf.append(scale_filter)
    vf_arg = []
    if vf:
        vf_arg = ["-vf", ",".join(vf)]

    # Build command(s)
    def pass_cmd(pass_num: int) -> List[str]:
        cmd = [
            "ffmpeg", "-hide_banner", "-y" if overwrite else "-n",
            "-i", str(input_path),
            *vf_arg,
            "-c:v", codec, "-preset", preset,
        ]
        if bitrate:
            cmd += ["-b:v", bitrate]
            if two_pass:
                cmd += ["-pass", str(pass_num), "-passlogfile", str(output_path) + ".log"]
        elif crf is not None:
            cmd += ["-crf", str(crf)]

        # audio
        cmd += ["-c:a", audio_codec, "-b:a", audio_bitrate]

        # Output
        if two_pass and pass_num == 1:
            cmd += ["-an", str(output_path)]
        else:
            cmd += [str(output_path)]
        return cmd

    if bitrate and two_pass:
        # First pass (no audio)
        _run_ffmpeg(pass_cmd(1))
        # Second pass
        _run_ffmpeg(pass_cmd(2))
        # Clean up ffmpeg log files if any
        for ext in (".log", ".log.mbtree"):
            p = Path(str(output_path) + ext)
            if p.exists():
                try:
                    p.unlink()
                except Exception:
                    pass
    else:
        _run_ffmpeg(pass_cmd(1))

    return output_path


def merge(
    inputs: Sequence[Union[str, Path]],
    output_path: Union[str, Path],
    reencode: bool = False,
    codec: str = "libx264",
    crf: int = 18,
    preset: str = "medium",
    overwrite: bool = True,
) -> Path:
    """
    Concatenate multiple clips into a single output.

    If `reencode=False`, uses ffmpeg concat demuxer and stream copies (fast, requires same codec/params).
    If `reencode=True`, concatenates by decoding and re-encoding (slower, works with mismatched inputs).

    Args:
        inputs: List of clip paths in the desired order.
        output_path: Destination file.
        reencode: Force re-encode merge.
        codec/crf/preset: Used when re-encoding.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    if not inputs:
        raise ValueError("No input files provided to merge().")

    norm_inputs = [str(Path(p).resolve()) for p in inputs]

    if not reencode:
        # Use concat demuxer with a temporary file list
        with tempfile.NamedTemporaryFile("w", delete=False, suffix=".txt") as tf:
            for p in norm_inputs:
                safe_p = str(p).replace("'", "'\\''")  # escape single quotes
                tf.write(f"file '{safe_p}'\n")

            filelist = tf.name

        try:
            cmd = [
                "ffmpeg", "-hide_banner", "-y" if overwrite else "-n",
                "-f", "concat", "-safe", "0",
                "-i", filelist,
                "-c", "copy",
                str(output_path),
            ]
            _run_ffmpeg(cmd)
        finally:
            try:
                os.remove(filelist)
            except Exception:
                pass
    else:
        # Decode each input and concat via filter_complex, then re-encode
        # Build input args and concat filter
        input_args: List[str] = []
        streams: List[str] = []
        for i, p in enumerate(norm_inputs):
            input_args += ["-i", p]
            streams.append(f"[{i}:v:0][{i}:a:0]")

        concat_filter = "".join(streams) + f"concat=n={len(norm_inputs)}:v=1:a=1[v][a]"
        cmd = [
            "ffmpeg", "-hide_banner", "-y" if overwrite else "-n",
            *input_args,
            "-filter_complex", concat_filter,
            "-map", "[v]", "-map", "[a]",
            "-c:v", codec, "-crf", str(crf), "-preset", preset,
            "-c:a", "aac",
            str(output_path),
        ]
        _run_ffmpeg(cmd)

    return output_path


# ----------------------------- Quick Examples ------------------------------- #
# (Run from a script / notebook; these are not executed when importing)
if __name__ == "__main__":
    # Example usage (uncomment and adjust paths to test):
    # clips = segment("sample.mp4",
    #                 [SegmentSpec(0, 10, "intro")],
    #                 "", accurate=True)
    # print("Segments:", clips)
    #
    # frames = sampling("sample.mp4", "frames", method="interval", every_n_seconds=2.0, prefix="snap")
    # print("Frames:", len(frames))
    #
    compressed = compress("sample.mp4", "output_compressed.mp4", crf=23, max_width=1280)
    print("Compressed:", compressed)
    #
    # merged = merge(clips, "merged.mp4", reencode=False)
    # print("Merged:", merged)
    pass
