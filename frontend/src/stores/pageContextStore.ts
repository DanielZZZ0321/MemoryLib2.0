/**
 * Page Context Store - 供 Chatbot 感知当前页面
 * ConceptGraphView / MemoryLibHistory 在挂载时设置，Chatbot 发送消息时携带
 */
import { create } from 'zustand';

export interface PageContext {
  pageType: 'history' | 'conceptGraph';
  /** 仅 conceptGraph 时存在 */
  memoryLibId?: string;
  memoryLibTitle?: string;
  /** 当前记忆库的事件列表（供 AI 搜索/理解） */
  events?: Array<{
    index: number;
    title: string;
    summary: string;
    tags?: string[];
  }>;
  /** 节点 ID 列表（如 title, event-0, event-1） */
  nodeIds?: string[];
  /** 当前布局覆盖（供 AI 了解/修改） */
  nodePositions?: Record<string, { x: number; y: number }>;
  /** 与 ingest 返回的 videoId 绑定后可使用视频时间线/VLM 工具 */
  linkedVideoId?: string;
  linkedCardId?: string;
}

export interface AppliedAction {
  type: string;
  memoryLibId?: string;
}

interface PageContextState {
  context: PageContext | null;
  setContext: (ctx: PageContext | null) => void;
  /** 触发 UI 刷新（收到 AI 操作后调用） */
  refreshTrigger: number;
  lastAppliedActions: AppliedAction[] | null;
  triggerRefresh: (actions?: AppliedAction[]) => void;
}

export const usePageContextStore = create<PageContextState>((set) => ({
  context: null,
  setContext: (ctx) => set({ context: ctx }),
  refreshTrigger: 0,
  lastAppliedActions: null,
  triggerRefresh: (actions) =>
    set((s) => ({ refreshTrigger: s.refreshTrigger + 1, lastAppliedActions: actions ?? null })),
}));
