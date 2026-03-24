import { createProxyMiddleware } from 'http-proxy-middleware';

const target = process.env.MEMORY_CORE_URL || 'http://127.0.0.1:8000';

/** 将 /api/memory-core/* 转发到 FastAPI memory-core（含 WebSocket upgrade） */
export const memoryCoreProxy = createProxyMiddleware({
  target,
  changeOrigin: true,
  pathRewrite: { '^/api/memory-core': '' },
  ws: true,
});
