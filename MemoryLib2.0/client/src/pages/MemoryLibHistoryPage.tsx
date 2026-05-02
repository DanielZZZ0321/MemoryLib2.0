import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CalendarDays, FolderOpen, Plus, Search, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type WorkspaceRow, fetchWorkspaces } from "@/lib/api";
import { cn } from "@/lib/utils";
import { usePageContextStore } from "@/stores/page-context-store";

type HistoryGroup = {
  year: string;
  items: WorkspaceRow[];
};

const fallbackCards: WorkspaceRow[] = [
  {
    id: "general-review",
    name: "General Memory Review",
    description: "All imported events and generated keyword graph.",
    filter_criteria: { scope: "all" },
    event_ids: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function getYear(value: string | undefined): string {
  if (!value) {
    return "Unsorted";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unsorted";
  }
  return String(date.getFullYear());
}

function describeCriteria(criteria: Record<string, unknown>): string[] {
  return Object.entries(criteria)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value)}`);
}

function colorForIndex(index: number): string {
  const colors = [
    "border-l-rose-400",
    "border-l-cyan-500",
    "border-l-amber-400",
    "border-l-emerald-500",
    "border-l-violet-500",
  ];
  return colors[index % colors.length] ?? "border-l-primary";
}

function groupByYear(items: WorkspaceRow[]): HistoryGroup[] {
  const groups = new Map<string, WorkspaceRow[]>();
  for (const item of items) {
    const year = getYear(item.updated_at ?? item.created_at);
    groups.set(year, [...(groups.get(year) ?? []), item]);
  }
  return Array.from(groups.entries())
    .map(([year, groupItems]) => ({ year, items: groupItems }))
    .sort((a, b) => b.year.localeCompare(a.year));
}

export default function MemoryLibHistoryPage() {
  const setContext = usePageContextStore((state) => state.setContext);
  const [workspaces, setWorkspaces] = useState<WorkspaceRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setContext({
      kind: "history",
      title: "MemoryLib History",
      details: { purpose: "Select or create a MemoryLib workspace." },
    });
  }, [setContext]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchWorkspaces();
        if (!cancelled) {
          setWorkspaces(response.items);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setWorkspaces([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleWorkspaces = useMemo(() => {
    const source = workspaces.length > 0 ? workspaces : fallbackCards;
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return source;
    }
    return source.filter((workspace) => {
      const haystack = [
        workspace.name,
        workspace.description ?? "",
        ...describeCriteria(workspace.filter_criteria),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [query, workspaces]);

  const groups = useMemo(
    () => groupByYear(visibleWorkspaces),
    [visibleWorkspaces],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              MemoryLib History
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a memory workspace, then continue into organization,
              review, and editing flows.
            </p>
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
              to="/diary-templates"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <BookOpen className="size-4" />
              多模态日记预览
            </Link>
            <Link
              to="/admin"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Settings className="size-4" />
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-6">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search MemoryLib"
            />
          </div>
          <Link
            to="/workspace"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            <Plus className="size-4" />
            New MemoryLib
          </Link>
        </section>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading MemoryLibs...</p>
        ) : null}

        {!loading && groups.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center">
            <p className="font-medium">No MemoryLibs match this search.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Clear the search or create a new MemoryLib.
            </p>
          </div>
        ) : null}

        {groups.map((group) => (
          <section key={group.year} className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold uppercase text-muted-foreground">
                {group.year}
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map((workspace, index) => {
                const criteria = describeCriteria(workspace.filter_criteria);
                const target =
                  workspace.id === "general-review"
                    ? "/review"
                    : `/workspace?workspace=${encodeURIComponent(workspace.id)}`;
                return (
                  <Link key={workspace.id} to={target} className="block">
                    <Card
                      className={cn(
                        "h-full border-l-4 transition hover:-translate-y-0.5 hover:shadow-md",
                        colorForIndex(index),
                      )}
                    >
                      <CardHeader>
                        <CardTitle>{workspace.name}</CardTitle>
                        <CardDescription>
                          {workspace.description ||
                            "Memory workspace generated from imported events."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {criteria.length > 0 ? (
                            criteria.map((item) => (
                              <Badge key={item} variant="secondary">
                                {item}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline">default index</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{workspace.event_ids.length} events</span>
                          <span>
                            Updated{" "}
                            {new Date(
                              workspace.updated_at ?? workspace.created_at,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
