/**
 * Page Context Store - 渚?Chatbot 鎰熺煡褰撳墠椤甸潰
 * ConceptGraphView / MemoryLibHistory 鍦ㄦ寕杞芥椂璁剧疆锛孋hatbot 鍙戦€佹秷鎭椂鎼哄甫
 */
import { create } from 'zustand';

export interface PageContext {
  pageType: 'history' | 'conceptGraph';
  /** 浠?conceptGraph 鏃跺瓨鍦?*/
  memoryLibId?: string;
  memoryLibTitle?: string;
  /** 褰撳墠璁板繂搴撶殑浜嬩欢鍒楄〃锛堜緵 AI 鎼滅储/鐞嗚В锛?*/
  events?: Array<{
    index: number;
    title: string;
    summary: string;
    tags?: string[];
  }>;
  /** 鑺傜偣 ID 鍒楄〃锛堝 title, event-0, event-1锛?*/
  nodeIds?: string[];
  /** 褰撳墠甯冨眬瑕嗙洊锛堜緵 AI 浜嗚В/淇敼锛?*/
  nodePositions?: Record<string, { x: number; y: number }>;
}

export interface AppliedAction {
  type: string;
  memoryLibId?: string;
}

interface PageContextState {
  context: PageContext | null;
  setContext: (ctx: PageContext | null) => void;
  /** 瑙﹀彂 UI 鍒锋柊锛堟敹鍒?AI 鎿嶄綔鍚庤皟鐢級 */
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
