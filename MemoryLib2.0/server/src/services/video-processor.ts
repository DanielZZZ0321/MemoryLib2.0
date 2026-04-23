import { unlink } from "node:fs/promises";
import { compressVideo } from "./ffmpeg/transcode-pipeline-video.js";
import { generateText, isGeminiConfigured } from "./gemini-client.js";

export { compressVideo };

/**
 * VLM 时间线失败或未配置时的降级：短文本占位，保证仍生成单条事件摘要链路。
 */
export async function generateVideoTimelineSkeleton(
  _compressedVideoPath: string,
): Promise<string> {
  if (!isGeminiConfigured()) {
    return "视频已处理；未配置 LLM，未生成文本时间线摘要。";
  }
  try {
    return await generateText({
      messages: [
        {
          role: "user",
          content:
            "用户上传了一段视频，但系统未能从画面生成结构化时间线。请用一两句中文概括「可能的内容类型或场景」，不要编造具体人物名。",
        },
      ],
      maxTokens: 256,
      temperature: 0.2,
    });
  } catch (e) {
    console.warn(
      "[video] 降级摘要调用失败（视频仍会完成处理）",
      e instanceof Error ? e.message : e,
    );
    return "视频已处理；时间线摘要暂不可用。";
  }
}

export async function safeUnlink(p: string): Promise<void> {
  try {
    await unlink(p);
  } catch {
    /* ignore */
  }
}
