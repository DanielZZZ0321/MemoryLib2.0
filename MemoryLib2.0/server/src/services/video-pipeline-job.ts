import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { dispatchVideoAfterProcessing } from "../mvp/event-factory.js";
import { mergeIntoRawSourceMetadata } from "../mvp/raw-source-mvp.js";
import { updateRawSourceStatus } from "../models/raw-source.js";
import type { VideoJobData } from "../types/video-job.js";
import { downloadObjectToFile } from "./storage.js";
import { analyzeVideoTimelineWithVlm } from "./video-timeline-vlm.js";
import {
  compressVideo,
  generateVideoTimelineSkeleton,
} from "./video-processor.js";

/** 为 true 时跳过 ffmpeg 转码，直接用原片做时间线占位（开发机无 ffmpeg 时可设） */
function skipVideoTranscode(): boolean {
  const v =
    process.env.VIDEO_SKIP_TRANSCODE ?? process.env.MEMORIA_VIDEO_SKIP_TRANSCODE;
  return v === "true" || v === "1" || v === "yes";
}

/** BullMQ Worker 与内联模式共用的单条任务逻辑 */
export async function runVideoPipelineJob(data: VideoJobData): Promise<void> {
  const { rawSourceId, objectKey } = data;
  await updateRawSourceStatus(rawSourceId, "processing");

  const dir = await mkdtemp(path.join(os.tmpdir(), "memoria-vp-"));
  const srcPath = path.join(dir, "input");
  const outPath = path.join(dir, "compressed.mp4");

  try {
    await downloadObjectToFile(objectKey, srcPath);
    const noTranscode = skipVideoTranscode();
    const pathForTimeline = noTranscode ? srcPath : outPath;
    if (!noTranscode) {
      await compressVideo(srcPath, outPath);
    }
    let segments = await analyzeVideoTimelineWithVlm(pathForTimeline);
    let timelineText: string;
    if (segments.length === 0) {
      timelineText = await generateVideoTimelineSkeleton(pathForTimeline);
      await dispatchVideoAfterProcessing(
        rawSourceId,
        objectKey,
        timelineText,
        undefined,
      );
    } else {
      timelineText = segments
        .map((s) => `**${s.title}**（${s.startSec.toFixed(1)}–${s.endSec.toFixed(1)}s）\n${s.summary}`)
        .join("\n\n");
      await dispatchVideoAfterProcessing(
        rawSourceId,
        objectKey,
        timelineText,
        segments,
      );
    }
    try {
      await mergeIntoRawSourceMetadata(rawSourceId, {
        aiTimelineMarkdown: timelineText,
        aiTimelineSegments: segments,
        aiTimelineAnalyzedAt: new Date().toISOString(),
      });
    } catch (metaErr) {
      console.warn(
        "[video-pipeline] raw metadata 合并失败",
        metaErr instanceof Error ? metaErr.message : metaErr,
      );
    }
    await updateRawSourceStatus(rawSourceId, "completed");
  } catch (e) {
    console.error("[video-pipeline]", rawSourceId, e);
    await updateRawSourceStatus(rawSourceId, "failed");
    throw e;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
