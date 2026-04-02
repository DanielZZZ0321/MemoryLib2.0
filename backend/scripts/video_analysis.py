#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
视频分析脚本：用 Gemini（AiHubMix 代理）分析视频。
供 Node 后端调用，通过 CLI 传入视频路径，输出 JSON 到 stdout。

用法:
  AIHUBMIX_API_KEY=xxx python video_analysis.py <video_path> [--timeline]
  --timeline: 时间线分析，否则普通摘要分析

依赖: pip install google-genai
"""

import json
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional, Union

# 默认提示词
DEFAULT_PROMPT = "Summarize the video, list 5 key events, and create a quiz with answers."

TIMELINE_PROMPT = """Analyze this video and output a JSON array of key events. Each event must have:
- "start_sec": number (start time in seconds)
- "end_sec": number (end time in seconds)
- "title": string (short title)
- "summary": string (brief description)
Output ONLY valid JSON, no other text. Example format:
[{"start_sec": 0, "end_sec": 15, "title": "Intro", "summary": "..."}, ...]"""

BASE_URL = "https://aihubmix.com/gemini"
MODEL = "gemini-2.5-pro"
DEFAULT_MIME = "video/mp4"


@dataclass
class VideoAnalysisResult:
    text: str
    usage_metadata: Optional[Any] = None


@dataclass
class TimelineEvent:
    start_sec: float
    end_sec: float
    title: str
    summary: str
    activity_type: str = ""
    environment: str = ""

    @classmethod
    def from_dict(cls, d: dict) -> "TimelineEvent":
        return cls(
            start_sec=float(d.get("start_sec", 0)),
            end_sec=float(d.get("end_sec", 0)),
            title=str(d.get("title", "")),
            summary=str(d.get("summary", "")),
            activity_type=str(d.get("activity_type", "")),
            environment=str(d.get("environment", "")),
        )

    def to_dict(self) -> dict:
        return {
            "start_sec": self.start_sec,
            "end_sec": self.end_sec,
            "title": self.title,
            "summary": self.summary,
            "activity_type": self.activity_type,
            "environment": self.environment,
        }


def _to_jsonable(obj: Any) -> Any:
    if obj is None:
        return None
    if isinstance(obj, (str, int, float, bool)):
        return obj
    if isinstance(obj, list):
        return [_to_jsonable(x) for x in obj]
    if isinstance(obj, tuple):
        return [_to_jsonable(x) for x in obj]
    if isinstance(obj, dict):
        return {str(k): _to_jsonable(v) for k, v in obj.items()}
    if hasattr(obj, "__dict__"):
        return _to_jsonable(vars(obj))
    return str(obj)


def analyze_video(
    video_source: Union[str, Path, bytes],
    prompt: str = DEFAULT_PROMPT,
    *,
    api_key: str,
    mime_type: str = DEFAULT_MIME,
    system_instruction: str = "You are a precise, structured video analyst.",
    max_output_tokens: int = 1024,
    temperature: float = 0.3,
) -> VideoAnalysisResult:
    from google import genai
    from google.genai import types

    if isinstance(video_source, (str, Path)):
        path = Path(video_source)
        if not path.is_file():
            raise FileNotFoundError(f"视频文件不存在: {path}")
        with open(path, "rb") as f:
            file_bytes = f.read()
    elif isinstance(video_source, bytes):
        file_bytes = video_source
    else:
        raise TypeError("video_source 应为路径(str/Path)或 bytes")

    client = genai.Client(
        api_key=api_key,
        http_options={"base_url": BASE_URL},
    )

    contents = types.Content(
        parts=[
            types.Part(
                inline_data=types.Blob(data=file_bytes, mime_type=mime_type),
            ),
            types.Part(text=prompt),
        ]
    )

    response = client.models.generate_content(
        model=MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            max_output_tokens=max_output_tokens,
            temperature=temperature,
            thinking_config=types.ThinkingConfig(
                thinking_budget=128,
                include_thoughts=False,
            ),
            media_resolution=types.MediaResolution.MEDIA_RESOLUTION_LOW,
        ),
    )

    return VideoAnalysisResult(
        text=response.text or "",
        usage_metadata=getattr(response, "usage_metadata", None),
    )


def _parse_timeline_json(text: str) -> list[dict]:
    text = (text or "").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    for pattern in (r"```(?:json)?\s*([\s\S]*?)```", r"\[[\s\S]*\]"):
        match = re.search(pattern, text)
        if match:
            raw = match.group(1).strip() if "```" in pattern else match.group(0)
            try:
                return json.loads(raw)
            except json.JSONDecodeError:
                continue
    return []


def analyze_video_timeline(
    video_source: Union[str, Path, bytes],
    prompt: str = TIMELINE_PROMPT,
    *,
    api_key: str,
    mime_type: str = DEFAULT_MIME,
    max_output_tokens: int = 2048,
) -> dict:
    result = analyze_video(
        video_source,
        prompt,
        api_key=api_key,
        mime_type=mime_type,
        system_instruction="You are a precise video analyst. Output only valid JSON array.",
        max_output_tokens=max_output_tokens,
    )
    raw_list = _parse_timeline_json(result.text)
    events = [TimelineEvent.from_dict(d).to_dict() for d in raw_list if isinstance(d, dict)]
    return {
        "events": events,
        "raw_text": result.text,
        "usage_metadata": _to_jsonable(result.usage_metadata),
    }


def main() -> None:
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "用法: python video_analysis.py <video_path> [--timeline]"}))
        sys.exit(1)

    video_path = Path(sys.argv[1])
    use_timeline = "--timeline" in sys.argv

    api_key = os.environ.get("AIHUBMIX_API_KEY", "").strip()
    if not api_key or api_key == "your_AiHubMix_api_key_here":
        print(json.dumps({"success": False, "error": "请设置环境变量 AIHUBMIX_API_KEY"}))
        sys.exit(1)

    if not video_path.is_file():
        print(json.dumps({"success": False, "error": f"视频文件不存在: {video_path}"}))
        sys.exit(1)

    try:
        if use_timeline:
            out = analyze_video_timeline(video_path, api_key=api_key)
            print(json.dumps({"success": True, "mode": "timeline", **out}, ensure_ascii=False))
        else:
            result = analyze_video(video_path, DEFAULT_PROMPT, api_key=api_key)
            usage = _to_jsonable(result.usage_metadata)
            print(json.dumps({
                "success": True,
                "mode": "summary",
                "text": result.text,
                "usage_metadata": usage,
            }, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
