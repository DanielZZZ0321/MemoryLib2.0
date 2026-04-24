import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Bot, FolderOpen, ListPlus, Settings } from "lucide-react";
import { ChatPanel } from "@/components/ChatPanel";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ColdStartWizard,
  type ColdStartConfig,
} from "@/components/workspace/cold-start-wizard";
import {
  OrganizationToolbar,
  type OrganizationToolbarConfig,
} from "@/components/workspace/organization-toolbar";
import { OrganizationGraph } from "@/components/workspace/organization-graph";
import {
  type EventListItem,
  type WorkspaceRow,
  createWorkspace,
  fetchWorkspaceEvents,
  fetchWorkspaces,
  updateWorkspace,
} from "@/lib/api";
import {
  eventToSharedElement,
  writeSharedElementDragData,
} from "@/lib/shared-memory-element";
import { cn } from "@/lib/utils";
import {
  formatPageContext,
  usePageContextStore,
} from "@/stores/page-context-store";

export default function WorkspacePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const setPageContext = usePageContextStore((state) => state.setContext);
  const pageContext = usePageContextStore((state) => state.context);
  const [list, setList] = useState<WorkspaceRow[]>([]);
  const [selected, setSelected] = useState<string | null>(
    searchParams.get("workspace"),
  );
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [filterText, setFilterText] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [creating, setCreating] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [focusedKeyword, setFocusedKeyword] = useState<string | null>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(380);
  const [rightPanelWidth, setRightPanelWidth] = useState(380);
  const selectedFromUrl = searchParams.get("workspace");
  const activeEventsRequestRef = useRef<string | null>(null);

  const beginPanelResize = useCallback(
    (side: "left" | "right", startX: number) => {
      const startWidth = side === "left" ? leftPanelWidth : rightPanelWidth;
      const onMove = (event: MouseEvent) => {
        const delta =
          side === "left" ? event.clientX - startX : startX - event.clientX;
        const nextWidth = Math.max(300, Math.min(520, startWidth + delta));
        if (side === "left") {
          setLeftPanelWidth(nextWidth);
        } else {
          setRightPanelWidth(nextWidth);
        }
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [leftPanelWidth, rightPanelWidth],
  );

  const refreshList = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const response = await fetchWorkspaces();
      setList(response.items);
      setSelected((current) => {
        const urlSelected = selectedFromUrl;
        if (
          urlSelected &&
          response.items.some((workspace) => workspace.id === urlSelected)
        ) {
          return urlSelected;
        }
        if (
          current &&
          !response.items.some((workspace) => workspace.id === current)
        ) {
          return null;
        }
        return current ?? response.items[0]?.id ?? null;
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [selectedFromUrl]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  useEffect(() => {
    const next = selectedFromUrl;
    if (next && next !== selected) {
      setSelected(next);
    }
  }, [selectedFromUrl, selected]);

  const loadEvents = useCallback(async (workspaceId: string) => {
    activeEventsRequestRef.current = workspaceId;
    setEventsLoading(true);
    setErr(null);
    try {
      const response = await fetchWorkspaceEvents(workspaceId);
      if (activeEventsRequestRef.current !== workspaceId) {
        return;
      }
      setEvents(response.items);
    } catch (e) {
      if (activeEventsRequestRef.current !== workspaceId) {
        return;
      }
      setErr(e instanceof Error ? e.message : String(e));
      setEvents([]);
    } finally {
      if (activeEventsRequestRef.current === workspaceId) {
        setEventsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (selected) {
      void loadEvents(selected);
    } else {
      activeEventsRequestRef.current = null;
      setEvents([]);
    }
  }, [selected, loadEvents]);

  const selectedRow = useMemo(
    () => list.find((workspace) => workspace.id === selected),
    [list, selected],
  );
  const visibleEvents = useMemo(() => {
    if (!selectedRow) {
      return [];
    }
    const currentEventIds = new Set(selectedRow.event_ids);
    return events.filter((event) => currentEventIds.has(event.id));
  }, [events, selectedRow]);

  const selectWorkspace = useCallback(
    (workspaceId: string) => {
      setSelected(workspaceId);
      setFocusedKeyword(null);
      setSearchParams({ workspace: workspaceId });
    },
    [setSearchParams],
  );

  const coldStartConfig = useMemo(
    () => readColdStartConfig(selectedRow?.filter_criteria),
    [selectedRow],
  );
  const toolbarConfig = useMemo(
    () => readToolbarConfig(selectedRow?.filter_criteria, coldStartConfig),
    [selectedRow, coldStartConfig],
  );

  useEffect(() => {
    setPageContext({
      kind: focusedKeyword ? "organization-layer2" : "organization-layer1",
      title: selectedRow ? `${selectedRow.name} Organization` : "Workspace",
      workspaceId: selectedRow?.id,
      workspaceName: selectedRow?.name,
      keyword: focusedKeyword ?? undefined,
      details: selectedRow
        ? {
            eventCount: selectedRow.event_ids.length,
            filterCriteria: selectedRow.filter_criteria,
          }
        : { state: "No workspace selected" },
    });
  }, [focusedKeyword, selectedRow, setPageContext]);

  useEffect(() => {
    setFocusedKeyword(null);
  }, [selected]);

  const create = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }
    setCreating(true);
    setErr(null);
    try {
      const filterCriteria: Record<string, unknown> = {};
      if (filterText.trim()) {
        filterCriteria.text = filterText.trim();
      }
      if (filterTag.trim()) {
        filterCriteria.tag = filterTag.trim();
      }
      const { id } = await createWorkspace({
        name: trimmedName,
        filter_criteria: filterCriteria,
      });
      setName("");
      setFilterText("");
      setFilterTag("");
      await refreshList();
      selectWorkspace(id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  const saveWorkspaceCriteria = async (
    patch: Record<string, unknown>,
  ): Promise<void> => {
    if (!selectedRow) {
      return;
    }
    setSavingConfig(true);
    setErr(null);
    try {
      const updated = await updateWorkspace(selectedRow.id, {
        filter_criteria: {
          ...selectedRow.filter_criteria,
          ...patch,
        },
      });
      setList((current) =>
        current.map((workspace) =>
          workspace.id === updated.id ? updated : workspace,
        ),
      );
      await loadEvents(updated.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingConfig(false);
    }
  };

  const completeColdStart = async (config: ColdStartConfig) => {
    const primaryElement = config.index[0] ?? "Time";
    const secondaryElement = config.index[1] ?? "default";
    await saveWorkspaceCriteria({
      coldStart: config,
      organizationToolbar: {
        primaryElement,
        secondaryElement,
        timePeriod: config.granularity,
        classificationFineness: "medium",
        memoryDisplayCount: 24,
        keywordsEnabled: true,
      } satisfies OrganizationToolbarConfig,
    });
  };

  const renewOrganization = async (config: OrganizationToolbarConfig) => {
    await saveWorkspaceCriteria({
      organizationToolbar: config,
      layoutRenewedAt: new Date().toISOString(),
    });
  };

  const chatHint = formatPageContext(pageContext);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            History
          </Link>
          <span className="text-lg font-semibold">MemoryLib Workspace</span>
          <Badge variant="secondary">Organization</Badge>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <Link
            to="/review"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <FolderOpen className="size-4" />
            Review
          </Link>
          <Link
            to="/admin"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Settings className="size-4" />
            Admin
          </Link>
        </nav>
      </header>

      <main className="flex h-[calc(100vh-57px)] min-h-0 overflow-hidden">
        <section
          className="relative order-2 flex min-h-0 shrink-0 flex-col border-r bg-card lg:order-1"
          style={{ width: leftPanelWidth }}
        >
          <div className="border-b p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Event Panel
                </p>
                <h2 className="text-base font-semibold">
                  {selectedRow ? selectedRow.name : "Select MemoryLib"}
                </h2>
              </div>
              <Badge variant="outline">{visibleEvents.length} events</Badge>
            </div>
            <div className="grid gap-2">
              <select
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={selected ?? ""}
                disabled={loading}
                onChange={(event) => {
                  if (event.target.value) {
                    selectWorkspace(event.target.value);
                  }
                }}
              >
                <option value="" disabled>
                  {loading ? "Loading MemoryLibs" : "Choose a MemoryLib"}
                </option>
                {list.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name} (
                    {workspace.id === selectedRow?.id
                      ? visibleEvents.length
                      : workspace.event_ids.length}
                    )
                  </option>
                ))}
              </select>
              <details className="rounded-md border bg-background p-3 text-sm">
                <summary className="flex cursor-pointer list-none items-center gap-2 font-medium">
                  <ListPlus className="size-4" />
                  New MemoryLib
                </summary>
                <div className="mt-3 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="wsName">Name</Label>
                    <Input
                      id="wsName"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                    <Input
                      aria-label="Search text"
                      placeholder="Search text"
                      value={filterText}
                      onChange={(event) => setFilterText(event.target.value)}
                    />
                    <Input
                      aria-label="Tag"
                      placeholder="Tag"
                      value={filterTag}
                      onChange={(event) => setFilterTag(event.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void create()}
                    disabled={creating || !name.trim()}
                  >
                    {creating ? "Creating..." : "Create"}
                  </Button>
                </div>
              </details>
              {err ? (
                <p className="text-sm text-destructive" role="alert">
                  {err}
                </p>
              ) : null}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Events</h3>
                {eventsLoading ? (
                  <span className="text-xs text-muted-foreground">
                    Loading...
                  </span>
                ) : null}
              </div>
              {!selectedRow ? (
                <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Select a MemoryLib first.
                </p>
              ) : visibleEvents.length === 0 ? (
                <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  No events are attached to this MemoryLib yet.
                </p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {visibleEvents.map((event) => (
                    <li key={event.id}>
                      <button
                        type="button"
                        draggable
                        className="group w-full rounded-md border border-border bg-background px-3 py-2 text-left transition hover:border-primary/40 hover:bg-muted/40"
                        onDragStart={(dragEvent) =>
                          writeSharedElementDragData(
                            dragEvent.dataTransfer,
                            eventToSharedElement(event),
                          )
                        }
                        onClick={() =>
                          void navigate(
                            `/events/${event.id}?from=workspace&workspace=${encodeURIComponent(
                              selectedRow.id,
                            )}`,
                          )
                        }
                      >
                        <span className="font-medium group-hover:text-primary">
                          {event.title}
                        </span>
                        {event.is_highlighted ? (
                          <Badge className="ml-2" variant="secondary">
                            highlighted
                          </Badge>
                        ) : null}
                        {event.summary ? (
                          <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">
                            {event.summary}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-primary/40"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize event panel"
            onMouseDown={(event) => {
              event.preventDefault();
              beginPanelResize("left", event.clientX);
            }}
          />
        </section>

        <section className="order-1 flex min-w-0 flex-1 flex-col overflow-hidden bg-muted/20 p-3 lg:order-2">
          <div className="flex min-h-0 flex-1 flex-col">
            {!selectedRow ? (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed bg-background text-sm text-muted-foreground">
                Select a MemoryLib to open the organization canvas.
              </div>
            ) : !coldStartConfig && selectedRow.event_ids.length === 0 ? (
              <div className="rounded-lg border bg-card p-5">
                <ColdStartWizard
                  saving={savingConfig}
                  onComplete={(config) => void completeColdStart(config)}
                />
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      Organization Canvas
                    </p>
                    <h2 className="text-lg font-semibold">{selectedRow.name}</h2>
                  </div>
                  <Badge variant="outline">{visibleEvents.length} events</Badge>
                </div>
                <div className="shrink-0">
                  <OrganizationToolbar
                    initial={toolbarConfig}
                    saving={savingConfig}
                    onRenew={(config) => void renewOrganization(config)}
                  />
                </div>
                <OrganizationGraph
                    workspaceId={selectedRow.id}
                    workspaceName={selectedRow.name}
                  workspaceEventIds={selectedRow.event_ids}
                  events={visibleEvents}
                  onKeywordFocus={setFocusedKeyword}
                />
              </div>
            )}
          </div>
        </section>

        <section
          className="relative order-3 flex min-h-0 shrink-0 flex-col border-l bg-card"
          style={{ width: rightPanelWidth }}
        >
          <div
            className="absolute left-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-primary/40"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize chatbot panel"
            onMouseDown={(event) => {
              event.preventDefault();
              beginPanelResize("right", event.clientX);
            }}
          />
          <div className="border-b p-4">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Bot className="size-4" />
              Chatbot Agent
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Context follows the selected MemoryLib, keyword, and event.
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden p-3">
            <ChatPanel className="h-full" systemHint={chatHint} />
          </div>
        </section>

      </main>
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isColdStartConfig(value: unknown): value is ColdStartConfig {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.start_time === "string" &&
    typeof value.end_time === "string" &&
    typeof value.granularity === "string" &&
    typeof value.purpose === "string" &&
    Array.isArray(value.index)
  );
}

function readColdStartConfig(
  criteria: Record<string, unknown> | undefined,
): ColdStartConfig | null {
  const value = criteria?.coldStart;
  if (!isColdStartConfig(value)) {
    return null;
  }
  return {
    start_time: value.start_time,
    end_time: value.end_time,
    granularity: value.granularity,
    purpose: value.purpose,
    index: value.index.filter((item): item is string => typeof item === "string"),
  };
}

function readToolbarConfig(
  criteria: Record<string, unknown> | undefined,
  coldStart: ColdStartConfig | null,
): Partial<OrganizationToolbarConfig> {
  const value = criteria?.organizationToolbar;
  if (isRecord(value)) {
    return value;
  }
  if (!coldStart) {
    return {};
  }
  return {
    primaryElement: coldStart.index[0],
    secondaryElement: coldStart.index[1] ?? "default",
    timePeriod: coldStart.granularity,
  };
}
