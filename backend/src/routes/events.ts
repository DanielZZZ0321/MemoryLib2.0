import { Router } from 'express';

export type EventArea = 'organization' | 'chat' | 'task';

export interface EventPayload {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}

interface TransferRequest {
  event: EventPayload;
  targetArea: EventArea;
}

// In-memory store: track events per area (for persistence, replace with DB)
const eventStore: Record<EventArea, EventPayload[]> = {
  organization: [],
  chat: [],
  task: [],
};

export const eventsRouter = Router();

// Transfer event to a target area
eventsRouter.post('/transfer', (req, res) => {
  const { event, targetArea } = req.body as TransferRequest;
  if (!event?.id || !event?.title || !targetArea) {
    res.status(400).json({
      success: false,
      error: 'Missing event or targetArea',
    });
    return;
  }
  if (!['organization', 'chat', 'task'].includes(targetArea)) {
    res.status(400).json({
      success: false,
      error: 'Invalid targetArea',
    });
    return;
  }

  const payload: EventPayload = {
    id: event.id,
    title: event.title,
    description: event.description,
    createdAt: event.createdAt || new Date().toISOString(),
  };

  // Remove from previous area and add to target
  for (const area of Object.keys(eventStore) as EventArea[]) {
    eventStore[area] = eventStore[area].filter((e) => e.id !== payload.id);
  }
  eventStore[targetArea].push(payload);

  res.json({
    success: true,
    event: payload,
    targetArea,
  });
});

// Get events for an area
eventsRouter.get('/', (req, res) => {
  const area = req.query.area as EventArea | undefined;
  if (area && ['organization', 'chat', 'task'].includes(area)) {
    res.json({ success: true, events: eventStore[area] });
  } else {
    res.json({ success: true, events: eventStore });
  }
});
