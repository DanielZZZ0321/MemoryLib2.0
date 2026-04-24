const prefix = import.meta.env.VITE_API_BASE_URL ?? "";

export function apiUrl(path: string): string {
  return `${prefix}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export type GraphNode = {
  id: string;
  type: "keyword" | "event";
  name?: string;
  title?: string;
  dimension?: string;
  thumbUrl?: string | null;
  highlighted?: boolean;
};

export type GraphLink = { source: string; target: string };

export type KeywordGraphResponse = {
  nodes: GraphNode[];
  links: GraphLink[];
};

export async function fetchKeywordGraph(
  dimension: "person" | "keyword",
): Promise<KeywordGraphResponse> {
  return apiJson<KeywordGraphResponse>(
    `/api/keywords/graph?dimension=${encodeURIComponent(dimension)}`,
  );
}

export async function regenerateKeywords(body: {
  dimension: "person" | "keyword";
  useGemini?: boolean;
}): Promise<{ ok: boolean }> {
  return apiJson("/api/keywords/regenerate", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type EventListItem = {
  id: string;
  title: string;
  summary: string | null;
  tags: string[];
  is_highlighted: boolean;
  created_at: string;
};

export type EventModuleDTO = {
  id: string;
  event_id: string;
  module_type: string;
  title: string | null;
  content: unknown;
  sort_order: number;
};

export type EventDetail = EventListItem & {
  modules: EventModuleDTO[];
};

export async function fetchEvents(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<{ items: EventListItem[]; total: number }> {
  const sp = new URLSearchParams();
  if (params?.page) {
    sp.set("page", String(params.page));
  }
  if (params?.pageSize) {
    sp.set("pageSize", String(params.pageSize));
  }
  if (params?.q) {
    sp.set("q", params.q);
  }
  const q = sp.toString();
  return apiJson(`/api/events${q ? `?${q}` : ""}`);
}

export async function fetchEvent(id: string): Promise<EventDetail> {
  return apiJson(`/api/events/${encodeURIComponent(id)}`);
}

export async function updateEvent(
  id: string,
  patch: Record<string, unknown>,
): Promise<EventDetail> {
  return apiJson(`/api/events/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export async function setEventHighlight(
  id: string,
  is_highlighted: boolean,
): Promise<void> {
  await apiJson(`/api/events/${encodeURIComponent(id)}/highlight`, {
    method: "POST",
    body: JSON.stringify({ is_highlighted }),
  });
}

export async function updateEventModule(
  eventId: string,
  moduleId: string,
  patch: Record<string, unknown>,
): Promise<EventDetail> {
  return apiJson(
    `/api/events/${encodeURIComponent(eventId)}/modules/${encodeURIComponent(moduleId)}`,
    { method: "PUT", body: JSON.stringify(patch) },
  );
}

export type WorkspaceRow = {
  id: string;
  name: string;
  description: string | null;
  filter_criteria: Record<string, unknown>;
  event_ids: string[];
  created_at: string;
  updated_at: string;
};

export async function fetchWorkspaces(): Promise<{ items: WorkspaceRow[] }> {
  return apiJson("/api/workspaces");
}

export async function createWorkspace(body: {
  name: string;
  description?: string | null;
  filter_criteria?: Record<string, unknown>;
}): Promise<{ id: string }> {
  return apiJson("/api/workspaces", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateWorkspace(
  id: string,
  patch: {
    name?: string;
    description?: string | null;
    filter_criteria?: Record<string, unknown>;
  },
): Promise<WorkspaceRow> {
  return apiJson(`/api/workspaces/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export async function fetchWorkspaceEvents(
  id: string,
): Promise<{ id: string; items: EventListItem[] }> {
  return apiJson(`/api/workspaces/${encodeURIComponent(id)}/events`);
}

export type RawSourceDTO = {
  id: string;
  file_path: string;
  file_type: string;
  original_filename: string;
  processing_status: string;
  upload_time: string;
};

export async function fetchAdminSources(params?: {
  page?: number;
  pageSize?: number;
}): Promise<{
  items: RawSourceDTO[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const sp = new URLSearchParams();
  if (params?.page) {
    sp.set("page", String(params.page));
  }
  if (params?.pageSize) {
    sp.set("pageSize", String(params.pageSize));
  }
  const q = sp.toString();
  return apiJson(`/api/admin/sources${q ? `?${q}` : ""}`);
}

export async function deleteAdminSource(id: string): Promise<void> {
  const res = await fetch(apiUrl(`/api/admin/sources/${encodeURIComponent(id)}`), {
    method: "DELETE",
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
}

export async function reprocessAdminSource(id: string): Promise<void> {
  await apiJson(`/api/admin/sources/${encodeURIComponent(id)}/reprocess`, {
    method: "POST",
    body: "{}",
  });
}

export type AvailableSeedFile = {
  name: string;
  path: string;
  seedSource: string;
  workspaceName: string;
  events: number;
  media: number;
};

export type ImportedDataset = {
  id: string;
  seedSource: string;
  name: string;
  description: string | null;
  events: number;
  updated_at: string;
};

export async function fetchAdminDatasets(): Promise<{
  available: AvailableSeedFile[];
  imported: ImportedDataset[];
}> {
  return apiJson("/api/admin/datasets");
}

export async function importAdminDataset(body: {
  seedPath?: string;
  seed?: unknown;
}): Promise<{ ok: boolean; seedSource: string; workspace: string; events: number }> {
  return apiJson("/api/admin/datasets/import", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminDataset(seedSource: string): Promise<{
  ok: boolean;
  seedSource: string;
  deletedEvents: number;
}> {
  return apiJson(`/api/admin/datasets/${encodeURIComponent(seedSource)}`, {
    method: "DELETE",
  });
}

export function adminDatasetExportUrl(seedSource: string): string {
  return apiUrl(`/api/admin/datasets/${encodeURIComponent(seedSource)}/export`);
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function streamChatCompletion(
  messages: ChatMessage[],
  onDelta: (text: string) => void,
): Promise<void> {
  const res = await fetch(apiUrl("/api/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `${res.status}`);
  }
  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("无响应流");
  }
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";
      for (const block of blocks) {
        for (const line of block.split("\n")) {
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
              content?: string;
              error?: string;
            };
            if (j.error) {
              throw new Error(j.error);
            }
            if (j.content) {
              onDelta(j.content);
            }
          } catch (e) {
            if (e instanceof SyntaxError) {
              continue;
            }
            throw e;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
