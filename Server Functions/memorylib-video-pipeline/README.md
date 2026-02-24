# Memorylib Video Pipeline

A standalone pipeline for segmenting egocentric video into events and generating summaries using Gemini (via AiHubMix).

## Features

- **Compress** long videos for efficient processing
- **Segment** into super-chunks (~10 min each)
- **Build timeline** — LLM extracts event boundaries per chunk
- **Merge** adjacent events across chunk boundaries (LLM boundary check)
- **Summarize** each event with title + description

## Requirements

- Python 3.10+
- [ffmpeg](https://ffmpeg.org/) (must be in PATH)
- AiHubMix API key (for Gemini)

## Install

```bash
cd memorylib-video-pipeline
pip install -r requirements.txt
```

## Configure

```bash
cp .env.example .env
# Edit .env and set AIHUBMIX_API_KEY=your_key
```

## Usage

```bash
# Basic: process a video
python run_pipeline.py --video /path/to/your/video.mp4

# Custom work dir and output
python run_pipeline.py --video video.mp4 --work-dir ./my_work --output timeline.json

# Skip re-compression if compressed.mp4 already exists
python run_pipeline.py --video video.mp4 --skip-compress
```

## Output

- `work/compressed.mp4` — compressed input
- `work/super_chunks/` — super-chunk segments
- `work/timeline_with_summary.json` — events with start/end times, titles, summaries

## Project Structure

```
memorylib-video-pipeline/
├── memorylib_video/
│   ├── config.py       # SUPER_CHUNK_SEC, LLM settings
│   ├── gemini_client.py
│   ├── video_utils.py  # compress, cut_super_chunks, build_summary_clip
│   ├── timeline.py     # build_global_timeline, summarize_timeline_events
│   ├── events.py       # materialize_events (cut clips)
│   └── queries.py      # filter_events, events_in_range
├── run_pipeline.py
├── requirements.txt
├── .env.example
└── README.md
```
