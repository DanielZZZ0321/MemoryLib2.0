import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { isMemoriaDevLite } from "../config/memoria-dev-lite.js";
import type { VideoJobData } from "../types/video-job.js";
import { runVideoPipelineJob } from "./video-pipeline-job.js";

export const VIDEO_QUEUE_NAME = "video-processing";

export type { VideoJobData };

let connection: Redis | null = null;
let videoQueue: Queue<VideoJobData> | null = null;

function getConnection(): Redis {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL 未配置");
  }
  if (!connection) {
    connection = new Redis(url, { maxRetriesPerRequest: null });
  }
  return connection;
}

export function getVideoQueue(): Queue<VideoJobData> {
  if (!videoQueue) {
    videoQueue = new Queue<VideoJobData>(VIDEO_QUEUE_NAME, {
      connection: getConnection(),
    });
  }
  return videoQueue;
}

export function isRedisConfigured(): boolean {
  return Boolean(process.env.REDIS_URL);
}

export async function enqueueVideoProcessing(data: VideoJobData): Promise<void> {
  if (isMemoriaDevLite()) {
    void runVideoPipelineJob(data).catch((err) =>
      console.error("[memoria-dev-lite] 内联视频任务失败", err),
    );
    return;
  }
  const q = getVideoQueue();
  await q.add("process", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  });
}

export type VideoQueueCounts =
  | {
      inline: true;
      note: string;
      waiting: 0;
      active: 0;
      completed: 0;
      failed: 0;
      delayed: 0;
      paused: 0;
    }
  | Record<string, number>;

export async function getVideoQueueCounts(): Promise<VideoQueueCounts> {
  if (isMemoriaDevLite()) {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      paused: 0,
      inline: true,
      note: "MEMORIA_DEV_LITE：视频在 API 进程内异步处理，无 BullMQ 计数",
    };
  }
  const q = getVideoQueue();
  const c = await q.getJobCounts(
    "waiting",
    "active",
    "completed",
    "failed",
    "delayed",
    "paused",
  );
  return c;
}
