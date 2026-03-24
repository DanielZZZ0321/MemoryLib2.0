from __future__ import annotations

from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class VideoRow(Base):
    __tablename__ = "videos"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    filename: Mapped[str] = mapped_column(String(512))
    duration: Mapped[float] = mapped_column(Float, default=0)
    imported_at: Mapped[str] = mapped_column(String(64))
    event_count: Mapped[int] = mapped_column(Integer, default=0)


class MemoryUnitRow(Base):
    __tablename__ = "memory_units"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    video_id: Mapped[str] = mapped_column(String(64), index=True)
    event_index: Mapped[int] = mapped_column(Integer)
    start_sec: Mapped[float] = mapped_column(Float)
    end_sec: Mapped[float] = mapped_column(Float)
    start_hms: Mapped[str] = mapped_column(String(32))
    end_hms: Mapped[str] = mapped_column(String(32))
    title: Mapped[str] = mapped_column(Text, default="")
    summary: Mapped[str] = mapped_column(Text, default="")
    user_title: Mapped[str | None] = mapped_column(String(512), nullable=True)
    user_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags_json: Mapped[str] = mapped_column(Text, default="[]")
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[str] = mapped_column(String(64))
    updated_at: Mapped[str] = mapped_column(String(64))
