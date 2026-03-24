from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.session import init_db
from app.routers import (
    capabilities_router,
    chat_router,
    graph_router,
    ingest_router,
    mine_router,
    search_router,
    timeline_router,
)

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    log.info("SQLite schema ready at %s", settings.data_dir / settings.sqlite_path)
    yield


app = FastAPI(title="Personal Memory Core", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(capabilities_router.router)
app.include_router(timeline_router.router)
app.include_router(search_router.router)
app.include_router(graph_router.router)
app.include_router(mine_router.router)
app.include_router(chat_router.router)
app.include_router(ingest_router.router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "memory-core"}
