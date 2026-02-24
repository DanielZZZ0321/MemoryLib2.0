# video_utils.py

import subprocess
import tempfile
import os
from typing import List

from .config import MAX_WIDTH, MAX_HEIGHT, VIDEO_BITRATE, AUDIO_BITRATE


def run_ffmpeg(cmd: List[str]):
    """通用 ffmpeg 调用封装，出错时抛异常。"""
    print("Running:", " ".join(cmd))
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if p.returncode != 0:
        print(p.stderr)
        raise RuntimeError("ffmpeg failed")


def get_duration(video_path: str) -> float:
    """用 ffprobe 获取视频时长（秒）。"""
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        video_path,
    ]
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if p.returncode != 0:
        raise RuntimeError("ffprobe failed")
    return float(p.stdout.strip())


def compress_video(input_path: str, output_path: str):
    """
    压缩视频：
    - 降分辨率到 MAX_WIDTH x MAX_HEIGHT 内
    - 码率压缩到配置指定
    - 打印简单的进度条
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    total_duration = get_duration(input_path)

    # 用 -progress 文件的方式获取进度
    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        progress_path = tmp.name

    scale = (
        f"scale='min({MAX_WIDTH},iw)':'min({MAX_HEIGHT},ih)':"
        "force_original_aspect_ratio=decrease"
    )
    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-vf", scale,
        "-c:v", "libx264", "-b:v", VIDEO_BITRATE,
        "-c:a", "aac", "-b:a", AUDIO_BITRATE,
        "-movflags", "+faststart",
        "-progress", progress_path,
        "-nostats",
        "-loglevel", "error",
        output_path,
    ]

    print("Running:", " ".join(cmd))
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

    try:
        last_print = -1
        while proc.poll() is None:
            # 读取 progress 文件
            if os.path.exists(progress_path):
                with open(progress_path, "r", encoding="utf-8", errors="ignore") as f:
                    lines = f.read().strip().splitlines()
                out_time = None
                for line in lines:
                    if line.startswith("out_time="):
                        # 格式类似 out_time=00:05:10.12
                        _, ts = line.split("=", 1)
                        h, m, s = ts.split(":")
                        out_time = int(h) * 3600 + int(m) * 60 + float(s)
                if out_time is not None and total_duration > 0:
                    ratio = min(max(out_time / total_duration, 0.0), 1.0)
                    percent = int(ratio * 100)
                    if percent != last_print:
                        bar_len = 40
                        filled = int(ratio * bar_len)
                        bar = "#" * filled + "-" * (bar_len - filled)
                        print(
                            f"Compressing: [{bar}] {ratio * 100:5.1f}%  "
                            f"({out_time:.1f}/{total_duration:.1f}s)",
                            end="\r",
                        )
                        last_print = percent
        print()  # 换行
    finally:
        if os.path.exists(progress_path):
            try:
                os.remove(progress_path)
            except OSError:
                pass

    stdout, stderr = proc.communicate()
    if proc.returncode != 0:
        print(stderr)
        raise RuntimeError("ffmpeg compression failed")
    print("Compression finished.")


def cut_super_chunks(video_path: str, out_dir: str, chunk_sec: float) -> list[dict]:
    """
    按固定时长切分 super-chunk，用于给 LLM 生成 local timeline。
    返回列表，每个元素包含:
    - index
    - offset (全局起点秒数)
    - duration
    - path (切分后文件路径)
    """
    os.makedirs(out_dir, exist_ok=True)
    duration = get_duration(video_path)
    chunks: list[dict] = []
    offset = 0.0
    idx = 0
    while offset < duration - 0.5:
        this_dur = min(chunk_sec, duration - offset)
        out_path = os.path.join(out_dir, f"super_{idx:03d}.mp4")
        cmd = [
            "ffmpeg", "-y",
            "-ss", str(offset),
            "-t", str(this_dur),
            "-i", video_path,
            "-c", "copy",
            out_path,
        ]
        run_ffmpeg(cmd)
        chunks.append({"index": idx, "offset": offset, "duration": this_dur, "path": out_path})
        idx += 1
        offset += this_dur
    return chunks


def cut_clip_temp(video_path: str, start_sec: float, duration: float, prefix: str = "clip_") -> str:
    """从视频中切出一个临时 clip（无重编码），用于边界判断等。"""
    tmp = tempfile.NamedTemporaryFile(suffix=".mp4", prefix=prefix, delete=False)
    tmp_path = tmp.name
    tmp.close()
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start_sec),
        "-t", str(duration),
        "-i", video_path,
        "-c", "copy",
        tmp_path,
    ]
    run_ffmpeg(cmd)
    return tmp_path


def cut_event_segment(original_video: str, start_sec: float, end_sec: float, out_path: str):
    """从原视频中裁剪一个完整事件段（无重编码），用于后续存储或展示。"""
    duration = max(0.1, end_sec - start_sec)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start_sec),
        "-t", str(duration),
        "-i", original_video,
        "-c", "copy",
        out_path,
    ]
    run_ffmpeg(cmd)


def build_summary_clip(
    video_path: str,
    start_sec: float,
    end_sec: float,
    max_frames: int = 300,
    prefix: str = "summary_",
) -> str:
    """
    为一个 [start_sec, end_sec] 事件生成"抽帧版" summary clip：
    - 覆盖整个事件时间范围（不只截中间一小段）
    - 通过 fps 滤镜控制总帧数在 max_frames 左右
    - 只保留视频（去掉音频），方便给多模态 LLM 看完整过程的"压缩版"
    """
    duration = max(0.5, end_sec - start_sec)

    # 计算合适的 fps，使得总帧数 ≈ max_frames
    fps = max_frames / duration
    # 限制 fps 在合理范围，避免过大或过小
    if fps > 10.0:
        fps = 10.0
    if fps < 0.1:
        fps = 0.1

    tmp = tempfile.NamedTemporaryFile(suffix=".mp4", prefix=prefix, delete=False)
    tmp_path = tmp.name
    tmp.close()

    scale = (
        f"scale='min({MAX_WIDTH},iw)':'min({MAX_HEIGHT},ih)':"
        "force_original_aspect_ratio=decrease"
    )
    vf = f"fps={fps},{scale}"

    cmd = [
        "ffmpeg", "-y",
        "-ss", str(start_sec),
        "-t", str(duration),
        "-i", video_path,
        "-vf", vf,
        "-c:v", "libx264",
        "-an",  # 去掉音频
        "-movflags", "+faststart",
        tmp_path,
    ]
    run_ffmpeg(cmd)
    return tmp_path
