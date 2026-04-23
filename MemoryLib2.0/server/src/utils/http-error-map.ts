import type { Response } from "express";

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function errCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    const c = (err as { code: unknown }).code;
    return typeof c === "string" ? c : undefined;
  }
  return undefined;
}

/** 将常见基础设施错误转为明确 JSON，避免仅返回 internal_error */
export function sendMappedError(res: Response, err: unknown): boolean {
  const msg = errMsg(err);
  const code = errCode(err);

  if (
    code === "ECONNREFUSED" ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("connect ECONNREFUSED")
  ) {
    res.status(503).json({
      error: "upstream_unreachable",
      message: msg,
      hint: "无法连接依赖服务。请在项目根目录执行 docker compose up -d，并确认 Postgres(5432)、Redis(6379)、MinIO(9000) 已就绪。",
    });
    return true;
  }

  if (code === "ENOTFOUND" || msg.includes("ENOTFOUND")) {
    res.status(503).json({
      error: "dns_lookup_failed",
      message: msg,
      hint: "检查 .env 中 DATABASE_URL、STORAGE_ENDPOINT、REDIS_URL 的主机名是否正确。",
    });
    return true;
  }

  if (code === "42P01") {
    res.status(503).json({
      error: "database_schema",
      message: msg,
      hint: "数据库中缺少表。请确认已用 server/db/init.sql 初始化（首次 docker compose up 会自动执行）。",
    });
    return true;
  }

  if (code === "28P01" || code === "3D000") {
    res.status(503).json({
      error: "database_auth",
      message: msg,
    });
    return true;
  }

  return false;
}

export function sendInternalError(res: Response, err: unknown): void {
  if (sendMappedError(res, err)) {
    return;
  }
  const message = errMsg(err);
  const expose =
    process.env.NODE_ENV !== "production" ||
    process.env.EXPOSE_ERROR_DETAILS === "true";
  res.status(500).json({
    error: "internal_error",
    ...(expose ? { message } : {}),
  });
}
