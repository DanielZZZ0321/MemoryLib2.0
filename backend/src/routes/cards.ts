import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db/database';

export const cardsRouter = Router();

function userIdFromReq(req: Request): number | null {
  const u = (req as Request & { user?: unknown }).user as { userId?: unknown } | undefined;
  return typeof u?.userId === 'number' ? u.userId : null;
}

cardsRouter.get('/:id', authMiddleware, (req: Request, res: Response) => {
  const userId = userIdFromReq(req);
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' });
    return;
  }
  const cardId = String(req.params.id || '').trim();
  if (!cardId) {
    res.status(400).json({ success: false, error: 'Missing card id' });
    return;
  }

  const card = db
    .prepare('SELECT id, title, created_at, config_json FROM cards WHERE id = ? AND user_id = ?')
    .get(cardId, userId) as { id: string; title: string; created_at: string; config_json: string | null } | undefined;

  if (!card) {
    res.status(404).json({ success: false, error: 'Card not found' });
    return;
  }

  const graph = db
    .prepare('SELECT nodes_json, edges_json, layout_json, updated_at FROM card_graph WHERE card_id = ?')
    .get(cardId) as
    | { nodes_json: string; edges_json: string; layout_json: string; updated_at: string | null }
    | undefined;

  const events = db
    .prepare(
      `SELECT e.id, e.title, e.summary, e.start_ms, e.end_ms, e.video_id
       FROM events_global e
       INNER JOIN card_event ce ON ce.event_id = e.id
       WHERE ce.card_id = ? AND e.user_id = ?
       ORDER BY e.start_ms ASC`
    )
    .all(cardId, userId) as Array<{ id: string; title: string; summary: string; start_ms: number; end_ms: number; video_id: string | null }>;

  res.json({
    success: true,
    card: {
      id: card.id,
      title: card.title,
      createdAt: card.created_at,
      config: card.config_json ? JSON.parse(card.config_json) : null,
    },
    graph: graph
      ? {
          nodes: JSON.parse(graph.nodes_json),
          edges: JSON.parse(graph.edges_json),
          layout: JSON.parse(graph.layout_json),
          updatedAt: graph.updated_at,
        }
      : null,
    events,
  });
});

