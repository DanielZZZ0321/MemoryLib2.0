import { readVideoEncodeEnv } from "./ffmpeg-env.js";
import { runFfmpegArgs } from "./spawn-ffmpeg.js";

/**
 * 视频流水线用转码：H.264 + AAC + faststart，高度由 VIDEO_OUTPUT_RESOLUTION 等环境变量控制。
 */
export async function compressVideo(
  inputPath: string,
  outputPath: string,
): Promise<void> {
  const { height, crf, preset } = readVideoEncodeEnv();
  const args = [
    "-hide_banner",
    "-loglevel",
    "warning",
    "-nostdin",
    "-i",
    inputPath,
    "-c:v",
    "libx264",
    "-crf",
    crf,
    "-preset",
    preset,
    "-vf",
    `scale=-2:${height}`,
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    "-y",
    outputPath,
  ];
  await runFfmpegArgs(args);
}
