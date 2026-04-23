/**
 * 所有依赖本机 ffmpeg 二进制的能力入口，便于审计与替换实现。
 */
export { getFfmpegExecutable, getFfprobeExecutable, readVideoEncodeEnv } from "./ffmpeg-env.js";
export { runFfmpegArgs } from "./spawn-ffmpeg.js";
export { compressVideo } from "./transcode-pipeline-video.js";
