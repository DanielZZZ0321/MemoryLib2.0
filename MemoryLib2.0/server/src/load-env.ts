import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

/** 从 monorepo 根目录或 server 目录加载 .env（npm workspace 下 cwd 可能是 server/） */
const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(serverDir, "..");
for (const envPath of [path.join(repoRoot, ".env"), path.join(serverDir, ".env")]) {
  if (existsSync(envPath)) {
    /** 覆盖机器/IDE 里残留的旧变量，避免 GEMINI_* 占位符抢在 AIHUBMIX_* 之前生效 */
    config({ path: envPath, override: true });
    break;
  }
}
