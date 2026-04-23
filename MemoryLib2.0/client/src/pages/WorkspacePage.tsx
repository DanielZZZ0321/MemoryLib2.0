import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChatPanel } from "@/components/ChatPanel";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type EventListItem,
  type WorkspaceRow,
  createWorkspace,
  fetchWorkspaceEvents,
  fetchWorkspaces,
} from "@/lib/api";

export default function WorkspacePage() {
  const navigate = useNavigate();
  const [list, setList] = useState<WorkspaceRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [events, setEvents] = useState<EventListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [filterText, setFilterText] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [creating, setCreating] = useState(false);

  const refreshList = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetchWorkspaces();
      setList(r.items);
      setSelected((cur) => {
        if (cur && !r.items.some((w) => w.id === cur)) {
          return null;
        }
        return cur;
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const loadEvents = useCallback(async (wid: string) => {
    setEventsLoading(true);
    setErr(null);
    try {
      const r = await fetchWorkspaceEvents(wid);
      setEvents(r.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selected) {
      void loadEvents(selected);
    } else {
      setEvents([]);
    }
  }, [selected, loadEvents]);

  const create = async () => {
    const n = name.trim();
    if (!n) {
      return;
    }
    setCreating(true);
    setErr(null);
    try {
      const fc: Record<string, unknown> = {};
      if (filterText.trim()) {
        fc.text = filterText.trim();
      }
      if (filterTag.trim()) {
        fc.tag = filterTag.trim();
      }
      const { id } = await createWorkspace({
        name: n,
        filter_criteria: fc,
      });
      setName("");
      await refreshList();
      setSelected(id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  };

  const selectedRow = list.find((w) => w.id === selected);
  const chatHint =
    selectedRow &&
    `工作区：${selectedRow.name}；事件：${selectedRow.event_ids.length}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← 首页
          </Link>
          <span className="text-lg font-semibold">工作区</span>
          <Badge variant="secondary">Workspace</Badge>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <Link
            to="/review"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            General Review
          </Link>
          <Link
            to="/admin"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            后台上传
          </Link>
        </nav>
      </header>

      <main className="grid gap-6 p-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">工作区</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wsName">名称</Label>
                <Input
                  id="wsName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fcText">全文</Label>
                  <Input
                    id="fcText"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fcTag">标签</Label>
                  <Input
                    id="fcTag"
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={() => void create()}
                disabled={creating || !name.trim()}
              >
                {creating ? "创建中…" : "创建工作区"}
              </Button>
              {err ? (
                <p className="text-sm text-destructive" role="alert">
                  {err}
                </p>
              ) : null}
              {loading ? (
                <p className="text-sm text-muted-foreground">…</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {list.map((w) => (
                    <li key={w.id}>
                      <button
                        type="button"
                        className={cn(
                          "w-full rounded-md border px-3 py-2 text-left transition-colors",
                          selected === w.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted/50",
                        )}
                        onClick={() => setSelected(w.id)}
                      >
                        <span className="font-medium">{w.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {w.event_ids.length}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">事件</CardTitle>
            </CardHeader>
            <CardContent>
              {!selected ? (
                <p className="text-sm text-muted-foreground">—</p>
              ) : eventsLoading ? (
                <p className="text-sm text-muted-foreground">…</p>
              ) : events.length === 0 ? (
                <p className="text-sm text-muted-foreground">—</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {events.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        className="w-full rounded border border-transparent px-2 py-1 text-left hover:border-border hover:bg-muted/30"
                        onClick={() => void navigate(`/events/${e.id}`)}
                      >
                        <span className="font-medium">{e.title}</span>
                        {e.is_highlighted ? (
                          <Badge className="ml-2" variant="secondary">
                            ★
                          </Badge>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="min-h-[320px]">
          <CardHeader>
            <CardTitle className="text-base">Chat</CardTitle>
          </CardHeader>
          <CardContent>
            <ChatPanel systemHint={chatHint ?? "Memoria"} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
