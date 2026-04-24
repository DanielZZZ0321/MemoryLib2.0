/**
 * Concept Graph View - Node-link diagram with auto layout
 * Supports both tag-based nodes and event-based nodes (from memorylib JSON)
 */
import { useMemo, useRef, useState, useEffect } from 'react';
import {
  computeConceptLayout,
  computeEdgePaths,
  type ConceptNode,
  type ConceptEdge,
  type PositionedNode,
} from '../lib/conceptLayout';
import { EventNodeCard, type MemoryLibEvent } from './EventNodeCard';
import { EventEditorPopup, type EventEditorData } from './EventEditorPopup';
import { usePageContextStore } from '../stores/pageContextStore';

interface MemoryLibDetail {
  title: string;
  dateRange?: string;
  color?: string;
  events?: MemoryLibEvent[];
}

interface ConceptGraphViewProps {
  entry: { id: string; title: string; tags: string[]; color: string; sourceFile?: string };
  onBack: () => void;
  onOpenChat?: () => void;
  width?: number;
  height?: number;
}

function buildGraphFromTags(entry: { title: string; tags: string[] }): {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
} {
  const nodes: ConceptNode[] = [];
  const edges: ConceptEdge[] = [];
  const titleId = 'title';
  nodes.push({ id: titleId, label: entry.title, weight: 1 });
  const uniqueTags = [...new Set(entry.tags)].slice(0, 12);
  uniqueTags.forEach((tag, i) => {
    const id = `tag-${i}`;
    nodes.push({ id, label: tag, weight: 0.3 + (0.4 * (uniqueTags.length - i)) / uniqueTags.length });
    edges.push({ source: titleId, target: id, weight: 0.8 });
  });
  for (let i = 0; i < uniqueTags.length - 1; i += 2) {
    edges.push({ source: `tag-${i}`, target: `tag-${i + 1}`, weight: 0.4 });
  }
  return { nodes, edges };
}

function buildGraphFromEvents(entry: { title: string }, events: MemoryLibEvent[]): {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
} {
  const nodes: ConceptNode[] = [];
  const edges: ConceptEdge[] = [];
  const titleId = 'title';
  nodes.push({ id: titleId, label: entry.title, weight: 1 });
  events.slice(0, 12).forEach((ev, i) => {
    const id = `event-${i}`;
    nodes.push({ id, label: ev.title, weight: 0.3 + (0.4 * (events.length - i)) / Math.max(1, events.length) });
    edges.push({ source: titleId, target: id, weight: 0.8 });
  });
  for (let i = 0; i < events.length - 1; i += 2) {
    edges.push({ source: `event-${i}`, target: `event-${i + 1}`, weight: 0.4 });
  }
  return { nodes, edges };
}

export function ConceptGraphView({ entry, onBack, onOpenChat, width: w, height: h }: ConceptGraphViewProps) {
  const graphAreaRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [memoryLib, setMemoryLib] = useState<MemoryLibDetail | null>(null);
  const [editingEvent, setEditingEvent] = useState<{ event: EventEditorData; index: number } | null>(null);
  const [positionsOverride, setPositionsOverride] = useState<Record<string, { x: number; y: number }>>({});
  const dragRef = useRef<{
    nodeId: string;
    startX: number;
    startY: number;
    startOverride: { x: number; y: number } | null;
    hasMoved: boolean;
  } | null>(null);

  const useEvents = !!(memoryLib?.events && memoryLib.events.length > 0);

  // 鍔犺浇宸蹭繚瀛樼殑甯冨眬锛沞vent 涓?tag 妯″紡鍒嗗埆瀛樺偍
  useEffect(() => {
    if (!entry.id || entry.id === 'new') {
      setPositionsOverride({});
      return;
    }
    const mode = useEvents ? 'events' : 'tags';
    const key = `memorylib-layout-${entry.id}-${mode}`;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, { x: number; y: number }>;
        if (parsed && typeof parsed === 'object') {
          setPositionsOverride(parsed);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setPositionsOverride({});
  }, [entry.id, useEvents]);

  // 鎷栧姩缁撴潫鍚庤嚜鍔ㄤ繚瀛樺竷灞€锛堥槻鎶栵紝閬垮厤鎷栨嫿杩囩▼涓绻佸啓鍏ワ級
  useEffect(() => {
    if (!entry.id || entry.id === 'new') return;
    const mode = useEvents ? 'events' : 'tags';
    const key = `memorylib-layout-${entry.id}-${mode}`;
    const timer = setTimeout(() => {
      if (Object.keys(positionsOverride).length > 0) {
        try {
          localStorage.setItem(key, JSON.stringify(positionsOverride));
        } catch {
          /* ignore */
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [entry.id, useEvents, positionsOverride]);

  useEffect(() => {
    const el = graphAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect ?? { width: 800, height: 600 };
      setSize({ width: Math.max(300, Math.floor(width)), height: Math.max(300, Math.floor(height)) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const refreshTrigger = usePageContextStore((s) => s.refreshTrigger);
  const lastAppliedActions = usePageContextStore((s) => s.lastAppliedActions);
  const setContext = usePageContextStore((s) => s.setContext);

  // 渚?Chatbot 鎰熺煡褰撳墠椤甸潰锛氳蹇嗗簱銆佷簨浠躲€佸竷灞€
  useEffect(() => {
    if (!entry.id || entry.id === 'new') {
      setContext(null);
      return;
    }
    if (!memoryLib) return;
    setContext({
      pageType: 'conceptGraph',
      memoryLibId: entry.id,
      memoryLibTitle: entry.title,
      events: useEvents && memoryLib.events
        ? memoryLib.events.map((e, i) => ({
            index: i,
            title: e.title,
            summary: e.summary,
            tags: e.tags,
          }))
        : undefined,
      nodeIds: layoutNodes?.map((n) => n.id),
      nodePositions: Object.keys(positionsOverride).length > 0 ? positionsOverride : undefined,
    });
    return () => setContext(null);
  }, [entry.id, entry.title, memoryLib, useEvents, positionsOverride, setContext]);

  useEffect(() => {
    const id = entry.id;
    if (!id || id === 'new') {
      setMemoryLib(null);
      return;
    }
    fetch(`/api/memorylibs/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMemoryLib(d as MemoryLibDetail))
      .catch(() => setMemoryLib(null));
  }, [entry.id, refreshTrigger]);

  // AI 鎿嶄綔鍚庯細鑻ヤ负 layout_reset 鍒欐竻闄ゅ竷灞€
  useEffect(() => {
    if (!lastAppliedActions?.length || !entry.id || entry.id === 'new') return;
    const hasReset = lastAppliedActions.some((a) => a.type === 'layout_reset' && a.memoryLibId === entry.id);
    if (hasReset) {
      setPositionsOverride({});
      const mode = useEvents ? 'events' : 'tags';
      try {
        localStorage.removeItem(`memorylib-layout-${entry.id}-${mode}`);
      } catch {
        /* ignore */
      }
    }
  }, [lastAppliedActions, entry.id, useEvents]);

  const width = w ?? size.width;
  const height = h ?? size.height;

  const { nodes: layoutNodes, edges } = useMemo(() => {
    const { nodes: n, edges: e } = useEvents
      ? buildGraphFromEvents(entry, memoryLib!.events!)
      : buildGraphFromTags(entry);
    const minDim = Math.min(width, height);
    const positioned = computeConceptLayout(
      { nodes: n, edges: e, width, height },
      {
        iterations: 200,
        repulsion: 120000,
        attraction: 0.025,
        idealEdgeLength: minDim * 0.28,
        centerGravity: 0.008,
        temperature: 280,
        cooling: 0.96,
      }
    );
    return { nodes: positioned, edges: e };
  }, [
    entry.id,
    entry.title,
    entry.tags.join(','),
    width,
    height,
    useEvents,
    useEvents ? memoryLib?.events?.length : 0,
  ]);

  const nodes = useMemo(() => {
    return layoutNodes.map((n) => {
      const o = positionsOverride[n.id];
      return o ? { ...n, x: o.x, y: o.y } : n;
    });
  }, [layoutNodes, positionsOverride]);

  const links = useMemo(() => {
    const result = computeEdgePaths(nodes, edges, { width, height });
    return result.filter((e) => e.path);
  }, [nodes, edges, width, height]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      d.hasMoved = true;
      const el = graphAreaRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;
      const scale = Math.min(scaleX, scaleY);
      const dx = e.movementX * scale;
      const dy = e.movementY * scale;
      setPositionsOverride((prev) => {
        const current = prev[d.nodeId] ?? { x: d.startX, y: d.startY };
        return { ...prev, [d.nodeId]: { x: current.x + dx, y: current.y + dy } };
      });
    };
    const onUp = () => {
      dragRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    const handler = (e: PointerEvent) => {
      onMove(e);
    };
    document.addEventListener('pointermove', handler as unknown as (e: Event) => void);
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointermove', handler as unknown as (e: Event) => void);
      document.removeEventListener('pointerup', onUp);
    };
  }, [width, height]);

  const handleNodePointerDown = (nodeId: string, node: PositionedNode) => {
    const override = positionsOverride[nodeId];
    dragRef.current = {
      nodeId,
      startX: node.x,
      startY: node.y,
      startOverride: override ?? null,
      hasMoved: false,
    };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  const handleNodeDoubleClick = (eventIdx: number, ev: MemoryLibEvent | null) => {
    if (ev && eventIdx >= 0) {
      setEditingEvent({
        event: { ...ev, media: ev.media?.map((m) => ({ ...m, type: m.type as 'image' | 'video' | 'audio' })) ?? [] },
        index: eventIdx,
      });
    }
  };

  const colorClass = entry.color || 'blue';
  const accentColors: Record<string, string> = {
    blue: '#3b82f6',
    yellow: '#eab308',
    green: '#22c55e',
    purple: '#8b5cf6',
    red: '#ef4444',
  };
  const accent = accentColors[colorClass] ?? accentColors.blue;

  return (
    <div className="w-full h-full min-h-screen flex flex-col bg-[#0f172a]">
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-slate-700/50 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="text-slate-400 hover:text-white transition-colors"
        >
          鈫?杩斿洖
        </button>
        {onOpenChat && (
          <button
            type="button"
            onClick={onOpenChat}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            title="鎵撳紑鑱婂ぉ鍔╂墜"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            鑱婂ぉ
          </button>
        )}
      </div>
      <div ref={graphAreaRef} className="flex-1 min-h-[300px] flex relative" style={{ overflow: 'hidden' }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          className="absolute inset-0"
        >
          <defs>
            <linearGradient id="linkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={accent} stopOpacity={0.9} />
              <stop offset="100%" stopColor={accent} stopOpacity={0.3} />
            </linearGradient>
          </defs>
          <g className="links">
            {links.map((link, i) =>
              link.path ? (
                <path
                  key={i}
                  d={`M ${link.path[0]} ${link.path[1]} Q ${link.path[2]} ${link.path[3]} ${link.path[4]} ${link.path[5]}`}
                  fill="none"
                  stroke={accent}
                  strokeOpacity={0.4}
                  strokeWidth={2}
                />
              ) : null
            )}
          </g>
          {useEvents ? (
            nodes.map((node) => {
              const isTitle = node.id === 'title';
              const eventIdx = node.id.startsWith('event-') ? parseInt(node.id.replace('event-', ''), 10) : -1;
              const event = eventIdx >= 0 ? memoryLib!.events![eventIdx] : null;
              const cardW = isTitle ? 180 : 160;
              const cardH = isTitle ? 100 : 90;
              return (
                <foreignObject
                  key={node.id}
                  x={node.x - cardW / 2}
                  y={node.y - cardH / 2}
                  width={cardW}
                  height={cardH}
                  className="overflow-visible"
                >
                  <div className="w-full h-full flex items-center justify-center p-0">
                    {isTitle ? (
                      <div
                        className="rounded-lg flex items-center justify-center text-center px-3 py-2 cursor-grab active:cursor-grabbing"
                        style={{
                          minWidth: 140,
                          maxWidth: 180,
                          background: 'linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%)',
                          border: `2px solid ${accent}`,
                          boxShadow: `0 2px 8px rgba(0,0,0,0.3)`,
                        }}
                        onPointerDown={() => handleNodePointerDown(node.id, node)}
                      >
                        <span className="font-semibold text-slate-100 text-sm line-clamp-2">{entry.title}</span>
                      </div>
                    ) : event ? (
                      <div
                        role="button"
                        tabIndex={0}
                        className="cursor-grab active:cursor-grabbing w-full h-full flex items-center justify-center"
                        onPointerDown={() => handleNodePointerDown(node.id, node)}
                        onDoubleClick={() => handleNodeDoubleClick(eventIdx, event)}
                        onKeyDown={(e) => e.key === 'Enter' && handleNodeDoubleClick(eventIdx, event)}
                      >
                        <EventNodeCard event={event} accent={accent} isCenter={false} onClick={() => {}} />
                      </div>
                    ) : null}
                  </div>
                </foreignObject>
              );
            })
          ) : (
            <g className="nodes">
              {nodes.map((node) => (
                <g
                  key={node.id}
                  style={{ cursor: 'grab' }}
                  onPointerDown={() => handleNodePointerDown(node.id, node)}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.id === 'title' ? 32 : 24}
                    fill={node.id === 'title' ? accent : '#1e293b'}
                    stroke={accent}
                    strokeWidth={node.id === 'title' ? 3 : 2}
                    strokeOpacity={0.8}
                  />
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#e2e8f0"
                    fontSize={node.id === 'title' ? 14 : 11}
                    fontWeight={node.id === 'title' ? 600 : 400}
                  >
                    {node.label.length > 10 ? node.label.slice(0, 9) + '鈥? : node.label}
                  </text>
                </g>
              ))}
            </g>
          )}
        </svg>
      </div>

      {editingEvent && (
        <EventEditorPopup
          event={editingEvent.event}
          eventIndex={editingEvent.index}
          accent={accent}
          onClose={() => setEditingEvent(null)}
          onSave={(updated) => {
            if (memoryLib?.events) {
              const next = [...memoryLib.events];
              next[editingEvent.index] = updated;
              setMemoryLib({ ...memoryLib, events: next });
            }
            setEditingEvent(null);
          }}
        />
      )}
    </div>
  );
}
