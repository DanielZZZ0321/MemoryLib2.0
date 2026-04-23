/** 解析 ffmpeg 可执行路径与视频转码相关环境变量（集中管理，避免散落多处） */

export function getFfmpegExecutable(): string {
  const p = process.env.FFMPEG_PATH?.trim();
  return p && p.length > 0 ? p : "ffmpeg";
}

/** 预留：元数据探测、时长等；当前流水线未调用 ffprobe */
export function getFfprobeExecutable(): string {
  const p = process.env.FFPROBE_PATH?.trim();
  return p && p.length > 0 ? p : "ffprobe";
}

export function ffmpegInstallHint(): string {
  return (
    "请安装 ffmpeg 并加入系统 PATH，或设置 FFMPEG_PATH 指向可执行文件（Windows 为 ffmpeg.exe）。"
  );
}

export type VideoEncodeEnv = {
  height: number;
  crf: string;
  preset: string;
};

export function readVideoEncodeEnv(): VideoEncodeEnv {
  const r = (process.env.VIDEO_OUTPUT_RESOLUTION ?? "720p").toLowerCase();
  const height = r === "480p" ? 480 : 720;
  return {
    height,
    crf: process.env.VIDEO_CRF ?? "23",
    preset: process.env.VIDEO_COMPRESSION_PRESET ?? "fast",
  };
}
