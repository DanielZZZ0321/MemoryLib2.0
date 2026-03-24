from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# memory-core/app/config.py → repo root is parents[2]
_MEMORY_CORE_ROOT = Path(__file__).resolve().parent.parent
_BACKEND_ENV = _MEMORY_CORE_ROOT.parent / "backend" / ".env"
_LOCAL_ENV = _MEMORY_CORE_ROOT / ".env"
# 先读 backend/.env（与 Node 共用 AiHubMix），再读 memory-core/.env（后者覆盖）
_ENV_FILES: tuple[str | Path, ...] = tuple(
    p
    for p in (_BACKEND_ENV, _LOCAL_ENV)
    if p.is_file()
) or (".env",)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ENV_FILES, env_file_encoding="utf-8", extra="ignore")

    data_dir: Path = Path(__file__).resolve().parent.parent / "data"
    uploads_subdir: str = "uploads"
    sqlite_path: str = "memory.db"
    chroma_path: str = "chroma"
    chroma_collection: str = "memory_units_st"
    lance_path: str = "lance"
    lance_table: str = "memory_units"
    graph_path: str = "memory_graph.graphml"
    cors_origins: str = (
        "http://localhost:3000,http://127.0.0.1:3000,"
        "http://localhost:3001,http://127.0.0.1:3001,"
        "http://localhost:5173,http://127.0.0.1:5173"
    )

    # OpenAI-compatible (AiHubMix: base https://aihubmix.com/v1)
    openai_api_key: str | None = None
    aihubmix_api_key: str | None = None
    llm_base_url: str | None = Field(
        default=None,
        validation_alias=AliasChoices("LLM_BASE_URL", "AIHUBMIX_BASE_URL"),
    )
    llm_model: str = "gpt-4o-mini"
    llm_app_code: str | None = Field(
        default=None,
        validation_alias=AliasChoices("LLM_APP_CODE", "AIHUBMIX_APP_CODE"),
    )

    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    whisper_model: str = "base"
    ffmpeg_bin: str = "ffmpeg"

    clip_frame_interval_sec: float = 5.0
    clip_max_frames: int = 24

    @property
    def sqlite_url(self) -> str:
        self.data_dir.mkdir(parents=True, exist_ok=True)
        return f"sqlite+aiosqlite:///{(self.data_dir / self.sqlite_path).as_posix()}"

    @property
    def uploads_dir(self) -> Path:
        p = self.data_dir / self.uploads_subdir
        p.mkdir(parents=True, exist_ok=True)
        return p

    def effective_llm_key(self) -> str | None:
        k = (self.openai_api_key or "").strip()
        if k:
            return k
        k = (self.aihubmix_api_key or "").strip()
        if k and k != "your_AiHubMix_api_key_here":
            return k
        return None

    def effective_llm_base_url(self) -> str:
        raw = (self.llm_base_url or "").strip()
        if raw:
            r = raw.rstrip("/")
            if not r.endswith("/v1"):
                return f"{r}/v1"
            return r
        return "https://aihubmix.com/v1"


settings = Settings()
