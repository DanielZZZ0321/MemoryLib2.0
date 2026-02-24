# memorylib_video/__init__.py

"""
memorylib_video

A toolkit for:
- compressing long egocentric videos,
- building an event timeline with Gemini (via AiHubMix),
- cutting the original video into event clips based on the timeline,
- summarizing each event with LLM.
"""

from .config import (
    SUPER_CHUNK_SEC,
    PRE_MERGE_SEC,
    POST_MERGE_SEC,
    MAX_WIDTH,
    MAX_HEIGHT,
    VIDEO_BITRATE,
    AUDIO_BITRATE,
)

from .gemini_client import build_client

from .video_utils import (
    get_duration,
    compress_video,
    cut_super_chunks,
    cut_clip_temp,
    cut_event_segment,
    build_summary_clip,
)

from .timeline import (
    build_global_timeline,
    generate_chunk_timeline,
    llm_should_merge_boundary,
    summarize_timeline_events,
    save_timeline,
)

from .events import materialize_events

from .queries import filter_events, events_in_range

__all__ = [
    # config
    "SUPER_CHUNK_SEC",
    "PRE_MERGE_SEC",
    "POST_MERGE_SEC",
    "MAX_WIDTH",
    "MAX_HEIGHT",
    "VIDEO_BITRATE",
    "AUDIO_BITRATE",
    # client
    "build_client",
    # video utils
    "get_duration",
    "compress_video",
    "cut_super_chunks",
    "cut_clip_temp",
    "cut_event_segment",
    "build_summary_clip",
    # timeline
    "build_global_timeline",
    "generate_chunk_timeline",
    "llm_should_merge_boundary",
    "summarize_timeline_events",
    "save_timeline",
    # events
    "materialize_events",
    # queries
    "filter_events",
    "events_in_range",
]

__version__ = "0.1.0"
