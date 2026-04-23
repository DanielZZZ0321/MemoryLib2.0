import { runFfmpegArgs } from "./spawn-ffmpeg.js";

/** 在 timestampSec 处截取一帧 JPEG（宽度最大约 512，控制 VLM token） */
export async function extractJpegFrameAt(
  videoPath: string,
  timestampSec: number,
  outJpegPath: string,
): Promise<void> {
  const t = Math.max(0, timestampSec);
  const args = [
    "-hide_banner",
    "-loglevel",
    "error",
    "-nostdin",
    "-ss",
    String(t),
    "-i",
    videoPath,
    "-vframes",
    "1",
    "-vf",
    "scale=min(iw\\,512):-2",
    "-q:v",
    "3",
    "-y",
    outJpegPath,
  ];
  await runFfmpegArgs(args);
}
