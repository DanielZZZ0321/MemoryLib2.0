import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getMemoryLib, updateMemoryLib } from '../services/memorylibService';

const router = Router();

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const data = getMemoryLib(id);
  if (!data) {
    res.status(404).json({ error: 'MemoryLib not found' });
    return;
  }
  res.json(data);
});

router.patch('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { events, title, dateRange, color, year, linkedVideoId, linkedCardId } = req.body ?? {};
  const updates: Parameters<typeof updateMemoryLib>[1] = {};
  if (Array.isArray(events)) updates.events = events;
  if (typeof title === 'string') updates.title = title;
  if (typeof dateRange === 'string') updates.dateRange = dateRange;
  if (typeof color === 'string') updates.color = color;
  if (typeof year === 'number') updates.year = year;
  if (typeof linkedVideoId === 'string') updates.linkedVideoId = linkedVideoId.trim() || undefined;
  if (typeof linkedCardId === 'string') updates.linkedCardId = linkedCardId.trim() || undefined;
  const updated = updateMemoryLib(id, updates);
  if (!updated) {
    res.status(404).json({ error: 'MemoryLib not found' });
    return;
  }
  res.json(updated);
});

export default router;
