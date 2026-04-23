import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { ForceGraphMethods } from "react-force-graph-2d";
import { Link, useNavigate } from "react-router-dom";
import { ChatPanel } from "@/components/ChatPanel";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  apiUrl,
  type EventListItem,
  type GraphLink,
  type GraphNode,
  fetchEvents,
  fetchKeywordGraph,
  regenerateKeywords,
} from "@/lib/api";

function thumbFullUrl(thumbUrl: string | null | undefined): string | null {
  if (!thumbUrl) {
    return null;
  }
  if (thumbUrl.startsWith("http://") || thumbUrl.startsWith("https://")) {
    return thumbUrl;
  }
  const path = thumbUrl.startsWith("/") ? thumbUrl : `/${thumbUrl}`;
  return apiUrl(path);
}

export default function GeneralReviewPage() {
  const navigate = useNavigate();
  const [dimension, setDimension] = useState<"person" | "keyword">("keyword");
  const [data, setData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({
    nodes: [],
    links: [],
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [regenBusy, setRegenBusy] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [recentEvents, setRecentEvents] = useState<EventListItem[]>([]);

  const loadRecentEvents = useCallback(async () => {
    try {
      const r = await fetchEvents({ page: 1, pageSize: 40 });
      setRecentEvents(r.items);
    } catch {
      setRecentEvents([]);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const g = await fetchKeywordGraph(dimension);
      setData({ nodes: g.nodes, links: g.links });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setData({ nodes: [], links: [] });
    } finally {
      setLoading(false);
    }
  }, [dimension]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadRecentEvents();
  }, [loadRecentEvents]);

  const fgData = useMemo(
    () => ({
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.links.map((l) => ({ ...l })),
    }),
    [data],
  );

  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const imgRef = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    let cancelled = false;
    const cache = imgRef.current;
    const seen = new Set<string>();
    for (const n of data.nodes) {
      if (n.type !== "event") {
        continue;
      }
      const full = thumbFullUrl(n.thumbUrl ?? null);
      if (!full) {
        continue;
      }
      seen.add(full);
    }
    for (const full of seen) {
      if (cache.has(full)) {
        continue;
      }
      const im = new Image();
      im.onload = () => {
        if (!cancelled) {
          fgRef.current?.d3ReheatSimulation();
        }
      };
      im.src = full;
      cache.set(full, im);
    }
    return () => {
      cancelled = true;
    };
  }, [data.nodes]);

  const paintNode = useCallback(
    (node: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as GraphNode & { x?: number; y?: number };
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      if (n.type === "keyword") {
        const r = 6 / globalScale;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = "#6366f1";
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.2)";
        ctx.lineWidth = 1 / globalScale;
        ctx.stroke();
        return;
      }
      if (n.type !== "event") {
        return;
      }
      const label = String(n.title ?? n.id).slice(0, 16);
      const R = 13 / globalScale;
      const full = thumbFullUrl(n.thumbUrl ?? null);
      const img = full ? imgRef.current.get(full) : undefined;
      let drew = false;
      if (img?.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, R, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, x - R, y - R, R * 2, R * 2);
        ctx.restore();
        drew = true;
      }
      if (!drew) {
        ctx.beginPath();
        ctx.arc(x, y, R, 0, 2 * Math.PI);
        ctx.fillStyle = n.highlighted ? "#f97316" : "#22c55e";
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(x, y, R, 0, 2 * Math.PI);
      ctx.strokeStyle = "rgba(15,23,42,0.35)";
      ctx.lineWidth = 1.2 / globalScale;
      ctx.stroke();
      const fs = Math.max(8, 10 / globalScale);
      ctx.font = `${fs}px system-ui,sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "rgba(15,23,42,0.92)";
      ctx.fillText(label, x, y + R + 3 / globalScale);
    },
    [],
  );

  const paintPointerArea = useCallback(
    (
      node: object,
      color: string,
      ctx: CanvasRenderingContext2D,
      globalScale: number,
    ) => {
      const n = node as GraphNode & { x?: number; y?: number };
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      const rad =
        n.type === "event"
          ? 18 / globalScale
          : n.type === "keyword"
            ? 8 / globalScale
            : 4 / globalScale;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, 2 * Math.PI);
      ctx.fill();
    },
    [],
  );

  const onRegenerate = async (useLlm: boolean) => {
    setRegenBusy(true);
    setErr(null);
    try {
      await regenerateKeywords({ dimension, useGemini: useLlm });
      await load();
      await loadRecentEvents();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setRegenBusy(false);
    }
  };

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
          <span className="text-lg font-semibold">General Review</span>
          <Badge variant="secondary">Review</Badge>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={chatOpen ? "secondary" : "outline"}
            size="sm"
            onClick={() => setChatOpen((v) => !v)}
          >
            Chatbot
          </Button>
          <Link
            to="/admin"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            后台上传
          </Link>
          <Link
            to="/workspace"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            工作区
          </Link>
        </nav>
      </header>

      <main className="flex flex-col gap-4 p-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">事件</CardTitle>
            </CardHeader>
            <CardContent>
              {recentEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">—</p>
              ) : (
                <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
                  {recentEvents.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        className="w-full rounded-md px-2 py-1.5 text-left hover:bg-muted"
                        onClick={() => void navigate(`/events/${e.id}`)}
                      >
                        <span className="font-medium">{e.title}</span>
                        {e.is_highlighted ? (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ★
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle>图谱</CardTitle>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={dimension === "keyword" ? "default" : "outline"}
                  onClick={() => setDimension("keyword")}
                >
                  主题词
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={dimension === "person" ? "default" : "outline"}
                  onClick={() => setDimension("person")}
                >
                  人物
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={regenBusy}
                  onClick={() => void onRegenerate(false)}
                >
                  重建
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={regenBusy}
                  onClick={() => void onRegenerate(true)}
                >
                  LLM
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {err ? (
                <p className="mb-2 text-sm text-destructive">{err}</p>
              ) : null}
              {loading ? (
                <p className="text-sm text-muted-foreground">…</p>
              ) : (
                <div className="h-[560px] w-full overflow-hidden rounded-md border bg-muted/20">
                  <ForceGraph2D
                    ref={fgRef}
                    graphData={fgData}
                    nodeLabel={(n: object) => {
                      const o = n as GraphNode;
                      return o.type === "keyword"
                        ? (o.name ?? o.id)
                        : (o.title ?? o.id);
                    }}
                    nodeVal={(n: object) => {
                      const o = n as GraphNode;
                      return o.type === "keyword" ? 6 : 4;
                    }}
                    linkColor={() => "rgba(148,163,184,0.5)"}
                    nodeCanvasObjectMode={() => "replace"}
                    nodeCanvasObject={paintNode}
                    nodePointerAreaPaint={paintPointerArea}
                    onNodeClick={(n: object) => {
                      const o = n as GraphNode;
                      if (o.type !== "event") {
                        return;
                      }
                      const raw = o.id.startsWith("e:") ? o.id.slice(2) : o.id;
                      void navigate(`/events/${raw}`);
                    }}
                    cooldownTicks={120}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {chatOpen ? (
          <Card className="w-full shrink-0 lg:w-96">
            <CardHeader>
              <CardTitle className="text-base">Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <ChatPanel systemHint="Memoria" />
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  );
}
