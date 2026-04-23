/**
 * 无 Docker 本地开发：本地磁盘存文件 + SQLite 存 raw_source + 进程内处理视频（无 Redis/Worker）。
 * 在 .env 中设置 MEMORIA_DEV_LITE=true，可忽略 DATABASE_URL / REDIS_URL / MinIO。
 */
export function isMemoriaDevLite(): boolean {
  return process.env.MEMORIA_DEV_LITE === "true";
}
