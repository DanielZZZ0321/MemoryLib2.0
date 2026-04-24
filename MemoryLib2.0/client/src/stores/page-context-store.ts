import { create } from "zustand";

export type PageContextKind =
  | "history"
  | "workspace"
  | "organization-layer1"
  | "organization-layer2"
  | "event-editor"
  | "canvas";

export type PageContextState = {
  kind: PageContextKind;
  title: string;
  workspaceId?: string;
  workspaceName?: string;
  eventId?: string;
  keyword?: string;
  details?: Record<string, unknown>;
};

type PageContextStore = {
  context: PageContextState;
  setContext: (context: PageContextState) => void;
  resetContext: () => void;
};

const defaultContext: PageContextState = {
  kind: "history",
  title: "MemoryLib History",
};

export const usePageContextStore = create<PageContextStore>((set) => ({
  context: defaultContext,
  setContext: (context) => set({ context }),
  resetContext: () => set({ context: defaultContext }),
}));

export function formatPageContext(context: PageContextState): string {
  const parts = [
    `Current page: ${context.title}`,
    `Page kind: ${context.kind}`,
  ];

  if (context.workspaceName) {
    parts.push(`MemoryLib: ${context.workspaceName}`);
  }
  if (context.workspaceId) {
    parts.push(`MemoryLib id: ${context.workspaceId}`);
  }
  if (context.keyword) {
    parts.push(`Selected keyword: ${context.keyword}`);
  }
  if (context.eventId) {
    parts.push(`Selected event id: ${context.eventId}`);
  }
  if (context.details) {
    parts.push(`Context details: ${JSON.stringify(context.details)}`);
  }

  return parts.join("\n");
}
