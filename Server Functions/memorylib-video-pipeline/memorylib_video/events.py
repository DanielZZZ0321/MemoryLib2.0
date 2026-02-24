# events.py

import json
import os
from .video_utils import cut_event_segment

def materialize_events(
    original_video: str,
    timeline: list[dict],
    out_dir: str,
    video_id: str,
) -> list[dict]:
    os.makedirs(out_dir, exist_ok=True)
    manifest = []
    for ev in timeline:
        idx = ev["event_index"]
        start = ev["start_sec"]
        end = ev["end_sec"]
        out_name = f"{video_id}_ev_{idx:04d}.mp4"
        out_path = os.path.join(out_dir, out_name)

        cut_event_segment(original_video, start, end, out_path)

        record = {
            "video_id": video_id,
            "event_index": idx,
            "start_sec": start,
            "end_sec": end,
            "file_path": out_path,
        }
        manifest.append(record)

    manifest_path = os.path.join(out_dir, f"{video_id}_events_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    return manifest
