# Memoria

多模态记忆管理（MVP 基础设施）。

## 结构

- `client/` — Vite + React + TypeScript + Tailwind v4 + shadcn/ui（后台上传页 `/admin`）
- `server/` — Express 5 + TypeScript
- `server/db/init.sql` — PostgreSQL + pgvector 表结构
- `docker-compose.yml` — Postgres（pgvector）、Redis、MinIO

## 本地开发

### 方式 A：无 Docker（Dev Lite）

适合拉不到镜像、只想快速试上传与视频流水线：

1. 复制 `.env.example` 为 `.env`，保持 **`MEMORIA_DEV_LITE=true`**（示例已默认开启）。
2. **不要**依赖 Postgres / Redis / MinIO：数据在仓库下 **`data/`**（`memoria.sqlite` + `storage/`）。
3. 根目录 `npm install`，再 `npm run dev`。Worker 进程在 Dev Lite 下会**立即退出**（视频改在 API 进程里异步跑）。
4. 生产或需要完整图谱/向量检索时，请改用方式 B + `MEMORIA_DEV_LITE=false`。

### 方式 B：Docker 全栈

1. 复制环境变量为 `.env`，设置 **`MEMORIA_DEV_LITE=false`**，并配置 `DATABASE_URL`、`REDIS_URL`、`STORAGE_*`（可参考示例里注释掉的完整块）。
2. `docker compose up -d`
3. 安装依赖：在仓库根目录执行 `npm install`
4. 并行启动前端、API 与视频 Worker：`npm run dev`
   - 前端：<http://localhost:5173>（`/api` 代理到后端）
   - 后台上传：<http://localhost:5173/admin>
   - 后端：<http://localhost:3001>
   - Worker：`npm run worker -w server`（已由 `npm run dev` 一并拉起）

**视频处理**：Worker 会调用本机 **FFmpeg**（需在 PATH 中可用）。未安装时任务会失败并将 `raw_source` 标为 `failed`。

**存储**：非 Dev Lite 时，`POST /api/admin/upload` 会确保 MinIO/S3 bucket 存在；Dev Lite 时文件落在 `data/storage/`。

## Gemini 连通测试

配置好 `GEMINI_API_KEY` 与 `GEMINI_API_BASE_URL` 后：

```http
GET http://localhost:3001/api/health/gemini
```

## 数据库

首次启动 Postgres 容器时会执行 `server/db/init.sql`。若需重建库，删除 Docker volume `memoria_pgdata` 后重新 `docker compose up -d`。
