import { spawn } from "node:child_process";
import { ffmpegInstallHint, getFfmpegExecutable } from "./ffmpeg-env.js";

/**
 * 子进程执行 ffmpeg，不经过 fluent-ffmpeg。
 * @param args ffmpeg 参数（不含 argv[0]）
 */
export async function runFfmpegArgs(args: string[]): Promise<void> {
  const bin = getFfmpegExecutable();
  await new Promise<void>((resolve, reject) => {
    const child = spawn(bin, args, {
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stderr = "";
    let stdout = "";
    child.stderr?.on("data", (d: Buffer) => {
      stderr += d.toString();
    });
    child.stdout?.on("data", (d: Buffer) => {
      stdout += d.toString();
    });
    child.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT") {
        reject(
          new Error(`找不到 ffmpeg 可执行文件「${bin}」。${ffmpegInstallHint()}`),
        );
        return;
      }
      reject(err);
    });
    child.on("close", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      const tail =
        stderr.trim().slice(-1500) || stdout.trim().slice(-1500) || "(无输出)";
      reject(
        new Error(
          `ffmpeg 异常退出 (code=${code ?? "null"} signal=${signal ?? "null"})\n${tail}\n${ffmpegInstallHint()}`,
        ),
      );
    });
  });
}
