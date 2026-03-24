/**
 * Chat 路由 - 通过 Aihubmix 网关调用 OpenAI 兼容接口
 * 支持 page context 与 tool calling（搜索/增删改事件、重置布局）
 */
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getMemoryLib, updateMemoryLib } from '../services/memorylibService';

const chatRouter = Router();

/** 在请求内读取，避免模块加载早于 loadEnv 时读到空值 */
function aiHubMixConfig() {
  const key = process.env.AIHUBMIX_API_KEY?.trim();
  const base = (process.env.AIHUBMIX_BASE_URL || 'https://aihubmix.com').replace(/\/$/, '');
  return {
    key,
    baseUrl: base,
    appCode: process.env.AIHUBMIX_APP_CODE || '',
    model: process.env.AIHUBMIX_CHAT_MODEL || 'gpt-4o-mini',
  };
}

interface PageContext {
  pageType: 'history' | 'conceptGraph';
  memoryLibId?: string;
  memoryLibTitle?: string;
  events?: Array<{ index: number; title: string; summary: string; tags?: string[] }>;
  nodeIds?: string[];
  nodePositions?: Record<string, { x: number; y: number }>;
}

interface ChatRequestBody {
  messages: Array<{ role: string; content: string }>;
  context?: PageContext | null;
  model?: string;
}

const MEMORY_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'search_events',
      description: '在当前记忆库中按关键词或标签搜索事件。例如："找所有和运动相关的事件"、"搜索带 People 标签的事件"',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: '搜索关键词，如"运动"、"sports"、"People"' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_event',
      description: '在记忆库中新增一个事件',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '事件标题' },
          summary: { type: 'string', description: '事件摘要/内容' },
          tags: { type: 'array', items: { type: 'string' }, description: '标签列表' },
        },
        required: ['title', 'summary'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'edit_event',
      description: '修改记忆库中已存在的事件',
      parameters: {
        type: 'object',
        properties: {
          event_index: { type: 'number', description: '事件索引，从 0 开始' },
          title: { type: 'string', description: '新标题（可选）' },
          summary: { type: 'string', description: '新摘要（可选）' },
          tags: { type: 'array', items: { type: 'string' }, description: '新标签（可选）' },
        },
        required: ['event_index'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_event',
      description: '从记忆库中删除指定事件',
      parameters: {
        type: 'object',
        properties: { event_index: { type: 'number', description: '要删除的事件索引，从 0 开始' } },
        required: ['event_index'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'reset_layout',
      description: '将概念图布局重置为默认自动布局，清除用户拖动过的自定义位置',
      parameters: { type: 'object', properties: {} },
    },
  },
];

function buildSystemMessage(ctx: PageContext | null): string {
  if (!ctx) {
    return '你是 Memory Assistant，帮助用户管理记忆库。用户当前在记忆库列表页，可以回答问题、提供使用建议。';
  }
  if (ctx.pageType === 'history') {
    return '你是 Memory Assistant。用户当前在记忆库列表页。你可以回答问题、提供使用建议。';
  }
  let base = `你是 Memory Assistant。用户正在查看记忆库「${ctx.memoryLibTitle ?? '未命名'}」(ID: ${ctx.memoryLibId})，当前以概念图展示。`;
  if (ctx.events && ctx.events.length > 0) {
    base += '\n\n当前事件列表：\n';
    ctx.events.forEach((e) => {
      base += `- [${e.index}] ${e.title}：${e.summary.slice(0, 80)}${e.summary.length > 80 ? '...' : ''}${e.tags?.length ? ` 标签: ${e.tags.join(', ')}` : ''}\n`;
    });
    base += '\n你可以调用工具：search_events 搜索、add_event 新增、edit_event 修改、delete_event 删除、reset_layout 重置布局。';
  } else {
    base += '\n当前没有事件数据。你可以用 add_event 添加事件。';
  }
  return base;
}

function executeTool(
  name: string,
  args: Record<string, unknown>,
  memoryLibId: string | undefined
): { result: string; appliedActions?: Array<{ type: string; memoryLibId?: string }> } {
  const actions: Array<{ type: string; memoryLibId?: string }> = [];
  if (!memoryLibId) {
    return { result: '错误：当前不在记忆库详情页，无法执行此操作。请先进入某个记忆库的概念图。' };
  }
  const lib = getMemoryLib(memoryLibId);
  if (!lib) return { result: '错误：记忆库不存在或加载失败。' };

  switch (name) {
    case 'search_events': {
      const query = String(args.query ?? '').toLowerCase();
      if (!query) return { result: '请提供搜索关键词。' };
      const events = lib.events ?? [];
      const matched = events
        .map((e, i) => ({ ...e, index: i }))
        .filter(
          (e) =>
            e.title.toLowerCase().includes(query) ||
            e.summary.toLowerCase().includes(query) ||
            (e.tags ?? []).some((t) => t.toLowerCase().includes(query))
        );
      if (matched.length === 0) {
        return { result: `未找到与「${query}」相关的事件。` };
      }
      const text = matched
        .map(
          (e) =>
            `[${e.index}] ${e.title}：${e.summary.slice(0, 100)}${e.summary.length > 100 ? '...' : ''}${e.tags?.length ? ` (标签: ${e.tags.join(', ')})` : ''}`
        )
        .join('\n');
      return { result: `找到 ${matched.length} 个相关事件：\n${text}` };
    }
    case 'add_event': {
      const title = String(args.title ?? '').trim();
      const summary = String(args.summary ?? '').trim();
      const tags = Array.isArray(args.tags) ? args.tags.map(String) : [];
      if (!title || !summary) return { result: '标题和摘要不能为空。' };
      const events = [...(lib.events ?? [])];
      const newEvent = {
        event_index: events.length,
        start_sec: 0,
        end_sec: 0,
        start_hms: '00:00',
        end_hms: '00:00',
        title,
        summary,
        tags,
      };
      events.push(newEvent);
      const updated = updateMemoryLib(memoryLibId, { events });
      if (!updated) return { result: '写入失败。' };
      actions.push({ type: 'events_updated', memoryLibId });
      return { result: `已添加事件「${title}」。`, appliedActions: actions };
    }
    case 'edit_event': {
      const idx = Number(args.event_index);
      const events = [...(lib.events ?? [])];
      if (idx < 0 || idx >= events.length) return { result: `事件索引 ${idx} 无效，当前共 ${events.length} 个事件。` };
      const ev = events[idx];
      if (typeof args.title === 'string' && args.title.trim()) ev.title = args.title.trim();
      if (typeof args.summary === 'string' && args.summary.trim()) ev.summary = args.summary.trim();
      if (Array.isArray(args.tags)) ev.tags = args.tags.map(String);
      const updated = updateMemoryLib(memoryLibId, { events });
      if (!updated) return { result: '写入失败。' };
      actions.push({ type: 'events_updated', memoryLibId });
      return { result: `已修改事件 [${idx}]。`, appliedActions: actions };
    }
    case 'delete_event': {
      const idx = Number(args.event_index);
      const events = [...(lib.events ?? [])];
      if (idx < 0 || idx >= events.length) return { result: `事件索引 ${idx} 无效。` };
      events.splice(idx, 1);
      events.forEach((e, i) => (e.event_index = i));
      const updated = updateMemoryLib(memoryLibId, { events });
      if (!updated) return { result: '写入失败。' };
      actions.push({ type: 'events_updated', memoryLibId });
      return { result: `已删除事件 [${idx}]。`, appliedActions: actions };
    }
    case 'reset_layout':
      actions.push({ type: 'layout_reset', memoryLibId });
      return { result: '布局已重置，前端将清除自定义位置。', appliedActions: actions };
    default:
      return { result: `未知工具: ${name}` };
  }
}

function fixToolChoice(body: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...body };
  const tools = copy.tools as unknown[] | undefined;
  if (Array.isArray(tools) && tools.length === 0 && 'tool_choice' in copy) delete copy.tool_choice;
  return copy;
}

chatRouter.post('/completions', authMiddleware, async (req: Request, res: Response) => {
  const cfg = aiHubMixConfig();
  if (!cfg.key || cfg.key === 'your_AiHubMix_api_key_here') {
    res.status(503).json({ success: false, error: '未配置 AIHUBMIX_API_KEY，请在 .env 中设置' });
    return;
  }

  const { messages, context, model: bodyModel } = req.body as ChatRequestBody;
  const model = bodyModel || cfg.model;
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ success: false, error: 'messages 为必填且不能为空' });
    return;
  }

  const url = `${cfg.baseUrl}/v1/chat/completions`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${cfg.key}`,
  };
  if (cfg.appCode) headers['APP-Code'] = cfg.appCode;

  const hasContext = context?.pageType === 'conceptGraph' && context.memoryLibId;
  const tools = hasContext ? MEMORY_TOOLS : [];
  const systemContent = buildSystemMessage(context ?? null);

  type Msg = { role: string; content?: string | null; tool_call_id?: string; tool_calls?: unknown[] };
  const apiMessages: Msg[] = [{ role: 'system', content: systemContent }, ...messages.map((m) => ({ role: m.role, content: m.content }))];

  let appliedActions: Array<{ type: string; memoryLibId?: string }> = [];
  const maxToolRounds = 5;
  let round = 0;

  try {
    while (round < maxToolRounds) {
      round++;
      const body: Record<string, unknown> = {
        model,
        messages: apiMessages.map((m) => {
          const out: Record<string, unknown> = { role: m.role };
          if (m.content != null) out.content = m.content;
          if (m.tool_calls) out.tool_calls = m.tool_calls;
          if (m.tool_call_id) out.tool_call_id = m.tool_call_id;
          return out;
        }),
      };
      if (tools.length > 0) {
        body.tools = tools;
        body.tool_choice = 'auto';
      }
      const requestBody = fixToolChoice(body);

      const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(requestBody) });
      const data = (await resp.json()) as {
        choices?: Array<{
          message?: {
            content?: string | null;
            role?: string;
            tool_calls?: Array<{ id: string; type: string; function?: { name: string; arguments: string } }>;
          };
          finish_reason?: string;
        }>;
        error?: { message?: string };
      };

      if (!resp.ok) {
        const errMsg = data?.error?.message || resp.statusText || '请求失败';
        res.status(resp.status >= 500 ? 502 : resp.status).json({ success: false, error: errMsg });
        return;
      }

      const msg = data.choices?.[0]?.message;
      const finishReason = (data.choices?.[0] as { finish_reason?: string })?.finish_reason;

      if (finishReason === 'tool_calls' && msg?.tool_calls && msg.tool_calls.length > 0) {
        apiMessages.push({
          role: 'assistant',
          content: msg.content ?? null,
          tool_calls: msg.tool_calls,
        });
        for (const tc of msg.tool_calls) {
          const name = tc.function?.name ?? '';
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(tc.function?.arguments ?? '{}');
          } catch {
            /* ignore */
          }
          const { result, appliedActions: a } = executeTool(name, args, context?.memoryLibId);
          if (a) appliedActions.push(...a);
          apiMessages.push({ role: 'tool', tool_call_id: tc.id, content: result });
        }
        continue;
      }

      const content = msg?.content ?? '';
      res.json({ success: true, content, appliedActions: appliedActions.length > 0 ? appliedActions : undefined });
      return;
    }
    res.json({ success: true, content: '操作已完成。', appliedActions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ success: false, error: `AI 服务请求失败: ${message}` });
  }
});

export default chatRouter;
