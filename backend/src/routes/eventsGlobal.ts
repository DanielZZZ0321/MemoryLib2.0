import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { db } from '../db/database';

export const eventsGlobalRouter = Router();

function userIdFromReq(req: Request): number | null {
  const u = (req as Request & { user?: unknown }).user as { userId?: unknown } | undefined;
  return typeof u?.userId === 'number' ? u.userId : null;
}

eventsGlobalRouter.get('/', authMiddleware, (req: Request, res: Response) => {
  const userId = userIdFromReq(req);
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' });
    return;
  }

  const cardId = typeof req.query.cardId === 'string' ? req.query.cardId.trim() : '';
  const videoId = typeof req.query.videoId === 'string' ? req.query.videoId.trim() : '';
  const themeId = typeof req.query.themeId === 'string' ? req.query.themeId.trim() : '';

  // Build query with optional joins.
  let sql =
    'SELECT e.id, e.title, e.summary, e.start_ms, e.end_ms, e.video_id, e.tags_json, e.media_refs_json, e.created_at, e.updated_at FROM events_global e';
  const where: string[] = ['e.user_id = ?'];
  const params: Array<string | number> = [userId];

  if (cardId) {
    sql += ' INNER JOIN card_event ce ON ce.event_id = e.id';
    where.push('ce.card_id = ?');
    params.push(cardId);
  }

  if (themeId) {
    sql += ' INNER JOIN theme_event te ON te.event_id = e.id';
    where.push('te.theme_id = ?');
    params.push(themeId);
  }

  if (videoId) {
    where.push('e.video_id = ?');
    params.push(videoId);
  }

  sql += ` WHERE ${where.join(' AND ')} ORDER BY e.start_ms ASC`;

  const rows = db.prepare(sql).all(...params) as Array<{
    id: string;
    title: string;
    summary: string | null;
    start_ms: number | null;
    end_ms: number | null;
    video_id: string | null;
    tags_json: string | null;
    media_refs_json: string | null;
    created_at: string;
    updated_at: string;
  }>;

  res.json({
    success: true,
    events: rows.map((r) => ({
      id: r.id,
      title: r.title,
      summary: r.summary,
      start_ms: r.start_ms,
      end_ms: r.end_ms,
      video_id: r.video_id,
      tags: r.tags_json ? JSON.parse(r.tags_json) : [],
      media_refs: r.media_refs_json ? JSON.parse(r.media_refs_json) : [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    })),
  });
});

