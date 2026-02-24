# timeline.py
#
# 注意：需要在 config.py 里提供：
# LLM_CONFIG = {
#     "timeline": {...},
#     "merge": {...},
#     "summary": {...},
# }

import json
import re
import os
from typing import List

from google.genai import types

from .gemini_client import build_client
from .video_utils import (
    cut_super_chunks,
    cut_clip_temp,
    get_duration,
    build_summary_clip,
)
from .config import SUPER_CHUNK_SEC, PRE_MERGE_SEC, POST_MERGE_SEC, LLM_CONFIG


def log(msg: str):
    """统一日志输出入口。"""
    print(f"[Timeline] {msg}", flush=True)


def seconds_to_hms(sec: float) -> str:
    """把秒数转成 HH:MM:SS 格式（四舍五入到最近的秒）。"""
    total = int(round(float(sec)))
    h = total // 3600
    m = (total % 3600) // 60
    s = total % 60
    return f"{h:02d}:{m:02d}:{s:02d}"


def _fix_trailing_commas(s: str) -> str:
    """
    修掉类似:
      "xxx": 123,
    }
    或
      {...},
    ]
    的尾逗号，便于解析"伪 JSON"。
    """
    return re.sub(r",(\s*[\]}])", r"\1", s)


def _balance_brackets(s: str) -> str:
    """
    尝试补全不平衡的大括号/中括号：
    - 如果 { 比 } 多，就在末尾补若干 }
    - 如果 [ 比 ] 多，就在末尾补若干 ]
    仅用于粗糙修补被截断的 JSON。
    """
    open_close_pairs = [("{", "}"), ("[", "]")]

    for open_ch, close_ch in open_close_pairs:
        diff = s.count(open_ch) - s.count(close_ch)
        if diff > 0:
            s += close_ch * diff

    return s


def _parse_json_from_gemini(response, context: str = "") -> dict:
    """
    尝试从 Gemini 返回结果中稳健地解析出 JSON：
    1) 优先用 response.text
    2) 如果空，则从 candidates/parts 里拼 text
    3) 去掉 ```json ... ``` 代码块包裹
    4) 修尾逗号 + 补括号后 json.loads
    5) 失败则截取第一个 '{' 到最后一个 '}' 再尝试一次（同样修尾逗号 + 补括号）
    """
    raw = getattr(response, "text", None)

    # 如果 text 是 None 或空，尝试从 candidates 组装
    if not raw or not str(raw).strip():
        texts: List[str] = []
        try:
            for cand in getattr(response, "candidates", []) or []:
                content = getattr(cand, "content", None)
                if not content:
                    continue
                for part in getattr(content, "parts", []) or []:
                    t = getattr(part, "text", None)
                    if t:
                        texts.append(t)
        except Exception:
            pass

        raw = "\n".join(texts).strip()

        if not raw or not str(raw).strip():
            pf = getattr(response, "prompt_feedback", None)
            cands = getattr(response, "candidates", None)
            log(
                f"[Gemini JSON parse] Empty response, context={context}. "
                f"prompt_feedback={pf!r}, candidates_head={str(cands)[:200]!r}"
            )
            raise RuntimeError(f"[Gemini JSON parse] Empty response. context={context}")

    s = str(raw).strip()

    # 处理 ```json ... ``` 或 ``` 包裹的情况
    if s.startswith("```"):
        lines = s.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip().startswith("```"):
            lines = lines[:-1]
        s = "\n".join(lines).strip()

    # 第一次：全局修尾逗号 + 补括号
    s_fixed = _fix_trailing_commas(s)
    s_fixed = _balance_brackets(s_fixed)

    # 先尝试直接解析
    try:
        return json.loads(s_fixed)
    except json.JSONDecodeError:
        # 再尝试截取第一个 '{' 到最后一个 '}' 的子串
        start = s_fixed.find("{")
        end = s_fixed.rfind("}")
        if start != -1 and end != -1 and end > start:
            inner = s_fixed[start: end + 1]
            inner_fixed = _fix_trailing_commas(inner)
            inner_fixed = _balance_brackets(inner_fixed)
            try:
                return json.loads(inner_fixed)
            except json.JSONDecodeError as e2:
                raise RuntimeError(
                    f"[Gemini JSON parse] Failed to parse JSON in context={context}. "
                    f"Second-level error={e2}. "
                    f"Raw head: {s_fixed[:200]!r}"
                )
        else:
            raise RuntimeError(
                f"[Gemini JSON parse] No JSON object found in response. "
                f"context={context}, raw head: {s_fixed[:200]!r}"
            )


TIMELINE_ONLY_PROMPT = """
You are an egocentric video event segmenter for a personal memory system.

Task:
- Watch the entire video segment.
- Split it into a sequence of meaningful events from the wearer's perspective.
- Each event should be a coherent activity with a simple goal.

Segmentation granularity:
- Prefer LONGER, more stable events over very short ones.
- Typical event duration: 30–180 seconds.
- For about 10 minutes of video, aim for around 5–12 events.
- ABSOLUTELY DO NOT produce more than 20 events for one input segment.

When NOT to cut:
- Do NOT split events for small camera motions, brief gaze shifts, or micro-actions.
- Do NOT split just because a hand picks up or puts down an object if the main activity/goal stays the same.
- Only cut when the main goal, main focus, or location clearly changes.

Output STRICT JSON only:

{
  "events": [
    {
      "local_index": <int>,
      "local_start": <float>,
      "local_end": <float>
    },
    ...
  ]
}

Guidelines:
- Ensure events are ordered and non-overlapping.
- Insert an event boundary only when the main goal, main focus, or location clearly changes.
- No extra text.
"""


def generate_chunk_timeline(
    chunk_path: str,
    chunk_index: int,
    max_retry: int = 3,
) -> list[dict]:
    """
    对单个 super chunk 调用 Gemini 生成本地 timeline。
    - 最多重试 max_retry 次
    - 全部失败则用"整段是一个事件"的兜底结果
    """
    client = build_client()

    log(f"[Chunk {chunk_index}] Loading video bytes: {chunk_path}")
    with open(chunk_path, "rb") as f:
        file_bytes = f.read()

    contents = types.Content(
        parts=[
            types.Part(
                inline_data=types.Blob(
                    data=file_bytes,
                    mime_type="video/mp4",
                )
            ),
            types.Part(text=TIMELINE_ONLY_PROMPT),
        ]
    )

    last_error: Exception | None = None
    cfg = LLM_CONFIG["timeline"]

    for attempt in range(1, max_retry + 1):
        log(f"[Chunk {chunk_index}] LLM request attempt {attempt}/{max_retry}...")

        try:
            response = client.models.generate_content(
                model="gemini-2.5-pro",
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=(
                        "You are a precise, structured timeline extractor. "
                        "Only output valid JSON."
                    ),
                    response_mime_type=cfg["response_mime_type"],
                    max_output_tokens=cfg["max_output_tokens"],
                    temperature=cfg["temperature"],
                    media_resolution=(
                        types.MediaResolution.MEDIA_RESOLUTION_LOW
                        if cfg.get("media_resolution", "low") == "low"
                        else types.MediaResolution.MEDIA_RESOLUTION_MEDIUM
                    ),
                ),
            )

            log(f"[Chunk {chunk_index}] LLM responded, parsing JSON...")

            obj = _parse_json_from_gemini(
                response,
                context=f"generate_chunk_timeline({chunk_path}), attempt={attempt}",
            )

            events = obj.get("events")
            if not isinstance(events, list):
                raise RuntimeError("`events` not found or not a list.")

            log(f"[Chunk {chunk_index}] Parsed {len(events)} events successfully.")
            return events

        except Exception as e:
            last_error = e
            log(f"[Chunk {chunk_index}] attempt {attempt} failed: {repr(e)}")

    # ---- 兜底逻辑：所有尝试都失败 ----
    log(
        f"[Chunk {chunk_index}] All {max_retry} attempts failed. "
        f"Fallback to a single whole-chunk event. Last error: {repr(last_error)}"
    )

    try:
        dur = float(get_duration(chunk_path))
    except Exception as e:
        log(f"[Chunk {chunk_index}] get_duration failed: {e}")
        dur = 0.0

    return [
        {
            "local_index": 0,
            "local_start": 0.0,
            "local_end": dur,
        }
    ]


MERGE_BOUNDARY_PROMPT = """
You will see TWO short consecutive egocentric video clips:

- Clip A: the END of one tentative event.
- Clip B: the BEGINNING of the next tentative event.

Task:
Decide whether these two clips should be considered ONE continuous event
or TWO separate events.

Output STRICT JSON only:

{
  "merge": <true_or_false>,
  "score": <float>,
  "reason": <string>
}

Criteria:
- If the main activity, goal, location, and people stay continuous with no clear shift,
  prefer merge = true.
- If there is a clear change in activity, goal, location, or social context,
  prefer merge = false.
- No extra text.
"""


def llm_should_merge_boundary(
    video_path: str,
    prev_event: dict,
    next_event: dict,
    pre_sec: float = PRE_MERGE_SEC,
    post_sec: float = POST_MERGE_SEC,
) -> dict:
    """
    在 super-chunk 边界上，用 LLM 判定 prev_event 和 next_event
    是否应该合并成一个连续事件。
    - 如果解析失败，则 fallback：merge=False
    """
    client = build_client()

    log(
        "Boundary check: "
        f"prev=({prev_event.get('start_sec'):.2f}, {prev_event.get('end_sec'):.2f}), "
        f"next=({next_event.get('start_sec'):.2f}, {next_event.get('end_sec'):.2f})"
    )

    clip_a = cut_clip_temp(
        video_path,
        start_sec=max(prev_event["end_sec"] - pre_sec, prev_event["start_sec"]),
        duration=pre_sec,
        prefix="boundary_A_",
    )
    clip_b = cut_clip_temp(
        video_path,
        start_sec=next_event["start_sec"],
        duration=post_sec,
        prefix="boundary_B_",
    )

    with open(clip_a, "rb") as fa, open(clip_b, "rb") as fb:
        bytes_a = fa.read()
        bytes_b = fb.read()

    contents = types.Content(
        parts=[
            types.Part(
                inline_data=types.Blob(
                    data=bytes_a,
                    mime_type="video/mp4",
                )
            ),
            types.Part(text="Above is Clip A (end of previous event)."),
            types.Part(
                inline_data=types.Blob(
                    data=bytes_b,
                    mime_type="video/mp4",
                )
            ),
            types.Part(text="Above is Clip B (start of next event)."),
            types.Part(text=MERGE_BOUNDARY_PROMPT),
        ]
    )

    cfg = LLM_CONFIG["merge"]

    response = client.models.generate_content(
        model="gemini-2.5-pro",
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=(
                "You are a precise, structured event boundary judge. "
                "Only output valid JSON."
            ),
            response_mime_type=cfg["response_mime_type"],
            max_output_tokens=cfg["max_output_tokens"],
            temperature=cfg["temperature"],
            media_resolution=(
                types.MediaResolution.MEDIA_RESOLUTION_LOW
                if cfg.get("media_resolution", "low") == "low"
                else types.MediaResolution.MEDIA_RESOLUTION_MEDIUM
            ),
        ),
    )

    try:
        obj = _parse_json_from_gemini(
            response,
            context=(
                "llm_should_merge_boundary("
                f"{video_path}, prev=({prev_event.get('start_sec')},"
                f"{prev_event.get('end_sec')}), "
                f"next=({next_event.get('start_sec')},"
                f"{next_event.get('end_sec')}))"
            ),
        )

        log(
            "Boundary LLM decision: "
            f"merge={obj.get('merge')} "
            f"score={obj.get('score')} "
            f"reason={str(obj.get('reason', ''))[:80]!r}"
        )
        return obj

    except Exception as e:
        # 解析失败 → fallback 不合并
        raw = getattr(response, "text", "") or ""
        if not raw.strip():
            texts: List[str] = []
            try:
                for cand in getattr(response, "candidates", []) or []:
                    content = getattr(cand, "content", None)
                    if not content:
                        continue
                    for part in getattr(content, "parts", []) or []:
                        t = getattr(part, "text", None)
                        if t:
                            texts.append(t)
            except Exception:
                pass
            raw = "\n".join(texts)

        log(
            "[Boundary] JSON parse failed, fallback to merge=False. "
            f"Error={repr(e)}, raw head={raw[:200]!r}"
        )
        return {
            "merge": False,
            "score": 0.0,
            "reason": f"Fallback no-merge due to parse error: {e}",
        }


def build_global_timeline(compressed_video: str, chunk_dir: str) -> list[dict]:
    """
    1. super-chunk 切分
    2. 每个 chunk 生成 local timeline
    3. local → global 时间线
    4. 在 super-chunk 接缝处用 LLM 判断 merge
    """
    log("=== Step 2.1: Cutting super chunks ===")
    chunks = cut_super_chunks(compressed_video, chunk_dir, SUPER_CHUNK_SEC)
    log(f"Super chunks created: {len(chunks)}")

    events: list[dict] = []

    log("=== Step 2.2: Generating local timelines (LLM per chunk) ===")
    for i, ch in enumerate(chunks):
        log(
            f"--- Processing Chunk {i}: offset={ch['offset']:.2f}s "
            f"path={ch['path']} ---"
        )
        local_events = generate_chunk_timeline(ch["path"], chunk_index=i)
        offset = ch["offset"]

        for ev in local_events:
            events.append(
                {
                    "start_sec": offset + float(ev["local_start"]),
                    "end_sec": offset + float(ev["local_end"]),
                    "source_chunk": i,
                }
            )

    log(f"Local events collected: {len(events)}; sorting...")

    events.sort(key=lambda e: e["start_sec"])

    log("=== Step 2.3: Boundary merge checks ===")
    merged: list[dict] = []
    if not events:
        log("No events detected (empty). Returning empty timeline.")
        return merged

    merged.append(events[0].copy())
    for ev in events[1:]:
        prev = merged[-1]

        if prev["source_chunk"] != ev["source_chunk"]:
            log(
                "Boundary between chunks "
                f"{prev['source_chunk']} → {ev['source_chunk']} → LLM merge check"
            )
            decision = llm_should_merge_boundary(compressed_video, prev, ev)

            if decision.get("merge", False):
                prev["end_sec"] = ev["end_sec"]
                continue

        merged.append(ev.copy())

    log("=== Step 2.4: Assigning event indices & HMS timestamps ===")
    for idx, e in enumerate(merged):
        e["event_index"] = idx
        e["start_hms"] = seconds_to_hms(e["start_sec"])
        e["end_hms"] = seconds_to_hms(e["end_sec"])

    log(f"Timeline completed. Total merged events: {len(merged)}")
    return merged


# ========= 事件摘要（逐段理解） =========

EVENT_SUMMARY_PROMPT = """
You are an egocentric video event summarizer for a personal memory system.

Task:
- Watch the entire video clip (one event).
- Give a concise, human-readable understanding of what happens in this event.

Output STRICT JSON only:

{
  "title": "<short title for this event>",
  "summary": "<2-4 sentences describing what the wearer is doing, key objects/people, and the main goal>"
}

Guidelines:
- The title should be short (<= 12 words), like a chapter heading.
- The summary should describe the main activity, goal, and context (location, people, important objects).
- Focus on what the camera wearer is doing.
- No extra text outside the JSON.
"""


def summarize_timeline_events(
    video_path: str,
    timeline: list[dict],
    max_retry: int = 2,
) -> list[dict]:
    """
    对 global timeline 中的每一个事件，调用 Gemini 做逐段事件理解，
    为每个事件生成 {title, summary} 并写回到事件 dict 里。
    使用 build_summary_clip 生成"抽帧版"完整事件视频，以降低 token 压力。
    """
    client = build_client()
    enriched: list[dict] = []

    log("=== Step 3: Summarizing each event ===")
    cfg = LLM_CONFIG["summary"]

    for ev in timeline:
        idx = ev.get("event_index", -1)
        start = float(ev["start_sec"])
        end = float(ev["end_sec"])
        full_duration = max(0.5, end - start)

        log(
            f"[Summary] Event {idx}: start={start:.2f}s, end={end:.2f}s, "
            f"duration={full_duration:.2f}s"
        )

        # 为该事件生成抽帧版 summary clip（覆盖整个事件时段）
        clip_path = build_summary_clip(
            video_path,
            start_sec=start,
            end_sec=end,
            max_frames=300,
            prefix=f"event_{idx:03d}_",
        )

        title = ""
        summary = ""
        last_error: Exception | None = None

        for attempt in range(1, max_retry + 1):
            log(f"[Summary] Event {idx} LLM request attempt {attempt}/{max_retry}...")

            try:
                with open(clip_path, "rb") as f:
                    bytes_clip = f.read()

                contents = types.Content(
                    parts=[
                        types.Part(
                            inline_data=types.Blob(
                                data=bytes_clip,
                                mime_type="video/mp4",
                            )
                        ),
                        types.Part(text=EVENT_SUMMARY_PROMPT),
                    ]
                )

                response = client.models.generate_content(
                    model="gemini-2.5-pro",
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=(
                            "You are a precise event summarizer. Only output valid JSON."
                        ),
                        response_mime_type=cfg["response_mime_type"],
                        max_output_tokens=cfg["max_output_tokens"],
                        temperature=cfg["temperature"],
                        media_resolution=(
                            types.MediaResolution.MEDIA_RESOLUTION_LOW
                            if cfg.get("media_resolution", "low") == "low"
                            else types.MediaResolution.MEDIA_RESOLUTION_MEDIUM
                        ),
                    ),
                )

                try:
                    obj = _parse_json_from_gemini(
                        response,
                        context=f"event_summary(event_index={idx}, {start:.2f}-{end:.2f})",
                    )
                    title = obj.get("title", "").strip()
                    summary = obj.get("summary", "").strip()

                    if not title and not summary:
                        raise RuntimeError(
                            "Both title and summary are empty in model output."
                        )

                    log(
                        f"[Summary] Event {idx} summary ok: "
                        f"title={title!r}, summary_head={summary[:60]!r}"
                    )
                    break

                except Exception as e_parse:
                    # JSON 解析失败，尝试直接用原始文本作为 summary
                    last_error = e_parse
                    raw = getattr(response, "text", "") or ""
                    if not raw.strip():
                        texts: List[str] = []
                        try:
                            for cand in getattr(response, "candidates", []) or []:
                                content = getattr(cand, "content", None)
                                if not content:
                                    continue
                                for part in getattr(content, "parts", []) or []:
                                    t = getattr(part, "text", None)
                                    if t:
                                        texts.append(t)
                        except Exception:
                            pass
                        raw = "\n".join(texts)

                    raw = raw.strip()
                    if raw:
                        title = f"Event {idx}"
                        summary = raw
                        log(
                            f"[Summary] Event {idx} JSON parse failed, using raw text as summary. "
                            f"Error={repr(e_parse)}, raw_head={raw[:80]!r}"
                        )
                        break  # 使用 raw 后就不再重试
                    else:
                        log(
                            f"[Summary] Event {idx} JSON parse failed and raw is empty. "
                            f"Error={repr(e_parse)}"
                        )
                        # 继续下一次 attempt

            except Exception as e:
                last_error = e
                log(
                    f"[Summary] Event {idx} attempt {attempt} failed: {repr(e)}"
                )

        # 清理临时片段文件
        try:
            if os.path.exists(clip_path):
                os.remove(clip_path)
        except Exception as e:
            log(f"[Summary] Failed to remove temp clip {clip_path}: {e}")

        # 所有尝试都失败（没拿到任何 title/summary）时的兜底
        if not title and not summary:
            log(
                f"[Summary] Event {idx} all attempts failed. "
                f"Fallback plain summary. Last error: {repr(last_error)}"
            )
            title = f"Event {idx}"
            summary = (
                f"Event {idx} from {start:.2f}s ({seconds_to_hms(start)}) "
                f"to {end:.2f}s ({seconds_to_hms(end)}). "
                f"(No AI summary due to error: {last_error})"
            )

        new_ev = dict(ev)
        new_ev["title"] = title
        new_ev["summary"] = summary
        enriched.append(new_ev)

    log(f"Event summarization completed. Total events summarized: {len(enriched)}")
    return enriched


def save_timeline(timeline: list[dict], out_path: str):
    """将 timeline（可以是带 summary 的 enriched timeline）存为 JSON 文件。"""
    out_dir = os.path.dirname(out_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(timeline, f, ensure_ascii=False, indent=2)
    log(f"Timeline saved to {out_path}")
