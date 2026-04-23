import { spawn } from "node:child_process";
import { getFfprobeExecutable } from "./ffmpeg-env.js";

export async function ffprobeVideoDurationSeconds(
  videoPath: string,
): Promise<number> {
  const bin = getFfprobeExecutable();
  return new Promise((resolve, reject) => {
    const child = spawn(
      bin,
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        videoPath,
      ],
      { windowsHide: true },
    );
    let out = "";
    child.stdout?.on("data", (d: Buffer) => {
      out += d.toString();
    });
    child.stderr?.on("data", () => {});
    child.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "ENOENT") {
        reject(
          new Error(
            `找不到 ffprobe。请安装 ffmpeg（含 ffprobe）或设置 FFPROBE_PATH。`,
          ),
        );
        return;
      }
      reject(err);
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe 退出码 ${code}`));
        return;
      }
      const sec = Number.parseFloat(out.trim());
      if (!Number.isFinite(sec) || sec <= 0) {
        reject(new Error(`无法解析视频时长: ${out.trim()}`));
        return;
      }
      resolve(sec);
    });
  });
}
