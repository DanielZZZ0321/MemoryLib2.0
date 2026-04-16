#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
对视频片段或整段视频进行 VLM 问答（Gemini via AiHubMix）。
用法:
  python video_query.py segment <clip_path> "<question>"
  python video_query.py full <video_path> "<question>"
输出 JSON 到 stdout: {"success": true, "text": "..."} 或 {"success": false, "error": "..."}
"""
import json
import os
import sys
from pathlib import Path
from typing import Union

BASE_URL = "https://aihubmix.com/gemini"
MODEL = "gemini-2.5-pro"
DEFAULT_MIME = "video/mp4"


def _analyze(
    video_source: Union[str, Path],
    prompt: str,
    *,
    api_key: str,
    mime_type: str = DEFAULT_MIME,
    max_output_tokens: int = 2048,
) -> str:
    from google import genai
    from google.genai import types

    path = Path(video_source)
    if not path.is_file():
        raise FileNotFoundError(f"文件不存在: {path}")
    with open(path, "rb") as f:
        file_bytes = f.read()

    client = genai.Client(api_key=api_key, http_options={"base_url": BASE_URL})
    contents = types.Content(
        parts=[
            types.Part(inline_data=types.Blob(data=file_bytes, mime_type=mime_type)),
            types.Part(text=prompt),
        ]
    )
    response = client.models.generate_content(
        model=MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction="You are a precise video analyst. Answer in the same language as the user's question when possible.",
            max_output_tokens=max_output_tokens,
            temperature=0.2,
            thinking_config=types.ThinkingConfig(
                thinking_budget=128,
                include_thoughts=False,
            ),
            media_resolution=types.MediaResolution.MEDIA_RESOLUTION_LOW,
        ),
    )
    return response.text or ""


def main() -> None:
    if len(sys.argv) < 4:
        print(
            json.dumps(
                {
                    "success": False,
                    "error": "用法: video_query.py segment <clip_path> <question> | video_query.py full <video_path> <question>",
                },
                ensure_ascii=False,
            )
        )
        sys.exit(1)

    mode = sys.argv[1]
    path = Path(sys.argv[2])
    question = " ".join(sys.argv[3:]).strip()

    api_key = os.environ.get("AIHUBMIX_API_KEY", "").strip()
    if not api_key or api_key == "your_AiHubMix_api_key_here":
        print(json.dumps({"success": False, "error": "请设置 AIHUBMIX_API_KEY"}, ensure_ascii=False))
        sys.exit(1)

    try:
        if mode == "segment":
            prompt = (
                "The user is asking about THIS short video clip only. "
                "Be specific and cite what you see. If unsure, say so.\n\n"
                f"Question: {question}"
            )
            text = _analyze(path, prompt, api_key=api_key)
        elif mode == "full":
            prompt = (
                "The user is asking about the full video. Scan the entire timeline and answer. "
                "Be specific. If the question targets a moment you cannot locate, describe what you can observe.\n\n"
                f"Question: {question}"
            )
            text = _analyze(path, prompt, api_key=api_key, max_output_tokens=4096)
        else:
            print(json.dumps({"success": False, "error": f"未知模式: {mode}"}, ensure_ascii=False))
            sys.exit(1)
        print(json.dumps({"success": True, "text": text}, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
