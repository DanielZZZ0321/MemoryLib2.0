#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Video Memory Pipeline

Usage:
  python run_pipeline.py --video /path/to/video.mp4
  python run_pipeline.py --video video.mp4 --work-dir ./work --output timeline.json
  python run_pipeline.py --video video.mp4 --skip-compress  # use existing compressed
"""

import argparse
import os

from memorylib_video.video_utils import compress_video
from memorylib_video.timeline import (
    build_global_timeline,
    summarize_timeline_events,
    save_timeline,
)


def main():
    ap = argparse.ArgumentParser(description="Build event timeline and summaries from egocentric video")
    ap.add_argument("--video", "-v", required=True, help="Input video file path")
    ap.add_argument("--work-dir", "-w", default="work", help="Work directory for compressed video and chunks")
    ap.add_argument("--output", "-o", default=None, help="Output JSON path (default: work/timeline_with_summary.json)")
    ap.add_argument("--skip-compress", action="store_true", help="Skip compression (use existing work/compressed.mp4)")
    args = ap.parse_args()

    video_path = os.path.abspath(args.video)
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video not found: {video_path}")

    work_dir = os.path.abspath(args.work_dir)
    compressed_video = os.path.join(work_dir, "compressed.mp4")
    chunk_dir = os.path.join(work_dir, "super_chunks")
    out_path = args.output or os.path.join(work_dir, "timeline_with_summary.json")

    print("=== Video Memory Pipeline ===\n")
    print(f"Input video:  {video_path}")
    print(f"Work dir:     {work_dir}")
    print(f"Output:       {out_path}\n")

    # Step 1: Compress
    if args.skip_compress and os.path.exists(compressed_video):
        print("Step 1: Using existing compressed video (--skip-compress)")
    else:
        print("Step 1: Compressing video...")
        os.makedirs(work_dir, exist_ok=True)
        compress_video(video_path, compressed_video)

    # Step 2: Build timeline
    print("\nStep 2: Building global timeline with LLM...")
    timeline = build_global_timeline(compressed_video, chunk_dir)

    # Step 3: Summarize
    print("\nStep 3: Summarizing each event...")
    enriched_timeline = summarize_timeline_events(compressed_video, timeline)

    # Save
    save_timeline(enriched_timeline, out_path)
    print(f"\nDone. Timeline saved to: {out_path}")


if __name__ == "__main__":
    main()
