/**
 * Concept Graph Layout Algorithm
 *
 * Node-link diagram layout where:
 * - More "central" or "important" nodes are placed toward the center
 * - Related nodes (connected by edges) cluster together
 * - Uses force-directed simulation with center gravity
 */

export interface ConceptNode {
  id: string;
  label: string;
  /** Higher = more central/important, placed closer to center. Default: inferred from degree */
  weight?: number;
}

export interface ConceptEdge {
  source: string;
  target: string;
  /** Edge strength, higher = nodes pull tighter */
  weight?: number;
}

export interface LayoutInput {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  width: number;
  height: number;
}

export interface PositionedNode extends ConceptNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface LayoutConfig {
  /** Number of simulation iterations */
  iterations?: number;
  /** Repulsion strength between nodes */
  repulsion?: number;
  /** Attraction strength along edges */
  attraction?: number;
  /** Ideal edge length - edges tend toward this distance for uniform spread */
  idealEdgeLength?: number;
  /** Center gravity strength (pulls high-weight nodes toward center) */
  centerGravity?: number;
  /** Initial temperature for random placement spread */
  temperature?: number;
  /** Cool-down factor per iteration (simulated annealing) */
  cooling?: number;
}

const DEFAULT_CONFIG: Required<LayoutConfig> = {
  iterations: 150,
  repulsion: 8000,
  attraction: 0.08,
  idealEdgeLength: 0, // 0 = use dist-based attraction
  centerGravity: 0.02,
  temperature: 200,
  cooling: 0.95,
};

/**
 * Compute node importance/weight from graph structure if not provided.
 * Higher degree = more connections = more central.
 */
function computeWeights(
  nodes: ConceptNode[],
  edges: ConceptEdge[]
): Map<string, number> {
  const degree = new Map<string, number>();
  nodes.forEach((n) => degree.set(n.id, 0));
  edges.forEach((e) => {
    degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
    degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
  });
  const maxDeg = Math.max(1, ...degree.values());
  const weights = new Map<string, number>();
  nodes.forEach((n) => {
    const d = degree.get(n.id) ?? 0;
    // Blend explicit weight with degree: 0.5 * (normalized_degree) + 0.5 * (explicit or 0.5)
    const w = n.weight ?? (d / maxDeg);
    weights.set(n.id, Math.max(0.1, w));
  });
  return weights;
}

/**
 * Run force-directed layout with center gravity.
 * Returns nodes with (x, y) coordinates in [0, width] x [0, height].
 */
export function computeConceptLayout(
  input: LayoutInput,
  config: LayoutConfig = {}
): PositionedNode[] {
  const { nodes, edges, width, height } = input;
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (nodes.length === 0) return [];

  const centerX = width / 2;
  const centerY = height / 2;

  // Single node: place at center directly
  if (nodes.length === 1) {
    return nodes.map((n) => ({
      ...n,
      x: centerX,
      y: centerY,
      vx: 0,
      vy: 0,
    }));
  }

  const weights = computeWeights(nodes, edges);

  // Build adjacency for edge lookup
  const byId = new Map<string, PositionedNode>();
  const minDim = Math.min(width, height);
  const initialRadius = (minDim / 2) * 0.75;
  const positioned: PositionedNode[] = nodes.map((n, i) => {
    // Initial placement: evenly spaced on circle for better spread
    const angle = (i / Math.max(1, nodes.length)) * Math.PI * 2 - Math.PI / 2;
    const r = initialRadius * (n.id === 'title' ? 0 : 1);
    const node: PositionedNode = {
      ...n,
      x: centerX + Math.cos(angle) * r,
      y: centerY + Math.sin(angle) * r,
      vx: 0,
      vy: 0,
    };
    byId.set(n.id, node);
    return node;
  });

  const edgeList = edges
    .map((e) => {
      const a = byId.get(e.source);
      const b = byId.get(e.target);
      if (!a || !b) return null;
      return { a, b, w: e.weight ?? 1 };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  let temp = cfg.temperature;

  for (let iter = 0; iter < cfg.iterations; iter++) {
    // 1. Repulsion between all pairs
    for (let i = 0; i < positioned.length; i++) {
      for (let j = i + 1; j < positioned.length; j++) {
        const a = positioned[i];
        const b = positioned[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy + 1e-6;
        const dist = Math.sqrt(distSq);
        const force = cfg.repulsion / distSq;
        const fx = (force * dx) / dist;
        const fy = (force * dy) / dist;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;
      }
    }

    // 2. Attraction along edges (spring toward ideal length for uniform spread)
    const idealLen = cfg.idealEdgeLength || 0;
    for (const { a, b, w } of edgeList) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const force =
        idealLen > 0
          ? (dist - idealLen) * cfg.attraction * w
          : dist * cfg.attraction * w;
      const fx = (force * dx) / dist;
      const fy = (force * dy) / dist;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    }

    // 3. Center gravity (weighted: high-weight nodes pulled more toward center)
    for (const node of positioned) {
      const w = weights.get(node.id) ?? 0.5;
      const pull = cfg.centerGravity * w * temp;
      const dx = centerX - node.x;
      const dy = centerY - node.y;
      node.vx += dx * pull;
      node.vy += dy * pull;
    }

    // 4. Apply velocity with temperature dampening
    for (const node of positioned) {
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy) || 1;
      const cap = temp;
      const scale = Math.min(1, cap / speed);
      node.x += node.vx * scale;
      node.y += node.vy * scale;

      // Keep within bounds (soft boundary)
      const margin = 40;
      node.x = Math.max(margin, Math.min(width - margin, node.x));
      node.y = Math.max(margin, Math.min(height - margin, node.y));

      // Decay velocity
      node.vx *= 0.7;
      node.vy *= 0.7;
    }

    temp *= cfg.cooling;
  }

  return positioned;
}

/**
 * Compute edge paths for rendering.
 * Returns [x1, y1, x2, y2] for line, or curves for bezier.
 */
export interface LayoutEdge {
  source: string;
  target: string;
  weight?: number;
  /** Control points for curved path: [sx, sy, cx, cy, ex, ey] for quadratic bezier */
  path?: [number, number, number, number, number, number];
}

export function computeEdgePaths(
  nodes: PositionedNode[],
  edges: ConceptEdge[],
  viewBox: { width: number; height: number }
): LayoutEdge[] {
  const byId = new Map<string, PositionedNode>();
  nodes.forEach((n) => byId.set(n.id, n));

  return edges.map((e) => {
    const a = byId.get(e.source);
    const b = byId.get(e.target);
    if (!a || !b) return { ...e, path: undefined };

    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const perpX = -dy / len;
    const perpY = dx / len;
    const curveOffset = Math.min(len * 0.3, 60);
    const cx = midX + perpX * curveOffset;
    const cy = midY + perpY * curveOffset;

    return {
      ...e,
      path: [a.x, a.y, cx, cy, b.x, b.y] as [number, number, number, number, number, number],
    };
  });
}
