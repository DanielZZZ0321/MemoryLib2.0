# 个人记忆管理系统 — 集成说明

本仓库在原有 **Vite 前端 + Express 后端** 上，接入了 **FastAPI `memory-core`** 与 **Next.js `web-next`**，覆盖多模态摄取、时间线、双向量库、图谱、挖掘与 LangChain 对话（流式 SSE + WebSocket）。

## 架构总览

| 组件 | 路径 | 职责 |
|------|------|------|
| Vite 主应用 | `frontend/` | Dexie 本地事件、画布、概念图；**同步到 memory-core**；Chatbot 可选 **Memory Core RAG 流式** |
| Express | `backend/` | 认证、视频分析脚本、MemoryLib JSON；**反向代理** `/api/memory-core` → Python |
| memory-core | `memory-core/` | FastAPI：SQLite、Chroma（可选 ST 嵌入）、LanceDB、NetworkX、Whisper/FFmpeg/OpenCV/MCAP 管线、LangChain RAG |
| Next 控制台 | `web-next/` | shadcn/ui、时间线导入、**SSE 流式 Chat**（直连 memory-core 或经网关） |

## 时间线语义

与 `frontend/src/stores/eventStore.ts` 及 `backend/scripts/video_analysis.py` **一致**：`raw_events` / `timeline` → `sec_to_hms`、`event_index` 规则由 `memory-core/app/services/timeline_builder.py` 实现。

## 启动顺序

1. **memory-core**（默认 `8000`）

```bash
cd memory-core
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# 可选：Whisper / Lance / OpenCV / MCAP
# pip install -r requirements-ml.txt
cp .env.example .env   # 填入 AIHUBMIX_API_KEY 或 OPENAI_API_KEY 等
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

2. **Express**（默认 `3000`，代理 memory-core）

```bash
cd backend
# .env 中设置 MEMORY_CORE_URL=http://127.0.0.1:8000
npm run dev
```

3. **Vite**（`5173`，`/api` → Express）

```bash
npm run dev:frontend
```

4. **web-next**（可选，`3001` 等）

```bash
cd web-next && cp .env.local.example .env.local && npm run dev
```

根目录脚本：`npm run dev:memory-core`（需已有 `.venv`）、`npm run dev:web-next`。

## memory-core API 摘要

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 存活 |
| GET | `/api/v1/capabilities` | 探测 whisper / lancedb / sentence_transformers / llm 等 |
| POST | `/api/v1/timeline/import` | JSON 时间线导入 |
| GET | `/api/v1/timeline/events` | 事件列表 |
| GET | `/api/v1/search?q=` | SQL 关键词 + Chroma + Lance 向量 |
| GET | `/api/v1/graph/stats` | 图谱规模 |
| GET | `/api/v1/graph/export` | node-link JSON |
| POST | `/api/v1/mine/patterns` | 标签共现、标题词、片段时长统计 |
| POST | `/api/v1/chat/stream` | **SSE** LangChain + 记忆 RAG |
| WS | `/api/v1/chat/ws` | 同上，分片 `token` |
| POST | `/api/v1/ingest/video` | 上传视频 → FFmpeg 抽音频 → **Whisper** 分段 → 入库 |
| POST | `/api/v1/ingest/mcap` | MCAP 文本预览 → 粗粒度事件 |
| POST | `/api/v1/ingest/sensor` | `{ "readings": [...] }` 传感器批次 |

## 环境变量（memory-core `.env`）

- `AIHUBMIX_API_KEY` / `OPENAI_API_KEY`：LangChain ChatOpenAI 兼容
- `LLM_BASE_URL`：默认 `https://aihubmix.com/v1`
- `LLM_MODEL`、`LLM_APP_CODE` / `AIHUBMIX_APP_CODE`
- `EMBEDDING_MODEL`、`WHISPER_MODEL`、`FFMPEG_BIN`

## 前端集成点

- **Events 列表**：「同步到 Memory Core」→ `POST /api/memory-core/api/v1/timeline/import`
- **Chatbot**：勾选「Memory Core RAG」→ `POST /api/memory-core/api/v1/chat/stream`（SSE 解析）
- **Express**：`MEMORY_CORE_URL` 见 `backend/.env.example`

## 依赖分层

- `memory-core/requirements.txt`：FastAPI、Chroma、**LangChain OpenAI**（轻量）
- `memory-core/requirements-ml.txt`：torch、whisper、sentence-transformers、lancedb、opencv、mcap、transformers

未安装 ML 包时，对应能力在 `/api/v1/capabilities` 中为 `false`，部分接口会返回说明性错误。

## 视觉嵌入（CLIP/SigLIP）

当前对视频提供 **OpenCV 关键帧采样** + 占位事件说明；将 `describe_frames_stub` 替换为真实 SigLIP/CLIP 编码并写入 Lance/Chroma 即可无缝扩展。
