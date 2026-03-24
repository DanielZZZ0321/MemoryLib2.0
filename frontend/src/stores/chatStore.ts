import { create } from 'zustand';
import type { ChatMessage, ChatSession, EventExtended } from '../types/event';
import { usePageContextStore, type PageContext } from './pageContextStore';
import { getToken } from '../auth';

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  isTyping: boolean;

  createSession: (projectId?: string) => ChatSession;
  setCurrentSession: (id: string | null) => void;
  addMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<void>;
  patchLastAssistantMessage: (sessionId: string, content: string) => void;
  deleteSession: (id: string) => void;
  clearCurrentSession: () => void;
  loadSessions: () => Promise<void>;

  sendMessage: (
    content: string,
    attachedEventIds?: string[],
    events?: EventExtended[],
    context?: PageContext | null
  ) => Promise<void>;
}

/** 防止上游 LLM 长时间无响应导致界面一直「思考中」 */
const CHAT_REQUEST_TIMEOUT_MS = 120_000;

function withTimeoutSignal(ms: number): { signal: AbortSignal; cancel: () => void } {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  return {
    signal: c.signal,
    cancel: () => clearTimeout(t),
  };
}

async function fetchAIResponse(
  messages: Array<{ role: string; content: string }>,
  context?: PageContext | null
): Promise<{ content: string; appliedActions?: Array<{ type: string; memoryLibId?: string }> }> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const { signal, cancel } = withTimeoutSignal(CHAT_REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch('/api/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages, context }),
      signal,
    });
  } catch (e) {
    cancel();
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(
        '请求超时。默认对话依赖外部模型，可能较慢；也可勾选「Memory Core RAG」直连本地记忆服务。'
      );
    }
    throw e;
  }
  cancel();

  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    content?: string;
    appliedActions?: Array<{ type: string; memoryLibId?: string }>;
    error?: string;
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!res.ok) {
    const raw = data.error || `请求失败 (${res.status})`;
    const err =
      res.status === 401
        ? `${raw || '未登录'}。默认 AI 对话需要登录；若暂无法登录，请勾选侧栏「Memory Core RAG」试用记忆库对话（不经过 /api/chat）。`
        : raw;
    throw new Error(err);
  }

  const content = data.content ?? data.choices?.[0]?.message?.content;
  return {
    content: typeof content === 'string' ? content : '抱歉，无法生成回复，请重试。',
    appliedActions: data.appliedActions,
  };
}

function isMemoryCoreRagEnabled(): boolean {
  try {
    return localStorage.getItem('memoryCoreRag') === '1';
  } catch {
    return false;
  }
}

async function fetchMemoryCoreStream(
  messages: Array<{ role: string; content: string }>,
  onToken: (t: string) => void
): Promise<void> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const { signal, cancel } = withTimeoutSignal(CHAT_REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch('/api/memory-core/api/v1/chat/stream', {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages }),
      signal,
    });
  } catch (e) {
    cancel();
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Memory Core 流式请求超时，请确认本机已启动 memory-core（端口 8000）且 Express 代理正常。');
    }
    throw e;
  }
  cancel();
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `memory-core ${res.status}`);
  }
  const reader = res.body?.getReader();
  if (!reader) throw new Error('无响应体');
  const dec = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += dec.decode(value, { stream: true });
    let sep: number;
    while ((sep = buffer.indexOf('\n\n')) >= 0) {
      const block = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      for (const line of block.split('\n')) {
        if (!line.startsWith('data:')) continue;
        const payload = line.replace(/^data:\s*/, '').trim();
        if (payload === '[DONE]') continue;
        try {
          const j = JSON.parse(payload) as { token?: string };
          if (j.token) onToken(j.token);
        } catch {
          /* ignore partial json */
        }
      }
    }
  }
}

class ChatDB {
  private db: IDBDatabase | null = null;
  private readonly name = 'MemoryLibChat';
  private readonly store = 'sessions';

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.name, 1);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => { this.db = req.result; resolve(this.db); };
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.store)) {
          db.createObjectStore(this.store, { keyPath: 'id' });
        }
      };
    });
  }

  async getAll(): Promise<ChatSession[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.store, 'readonly');
      const req = tx.objectStore(this.store).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async put(session: ChatSession): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.store, 'readwrite');
      const req = tx.objectStore(this.store).put(session);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.store, 'readwrite');
      const req = tx.objectStore(this.store).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

const chatDB = new ChatDB();

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  isLoading: false,
  isTyping: false,

  createSession: (projectId) => {
    const session: ChatSession = {
      id: crypto.randomUUID(),
      projectId: projectId ?? null,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((s) => ({ sessions: [session, ...s.sessions], currentSessionId: session.id }));
    chatDB.put(session);
    return session;
  },

  setCurrentSession: (id) => set({ currentSessionId: id }),

  addMessage: async (sessionId, message) => {
    const full: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    set((s) => {
      const sessions = s.sessions.map((ss) =>
        ss.id === sessionId
          ? { ...ss, messages: [...ss.messages, full], updatedAt: new Date().toISOString() }
          : ss
      );
      const updated = sessions.find((ss) => ss.id === sessionId);
      if (updated) chatDB.put(updated);
      return { sessions };
    });
  },

  patchLastAssistantMessage: (sessionId, content) => {
    set((s) => {
      const sessions = s.sessions.map((ss) => {
        if (ss.id !== sessionId) return ss;
        const msgs = [...ss.messages];
        for (let i = msgs.length - 1; i >= 0; i--) {
          if (msgs[i].role === 'assistant') {
            msgs[i] = { ...msgs[i], content };
            break;
          }
        }
        const updatedSess = { ...ss, messages: msgs, updatedAt: new Date().toISOString() };
        void chatDB.put(updatedSess);
        return updatedSess;
      });
      return { sessions };
    });
  },

  deleteSession: async (id) => {
    await chatDB.delete(id);
    set((s) => ({
      sessions: s.sessions.filter((ss) => ss.id !== id),
      currentSessionId: s.currentSessionId === id ? null : s.currentSessionId,
    }));
  },

  clearCurrentSession: () => {
    const { currentSessionId, sessions } = get();
    if (!currentSessionId) return;
    const updated = sessions.map((s) =>
      s.id === currentSessionId ? { ...s, messages: [], updatedAt: new Date().toISOString() } : s
    );
    const sess = updated.find((s) => s.id === currentSessionId);
    if (sess) chatDB.put(sess);
    set({ sessions: updated });
  },

  loadSessions: async () => {
    set({ isLoading: true });
    try {
      const fromDB = await chatDB.getAll();
      const { sessions: inMemory } = get();
      // 合并内存中的新会话，避免 loadSessions 覆盖用户刚发送时创建的会话
      const merged = [...fromDB];
      for (const s of inMemory) {
        if (!merged.some((m) => m.id === s.id)) merged.push(s);
      }
      merged.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      set({ sessions: merged, isLoading: false });
    } catch (e) {
      console.error(e);
      set({ isLoading: false });
    }
  },

  sendMessage: async (content, attachedEventIds = [], _events = [], context) => {
    const { currentSessionId, addMessage, createSession, patchLastAssistantMessage } = get();
    let sessionId = currentSessionId;
    if (!sessionId) {
      const s = createSession();
      sessionId = s.id;
    }
    await addMessage(sessionId, { role: 'user', content, attachedEventIds });
    set({ isTyping: true });
    try {
      const sessions = get().sessions;
      const session = sessions.find((s) => s.id === sessionId);
      const apiMessages = (session?.messages ?? []).map((m) => ({ role: m.role, content: m.content }));

      if (isMemoryCoreRagEnabled()) {
        await addMessage(sessionId, { role: 'assistant', content: '' });
        let acc = '';
        await fetchMemoryCoreStream(apiMessages, (t) => {
          acc += t;
          patchLastAssistantMessage(sessionId, acc);
        });
        if (!acc.trim()) {
          patchLastAssistantMessage(sessionId, '（无输出：请确认已启动 memory-core 并配置 OPENAI_API_KEY / AIHUBMIX_API_KEY）');
        }
      } else {
        const { content: aiContent, appliedActions } = await fetchAIResponse(apiMessages, context);
        await addMessage(sessionId, { role: 'assistant', content: aiContent });
        if (appliedActions?.length) {
          usePageContextStore.getState().triggerRefresh(appliedActions);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '网络错误，请重试。';
      const sess = get().sessions.find((s) => s.id === sessionId);
      const last = sess?.messages[sess.messages.length - 1];
      if (last?.role === 'assistant' && last.content === '') {
        patchLastAssistantMessage(sessionId, msg);
      } else {
        await addMessage(sessionId, { role: 'assistant', content: msg });
      }
    } finally {
      set({ isTyping: false });
    }
  },
}));
