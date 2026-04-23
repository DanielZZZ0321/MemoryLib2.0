/**
 * 统一 LLM / 文本对话：OpenAI 兼容 POST {base}/chat/completions
 * 推荐 [AIHubMix](https://docs.aihubmix.com/cn)：`AIHUBMIX_API_KEY` + `AIHUBMIX_BASE_URL`
 * 后续多模态（VLM）可沿用同一 Base URL，仅在 messages 中使用 vision content 结构。
 */

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GenerateTextOptions = {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
};

export type LlmProviderKind = "aihubmix" | "openai" | "legacy_gemini_compat";

export type ResolvedLlmConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: LlmProviderKind;
};

function trimEnv(s: string | undefined): string {
  return (s ?? "").trim();
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * 解析顺序（与文档一致，单一出口调用所有 chat/completions）：
 * 1. AIHUBMIX_API_KEY +（AIHUBMIX_BASE_URL，缺省为 https://aihubmix.com/v1）
 * 2. OPENAI_API_KEY +（OPENAI_BASE_URL，缺省为 https://api.openai.com/v1）
 * 3. 兼容旧名：GEMINI_API_KEY + GEMINI_API_BASE_URL（须同时存在）
 */
export function resolveLlmConfig(): ResolvedLlmConfig {
  const model =
    trimEnv(process.env.AIHUBMIX_MODEL) ||
    trimEnv(process.env.OPENAI_MODEL) ||
    trimEnv(process.env.GEMINI_MODEL) ||
    "gemini-2.5-flash";

  const aihubKey = trimEnv(process.env.AIHUBMIX_API_KEY);
  const aihubBaseRaw = trimEnv(process.env.AIHUBMIX_BASE_URL);
  if (aihubKey) {
    const baseUrl = stripTrailingSlash(
      aihubBaseRaw || "https://aihubmix.com/v1",
    );
    return {
      apiKey: aihubKey,
      baseUrl,
      model,
      provider: "aihubmix",
    };
  }

  const openaiKey = trimEnv(process.env.OPENAI_API_KEY);
  if (openaiKey) {
    const openaiBaseRaw = trimEnv(process.env.OPENAI_BASE_URL);
    const baseUrl = stripTrailingSlash(
      openaiBaseRaw || "https://api.openai.com/v1",
    );
    return {
      apiKey: openaiKey,
      baseUrl,
      model,
      provider: "openai",
    };
  }

  const legacyKey = trimEnv(process.env.GEMINI_API_KEY);
  const legacyBase = stripTrailingSlash(
    trimEnv(process.env.GEMINI_API_BASE_URL),
  );
  if (legacyKey && legacyBase) {
    return {
      apiKey: legacyKey,
      baseUrl: legacyBase,
      model,
      provider: "legacy_gemini_compat",
    };
  }

  return {
    apiKey: "",
    baseUrl: "",
    model,
    provider: "legacy_gemini_compat",
  };
}

function getConfig(): ResolvedLlmConfig {
  return resolveLlmConfig();
}

/** 是否已配置可发起 chat/completions（沿用旧函数名以免全仓改名） */
export function isGeminiConfigured(): boolean {
  const { apiKey, baseUrl } = getConfig();
  return Boolean(apiKey && baseUrl);
}

export function llmConfigHint(): string {
  return (
    "请配置其一：AIHUBMIX_API_KEY（及可选 AIHUBMIX_BASE_URL）；或 OPENAI_API_KEY（及可选 OPENAI_BASE_URL）；或 GEMINI_API_KEY + GEMINI_API_BASE_URL"
  );
}

/** OpenAI 兼容多模态：user.content 可为 text + image_url 数组 */
export type VisionContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

function normalizeAssistantContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((p) => {
        if (p && typeof p === "object" && "text" in p) {
          return String((p as { text?: string }).text ?? "");
        }
        return "";
      })
      .join("");
  }
  return "";
}

export async function generateText(options: GenerateTextOptions): Promise<string> {
  const { apiKey, baseUrl, model } = getConfig();
  if (!apiKey || !baseUrl) {
    throw new Error(llmConfigHint());
  }

  const url = `${baseUrl}/chat/completions`;
  const body = {
    model,
    messages: options.messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 512,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`LLM 请求失败 ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const raw = data.choices?.[0]?.message?.content;
  const text = normalizeAssistantContent(raw).trim();
  if (!text) {
    throw new Error("响应中缺少有效的 choices[0].message.content");
  }
  return text;
}

export type GenerateVisionOptions = {
  system?: string;
  userParts: VisionContentPart[];
  temperature?: number;
  maxTokens?: number;
  /** 覆盖默认 chat 模型，例如 gemini-2.5-flash */
  model?: string;
};

/** 多模态 chat/completions（AIHubMix / OpenAI 兼容网关） */
export async function generateVisionText(
  options: GenerateVisionOptions,
): Promise<string> {
  const { apiKey, baseUrl, model: defaultModel } = getConfig();
  if (!apiKey || !baseUrl) {
    throw new Error(llmConfigHint());
  }
  const model =
    trimEnv(options.model) ||
    trimEnv(process.env.VIDEO_TIMELINE_VLM_MODEL) ||
    defaultModel;

  const messages: Array<{
    role: string;
    content: string | VisionContentPart[];
  }> = [];
  if (options.system?.trim()) {
    messages.push({ role: "system", content: options.system.trim() });
  }
  messages.push({ role: "user", content: options.userParts });

  const url = `${baseUrl}/chat/completions`;
  const body = {
    model,
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens ?? 4096,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`VLM 请求失败 ${res.status}: ${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const text = normalizeAssistantContent(
    data.choices?.[0]?.message?.content,
  ).trim();
  if (!text) {
    throw new Error("VLM 响应中缺少有效 content");
  }
  return text;
}

/** 连通性探测：单轮用户消息 */
export async function pingGemini(): Promise<string> {
  return generateText({
    messages: [
      {
        role: "user",
        content: '请仅回复 JSON：{"ok":true,"echo":"memoria-ping"}',
      },
    ],
    maxTokens: 128,
  });
}

/** OpenAI 兼容 SSE：逐段产出 delta content */
export async function* streamText(
  options: GenerateTextOptions,
): AsyncGenerator<string> {
  const { apiKey, baseUrl, model } = getConfig();
  if (!apiKey || !baseUrl) {
    throw new Error(llmConfigHint());
  }

  const url = `${baseUrl}/chat/completions`;
  const body = {
    model,
    messages: options.messages,
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens ?? 512,
    stream: true,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`LLM 流式请求失败 ${res.status}: ${errText.slice(0, 500)}`);
  }
  if (!res.body) {
    throw new Error("响应无 body");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) {
          continue;
        }
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") {
          continue;
        }
        try {
          const j = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const chunk = j.choices?.[0]?.delta?.content;
          if (typeof chunk === "string" && chunk.length > 0) {
            yield chunk;
          }
        } catch {
          /* 忽略非 JSON 行 */
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
