/**
 * Chat 璺敱 - 閫氳繃 Aihubmix 缃戝叧璋冪敤 OpenAI 鍏煎鎺ュ彛
 * 鏀寔 page context 涓?tool calling锛堟悳绱?澧炲垹鏀逛簨浠躲€侀噸缃竷灞€锛? */
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getMemoryLib, updateMemoryLib } from '../services/memorylibService';

const chatRouter = Router();

/** 鍦ㄨ姹傚唴璇诲彇锛岄伩鍏嶆ā鍧楀姞杞芥棭浜?loadEnv 鏃惰鍒扮┖鍊?*/
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
      description: '鍦ㄥ綋鍓嶈蹇嗗簱涓寜鍏抽敭璇嶆垨鏍囩鎼滅储浜嬩欢銆備緥濡傦細"鎵炬墍鏈夊拰杩愬姩鐩稿叧鐨勪簨浠?銆?鎼滅储甯?People 鏍囩鐨勪簨浠?',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: '鎼滅储鍏抽敭璇嶏紝濡?杩愬姩"銆?sports"銆?People"' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_event',
      description: '鍦ㄨ蹇嗗簱涓柊澧炰竴涓簨浠?,
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '浜嬩欢鏍囬' },
          summary: { type: 'string', description: '浜嬩欢鎽樿/鍐呭' },
          tags: { type: 'array', items: { type: 'string' }, description: '鏍囩鍒楄〃' },
        },
        required: ['title', 'summary'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'edit_event',
      description: '淇敼璁板繂搴撲腑宸插瓨鍦ㄧ殑浜嬩欢',
      parameters: {
        type: 'object',
        properties: {
          event_index: { type: 'number', description: '浜嬩欢绱㈠紩锛屼粠 0 寮€濮? },
          title: { type: 'string', description: '鏂版爣棰橈紙鍙€夛級' },
          summary: { type: 'string', description: '鏂版憳瑕侊紙鍙€夛級' },
          tags: { type: 'array', items: { type: 'string' }, description: '鏂版爣绛撅紙鍙€夛級' },
        },
        required: ['event_index'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_event',
      description: '浠庤蹇嗗簱涓垹闄ゆ寚瀹氫簨浠?,
      parameters: {
        type: 'object',
        properties: { event_index: { type: 'number', description: '瑕佸垹闄ょ殑浜嬩欢绱㈠紩锛屼粠 0 寮€濮? } },
        required: ['event_index'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'reset_layout',
      description: '灏嗘蹇靛浘甯冨眬閲嶇疆涓洪粯璁よ嚜鍔ㄥ竷灞€锛屾竻闄ょ敤鎴锋嫋鍔ㄨ繃鐨勮嚜瀹氫箟浣嶇疆',
      parameters: { type: 'object', properties: {} },
    },
  },
];

function buildSystemMessage(ctx: PageContext | null): string {
  if (!ctx) {
    return '浣犳槸 Memory Assistant锛屽府鍔╃敤鎴风鐞嗚蹇嗗簱銆傜敤鎴峰綋鍓嶅湪璁板繂搴撳垪琛ㄩ〉锛屽彲浠ュ洖绛旈棶棰樸€佹彁渚涗娇鐢ㄥ缓璁€?;
  }
  if (ctx.pageType === 'history') {
    return '浣犳槸 Memory Assistant銆傜敤鎴峰綋鍓嶅湪璁板繂搴撳垪琛ㄩ〉銆備綘鍙互鍥炵瓟闂銆佹彁渚涗娇鐢ㄥ缓璁€?;
  }
  let base = `浣犳槸 Memory Assistant銆傜敤鎴锋鍦ㄦ煡鐪嬭蹇嗗簱銆?{ctx.memoryLibTitle ?? '鏈懡鍚?}銆?ID: ${ctx.memoryLibId})锛屽綋鍓嶄互姒傚康鍥惧睍绀恒€俙;
  if (ctx.events && ctx.events.length > 0) {
    base += '\n\n褰撳墠浜嬩欢鍒楄〃锛歕n';
    ctx.events.forEach((e) => {
      base += `- [${e.index}] ${e.title}锛?{e.summary.slice(0, 80)}${e.summary.length > 80 ? '...' : ''}${e.tags?.length ? ` 鏍囩: ${e.tags.join(', ')}` : ''}\n`;
    });
    base += '\n浣犲彲浠ヨ皟鐢ㄥ伐鍏凤細search_events 鎼滅储銆乤dd_event 鏂板銆乪dit_event 淇敼銆乨elete_event 鍒犻櫎銆乺eset_layout 閲嶇疆甯冨眬銆?;
  } else {
    base += '\n褰撳墠娌℃湁浜嬩欢鏁版嵁銆備綘鍙互鐢?add_event 娣诲姞浜嬩欢銆?;
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
    return { result: '閿欒锛氬綋鍓嶄笉鍦ㄨ蹇嗗簱璇︽儏椤碉紝鏃犳硶鎵ц姝ゆ搷浣溿€傝鍏堣繘鍏ユ煇涓蹇嗗簱鐨勬蹇靛浘銆? };
  }
  const lib = getMemoryLib(memoryLibId);
  if (!lib) return { result: '閿欒锛氳蹇嗗簱涓嶅瓨鍦ㄦ垨鍔犺浇澶辫触銆? };

  switch (name) {
    case 'search_events': {
      const query = String(args.query ?? '').toLowerCase();
      if (!query) return { result: '璇锋彁渚涙悳绱㈠叧閿瘝銆? };
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
        return { result: `鏈壘鍒颁笌銆?{query}銆嶇浉鍏崇殑浜嬩欢銆俙 };
      }
      const text = matched
        .map(
          (e) =>
            `[${e.index}] ${e.title}锛?{e.summary.slice(0, 100)}${e.summary.length > 100 ? '...' : ''}${e.tags?.length ? ` (鏍囩: ${e.tags.join(', ')})` : ''}`
        )
        .join('\n');
      return { result: `鎵惧埌 ${matched.length} 涓浉鍏充簨浠讹細\n${text}` };
    }
    case 'add_event': {
      const title = String(args.title ?? '').trim();
      const summary = String(args.summary ?? '').trim();
      const tags = Array.isArray(args.tags) ? args.tags.map(String) : [];
      if (!title || !summary) return { result: '鏍囬鍜屾憳瑕佷笉鑳戒负绌恒€? };
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
      if (!updated) return { result: '鍐欏叆澶辫触銆? };
      actions.push({ type: 'events_updated', memoryLibId });
      return { result: `宸叉坊鍔犱簨浠躲€?{title}銆嶃€俙, appliedActions: actions };
    }
    case 'edit_event': {
      const idx = Number(args.event_index);
      const events = [...(lib.events ?? [])];
      if (idx < 0 || idx >= events.length) return { result: `浜嬩欢绱㈠紩 ${idx} 鏃犳晥锛屽綋鍓嶅叡 ${events.length} 涓簨浠躲€俙 };
      const ev = events[idx];
      if (typeof args.title === 'string' && args.title.trim()) ev.title = args.title.trim();
      if (typeof args.summary === 'string' && args.summary.trim()) ev.summary = args.summary.trim();
      if (Array.isArray(args.tags)) ev.tags = args.tags.map(String);
      const updated = updateMemoryLib(memoryLibId, { events });
      if (!updated) return { result: '鍐欏叆澶辫触銆? };
      actions.push({ type: 'events_updated', memoryLibId });
      return { result: `宸蹭慨鏀逛簨浠?[${idx}]銆俙, appliedActions: actions };
    }
    case 'delete_event': {
      const idx = Number(args.event_index);
      const events = [...(lib.events ?? [])];
      if (idx < 0 || idx >= events.length) return { result: `浜嬩欢绱㈠紩 ${idx} 鏃犳晥銆俙 };
      events.splice(idx, 1);
      events.forEach((e, i) => (e.event_index = i));
      const updated = updateMemoryLib(memoryLibId, { events });
      if (!updated) return { result: '鍐欏叆澶辫触銆? };
      actions.push({ type: 'events_updated', memoryLibId });
      return { result: `宸插垹闄や簨浠?[${idx}]銆俙, appliedActions: actions };
    }
    case 'reset_layout':
      actions.push({ type: 'layout_reset', memoryLibId });
      return { result: '甯冨眬宸查噸缃紝鍓嶇灏嗘竻闄よ嚜瀹氫箟浣嶇疆銆?, appliedActions: actions };
    default:
      return { result: `鏈煡宸ュ叿: ${name}` };
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
    res.status(503).json({ success: false, error: '鏈厤缃?AIHUBMIX_API_KEY锛岃鍦?.env 涓缃? });
    return;
  }

  const { messages, context, model: bodyModel } = req.body as ChatRequestBody;
  const model = bodyModel || cfg.model;
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ success: false, error: 'messages 涓哄繀濉笖涓嶈兘涓虹┖' });
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
        const errMsg = data?.error?.message || resp.statusText || '璇锋眰澶辫触';
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
    res.json({ success: true, content: '鎿嶄綔宸插畬鎴愩€?, appliedActions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ success: false, error: `AI 鏈嶅姟璇锋眰澶辫触: ${message}` });
  }
});

export default chatRouter;
