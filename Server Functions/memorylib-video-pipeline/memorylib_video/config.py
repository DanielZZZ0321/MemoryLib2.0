# config.py

SUPER_CHUNK_SEC = 600.0   # 大 chunk 长度（秒）
PRE_MERGE_SEC = 5.0       # 边界前取几秒给 LLM 看
POST_MERGE_SEC = 5.0      # 边界后取几秒给 LLM 看

MAX_WIDTH = 960
MAX_HEIGHT = 540
VIDEO_BITRATE = "1500k"
AUDIO_BITRATE = "96k"

LLM_CONFIG = {
    "timeline": {
        "max_output_tokens": 4096,
        "temperature": 0.2,
        "response_mime_type": "application/json",
        "media_resolution": "low",
    },
    "merge": {
        "max_output_tokens": 2048,
        "temperature": 0.2,
        "response_mime_type": "application/json",
        "media_resolution": "low",
    },
    "summary": {
        "max_output_tokens": 4096,
        "temperature": 0.3,
        "response_mime_type": "application/json",
        "media_resolution": "low",
    },
}
