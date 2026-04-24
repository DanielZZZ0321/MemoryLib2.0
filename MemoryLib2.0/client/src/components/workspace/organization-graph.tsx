import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type { ForceGraphMethods } from "react-force-graph-2d";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  apiUrl,
  type EventListItem,
  type GraphLink,
  type GraphNode,
  fetchKeywordGraph,
} from "@/lib/api";
import {
  eventToSharedElement,
  writeSharedElementDragData,
} from "@/lib/shared-memory-element";

const SESSION_CACHE_BUSTER = Date.now();

type Props = {
  workspaceId: string;
  workspaceName: string;
  workspaceEventIds: string[];
  events: EventListItem[];
  onKeywordFocus?: (keyword: string | null) => void;
};

type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
};

function fullMediaUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return apiUrl(url.startsWith("/") ? url : `/${url}`);
}

function nodeId(value: string | { id?: string }): string {
  return typeof value === "string" ? value : (value.id ?? "");
}

function eventIdFromNodeId(id: string): string {
  return id.startsWith("e:") ? id.slice(2) : id;
}


export function OrganizationGraph({
  workspaceId,
  workspaceName,
  workspaceEventIds,
  events,
  onKeywordFocus,
}: Props) {
  const navigate = useNavigate();
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(
    null,
  );
  const graphRef = useRef<ForceGraphMethods | undefined>(undefined);
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [graphDimensions, setGraphDimensions] = useState<{ width: number; height: number } | null>(null);

  const isGraphVisible = !loading && !error && data.nodes.length > 0;

  useEffect(() => {
    if (!isGraphVisible) return;
    const el = graphContainerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setGraphDimensions({
        width: Math.floor(rect.width),
        height: Math.floor(rect.height),
      });
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setGraphDimensions({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height),
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isGraphVisible]);

  useEffect(() => {
    const fg = graphRef.current;
    if (fg && data.nodes.length > 0) {
      fg.d3Force("charge")?.strength(-2500);
      fg.d3Force("link")?.distance(180);
      fg.d3Force("center")?.strength(0.05); // Reduce pulling to center
      fg.d3ReheatSimulation();
    }
  }, [data, graphDimensions]);


  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchKeywordGraph("keyword");
        if (!cancelled) {
          setData({ nodes: response.nodes, links: response.links });
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setData({ nodes: [], links: [] });
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

  const workspaceEventSet = useMemo(
    () => new Set(workspaceEventIds),
    [workspaceEventIds],
  );

  const graphData = useMemo(() => {
    const keptEventNodeIds = new Set<string>();
    for (const node of data.nodes) {
      if (node.type === "event" && workspaceEventSet.has(eventIdFromNodeId(node.id))) {
        keptEventNodeIds.add(node.id);
      }
    }

    const keptKeywordIds = new Set<string>();
    const links = data.links.filter((link) => {
      const source = nodeId(link.source);
      const target = nodeId(link.target);
      const sourceIsEvent = keptEventNodeIds.has(source);
      const targetIsEvent = keptEventNodeIds.has(target);
      if (!sourceIsEvent && !targetIsEvent) {
        return false;
      }
      if (sourceIsEvent) {
        keptKeywordIds.add(target);
      }
      if (targetIsEvent) {
        keptKeywordIds.add(source);
      }
      return true;
    });

    const nodes = data.nodes
      .filter(
        (node) =>
          keptEventNodeIds.has(node.id) ||
          (node.type === "keyword" && keptKeywordIds.has(node.id)),
      )
      .slice(0, 80)
      .map((node) => ({ ...node }));

    return {
      nodes,
      links: links.map((link) => ({ ...link })),
    };
  }, [data, workspaceEventSet]);

  // Find the keyword node connected to the most workspace events �?this becomes the "hub"
  // and its display name is automatically set to the workspace name.
  const hubKeywordId = useMemo(() => {
    const linkCount = new Map<string, number>();
    for (const link of graphData.links) {
      const source = nodeId(link.source);
      const target = nodeId(link.target);
      const sourceNode = graphData.nodes.find((n) => n.id === source);
      const targetNode = graphData.nodes.find((n) => n.id === target);
      // Count only keyword→event or event→keyword edges
      if (sourceNode?.type === "keyword" && targetNode?.type === "event") {
        linkCount.set(source, (linkCount.get(source) ?? 0) + 1);
      } else if (targetNode?.type === "keyword" && sourceNode?.type === "event") {
        linkCount.set(target, (linkCount.get(target) ?? 0) + 1);
      }
    }
    // Pick the keyword with the most event connections
    let maxId: string | null = null;
    let maxCount = 0;
    for (const [id, count] of linkCount) {
      if (count > maxCount) {
        maxCount = count;
        maxId = id;
      }
    }
    return maxId;
  }, [graphData]);

  // Label helper: hub node shows workspace name, others strip [seed:...] prefix
  function resolveKeywordLabel(name: string | undefined, id: string): string {
    if (id === hubKeywordId && workspaceName) {
      return workspaceName;
    }
    return (name ?? id).replace(/^\[seed:[^\]]+\]\s*/u, "");
  }

  useEffect(() => {
    let cancelled = false;
    const cache = imageCacheRef.current;
    for (const node of graphData.nodes) {
      if (node.type !== "event") {
        continue;
      }
      const rawUrl = node.thumbUrl ? `${node.thumbUrl}&_t=${SESSION_CACHE_BUSTER}` : null;
      const full = fullMediaUrl(rawUrl);
      if (!full || cache.has(full)) {
        continue;
      }
      const image = new Image();
      image.onload = () => {
        if (!cancelled) {
          graphRef.current?.d3ReheatSimulation();
        }
      };
      image.src = full;
      cache.set(full, image);
    }
    return () => {
      cancelled = true;
    };
  }, [graphData.nodes]);

  const relatedEvents = useMemo(() => {
    if (!selectedKeywordId) {
      return [];
    }
    const relatedIds = new Set<string>();
    for (const link of graphData.links) {
      const source = nodeId(link.source);
      const target = nodeId(link.target);
      if (source === selectedKeywordId && target.startsWith("e:")) {
        relatedIds.add(eventIdFromNodeId(target));
      }
      if (target === selectedKeywordId && source.startsWith("e:")) {
        relatedIds.add(eventIdFromNodeId(source));
      }
    }
    return events.filter((event) => relatedIds.has(event.id));
  }, [events, graphData.links, selectedKeywordId]);

  const selectedKeyword = useMemo(
    () => graphData.nodes.find((node) => node.id === selectedKeywordId),
    [graphData.nodes, selectedKeywordId],
  );

  const paintNode = useCallback(
    (node: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const graphNode = node as GraphNode & { x?: number; y?: number };
      const x = graphNode.x ?? 0;
      const y = graphNode.y ?? 0;
      if (graphNode.type === "keyword") {
        const label = resolveKeywordLabel(graphNode.name, graphNode.id);
        const fontSize = Math.max(8, 12 / globalScale);
        ctx.font = `bold ${fontSize}px system-ui,sans-serif`;
        const width = ctx.measureText(label).width + 24 / globalScale;
        const height = 28 / globalScale;
        
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = (graphNode.id === selectedKeywordId ? 2 : 1) / globalScale;
        ctx.beginPath();
        ctx.roundRect(x - width / 2, y - height / 2, width, height, 14 / globalScale);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = "#111827";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, x, y);
        return;
      }

      const imgWidth = 140 / globalScale;
      const imgHeight = 100 / globalScale;
      const dx = x - imgWidth / 2;
      const dy = y - imgHeight / 2;

      // Draw Card Background
      ctx.beginPath();
      ctx.roundRect(dx, dy, imgWidth, imgHeight, 6 / globalScale);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Draw Border
      ctx.strokeStyle = graphNode.highlighted ? "#3b82f6" : "#cbd5e1";
      ctx.lineWidth = (graphNode.highlighted ? 2.5 : 1) / globalScale;
      if (graphNode.highlighted) {
        ctx.setLineDash([4 / globalScale, 4 / globalScale]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      const thumbHeight = 50 / globalScale;
      // Add a consistent cache buster per render session
      const rawThumbUrl = graphNode.thumbUrl ? `${graphNode.thumbUrl}&_t=${SESSION_CACHE_BUSTER}` : null;
      const imageUrl = fullMediaUrl(rawThumbUrl);
      const image = imageUrl ? imageCacheRef.current.get(imageUrl) : undefined;

      if (image?.complete && image.naturalWidth > 0) {
        ctx.save();
        const scale = Math.max(imgWidth / image.naturalWidth, thumbHeight / image.naturalHeight);
        const dw = image.naturalWidth * scale;
        const dh = image.naturalHeight * scale;
        
        ctx.beginPath();
        ctx.roundRect(dx, dy, imgWidth, thumbHeight, [6 / globalScale, 6 / globalScale, 0, 0]);
        ctx.clip();
        ctx.drawImage(image, dx - (dw - imgWidth) / 2, dy - (dh - thumbHeight) / 2, dw, dh);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.roundRect(dx, dy, imgWidth, thumbHeight, [6 / globalScale, 6 / globalScale, 0, 0]);
        ctx.fillStyle = graphNode.highlighted ? "#bfdbfe" : "#f1f5f9";
        ctx.fill();
      }

      // Draw Line Separator
      ctx.beginPath();
      ctx.moveTo(dx, dy + thumbHeight);
      ctx.lineTo(dx + imgWidth, dy + thumbHeight);
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1 / globalScale;
      ctx.stroke();

      // Get Event Details
      const eventId = eventIdFromNodeId(graphNode.id);
      const ev = events.find((e) => e.id === eventId);
      
      // Draw Text
      ctx.fillStyle = "#0f172a";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      
      const title = ev?.title || graphNode.title || "";
      ctx.font = `bold ${Math.max(6, 11 / globalScale)}px system-ui,sans-serif`;
      ctx.fillText(title.length > 12 ? title.slice(0, 11) + "..." : title, dx + 6 / globalScale, dy + thumbHeight + 6 / globalScale);
      
      ctx.fillStyle = "#64748b";
      ctx.font = `${Math.max(5, 9 / globalScale)}px system-ui,sans-serif`;
      const desc = ev?.summary || "No description...";
      ctx.fillText(desc.length > 20 ? desc.slice(0, 19) + "..." : desc, dx + 6 / globalScale, dy + thumbHeight + 20 / globalScale);
      
      if (ev?.tags && ev.tags.length > 0) {
        ctx.fillStyle = "#3b82f6";
        const tagText = `#${ev.tags[0]}`;
        ctx.fillText(tagText.length > 15 ? tagText.slice(0, 14) + "..." : tagText, dx + 6 / globalScale, dy + thumbHeight + 34 / globalScale);
      }
    },
    [selectedKeywordId, events],
  );

  const paintPointerArea = useCallback(
    (
      node: object,
      color: string,
      ctx: CanvasRenderingContext2D,
      globalScale: number,
    ) => {
      const graphNode = node as GraphNode & { x?: number; y?: number };
      const x = graphNode.x ?? 0;
      const y = graphNode.y ?? 0;
      ctx.fillStyle = color;
      ctx.beginPath();
      if (graphNode.type === "keyword") {
        const label = resolveKeywordLabel(graphNode.name, graphNode.id);
        const fontSize = Math.max(8, 12 / globalScale);
        ctx.font = `bold ${fontSize}px system-ui,sans-serif`;
        const width = ctx.measureText(label).width + 24 / globalScale;
        const height = 28 / globalScale;
        ctx.roundRect(x - width / 2, y - height / 2, width, height, 14 / globalScale);
      } else {
        const imgWidth = 140 / globalScale;
        const imgHeight = 100 / globalScale;
        ctx.rect(x - imgWidth / 2, y - imgHeight / 2, imgWidth, imgHeight);
      }
      ctx.fill();
    },
    [],
  );

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading graph...</p>;
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  if (graphData.nodes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No keyword graph is available for this MemoryLib yet.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div
        ref={graphContainerRef}
        className="min-h-0 flex-1 overflow-hidden rounded-md border bg-muted/20"
      >
        {graphDimensions && (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            width={graphDimensions.width}
            height={graphDimensions.height}
            nodeLabel={(node: object) => {
              const graphNode = node as GraphNode;
              return graphNode.type === "keyword"
                ? resolveKeywordLabel(graphNode.name, graphNode.id)
                : (graphNode.title ?? graphNode.id);
            }}
            linkColor={() => "rgba(100,116,139,0.35)"}
            nodeCanvasObjectMode={() => "replace"}
            nodeCanvasObject={paintNode}
            nodePointerAreaPaint={paintPointerArea}
            onNodeClick={(node: object) => {
              const graphNode = node as GraphNode;
              if (graphNode.type === "event") {
                void navigate(
                  `/events/${eventIdFromNodeId(
                    graphNode.id,
                  )}?from=workspace&workspace=${encodeURIComponent(workspaceId)}`,
                );
                return;
              }
              const next =
                selectedKeywordId === graphNode.id ? null : graphNode.id;
              setSelectedKeywordId(next);
              onKeywordFocus?.(
                next ? resolveKeywordLabel(graphNode.name, graphNode.id) : null,
              );
            }}
            onEngineStop={() => {
              setTimeout(() => graphRef.current?.zoomToFit(400, 30), 50);
            }}
            onNodeDragEnd={(node: object) => {
              const graphNode = node as GraphNode & { x?: number; y?: number; fx?: number; fy?: number };
              graphNode.fx = graphNode.x;
              graphNode.fy = graphNode.y;
            }}
          />
        )}
      </div>

      <Card className="shrink-0 shadow-none">
        <CardHeader>
          <CardTitle className="text-base">Zoom Layer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedKeyword ? (
            <>
              <Badge variant="secondary">
                {resolveKeywordLabel(selectedKeyword.name, selectedKeyword.id)}
              </Badge>
              {relatedEvents.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {relatedEvents.map((event) => (
                    <li key={event.id}>
                      <Button
                        type="button"
                        draggable
                        variant="outline"
                        className="h-auto w-full justify-start whitespace-normal py-2 text-left"
                        onDragStart={(dragEvent) =>
                          writeSharedElementDragData(
                            dragEvent.dataTransfer,
                            eventToSharedElement(event),
                          )
                        }
                        onClick={() =>
                          void navigate(
                            `/events/${event.id}?from=workspace&workspace=${encodeURIComponent(
                              workspaceId,
                            )}`,
                          )
                        }
                      >
                        {event.title}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No attached events in this workspace.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a keyword node to inspect related events.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
