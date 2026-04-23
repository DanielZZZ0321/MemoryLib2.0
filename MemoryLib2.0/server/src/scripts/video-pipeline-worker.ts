import "../load-env.js";
import { Worker } from "bullmq";
import { Redis } from "ioredis";
import { isMemoriaDevLite } from "../config/memoria-dev-lite.js";
import { requirePool } from "../db/pool.js";
import { VIDEO_QUEUE_NAME, type VideoJobData } from "../services/queue.js";
import { runVideoPipelineJob } from "../services/video-pipeline-job.js";

if (isMemoriaDevLite()) {
  console.log(
    "[video-worker] MEMORIA_DEV_LITE=true，视频由内联任务处理，本进程退出。",
  );
  process.exit(0);
}

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error("[video-worker] 缺少 REDIS_URL");
  process.exit(1);
}

try {
  requirePool();
} catch {
  console.error("[video-worker] 缺少 DATABASE_URL");
  process.exit(1);
}

const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

const worker = new Worker<VideoJobData>(
  VIDEO_QUEUE_NAME,
  async (job) => {
    await runVideoPipelineJob(job.data);
  },
  { connection },
);

worker.on("completed", (job) => {
  console.log("[video-worker] 完成", job.id, job.data?.rawSourceId);
});

worker.on("failed", (job, err) => {
  console.error("[video-worker] 失败", job?.id, err);
});

console.log("[video-worker] 已启动，队列:", VIDEO_QUEUE_NAME);
