import { create } from 'zustand';
import { getToken } from '../auth';
import { db } from '../db';
import type { Event, EventExtended, Timeline, VideoMeta } from '../types/event';

interface EventState {
  events: EventExtended[];
  selectedEventId: string | null;

  loadEvents: () => Promise<void>;
  selectEvent: (id: string | null) => void;
  updateEvent: (id: string, changes: Partial<EventExtended>) => Promise<void>;
  importTimeline: (timeline: Timeline, filename: string) => Promise<void>;
  importFromVideoAnalysis: (events: Array<{ start_sec?: number; end_sec?: number; title?: string; summary?: string }>) => Promise<void>;
  exportData: () => Promise<void>;
  clearEvents: () => Promise<void>;
  /** 灏嗗綋鍓?Dexie 浜嬩欢鍚屾鍒?FastAPI memory-core锛堢粡 Express /api/memory-core 浠ｇ悊锛?*/
  syncToMemoryCore: () => Promise<unknown>;
}

function secToHms(sec: number): string {
  const total = Math.round(sec);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  selectedEventId: null,

  loadEvents: async () => {
    const events = await db.events.toArray();
    events.sort((a, b) => a.startSec - b.startSec);
    set({ events });
  },

  selectEvent: (id) => {
    set({ selectedEventId: id });
  },

  updateEvent: async (id, changes) => {
    await db.events.update(id, { ...changes, updatedAt: new Date().toISOString() });
    await get().loadEvents();
  },

  importTimeline: async (timeline: Array<Event | Record<string, unknown>>, filename: string) => {
    await db.events.clear();
    await db.videos.clear();

    const videoId = crypto.randomUUID();
    const parsedDuration = Math.max(0, ...timeline.map((e) => (e as { end_sec?: number }).end_sec ?? 0));
    const videoMeta: VideoMeta = {
      id: videoId,
      filename,
      duration: parsedDuration,
      importedAt: new Date().toISOString(),
      eventCount: timeline.length,
    };

    const extendedEvents: EventExtended[] = timeline.map((e) => {
      const ev = e as { event_index?: number; start_sec?: number; end_sec?: number; start_hms?: string; end_hms?: string; title?: string; summary?: string; tags?: string[]; mediaUrl?: string; mediaType?: string; media?: unknown };
      return {
      id: `${videoId}_${ev.event_index ?? 0}`,
      videoId,
      eventIndex: ev.event_index ?? 0,
      startSec: ev.start_sec ?? 0,
      endSec: ev.end_sec ?? 0,
      startHms: ev.start_hms ?? secToHms(ev.start_sec ?? 0),
      endHms: ev.end_hms ?? secToHms(ev.end_sec ?? 0),
      title: ev.title ?? '',
      summary: ev.summary ?? '',
      userTitle: null,
      userSummary: null,
      tags: ev.tags ?? [],
      notes: '',
      mediaUrl: ev.mediaUrl,
      mediaType: ev.mediaType as 'image' | 'video' | undefined,
      media: ev.media as EventExtended['media'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    });

    await db.videos.add(videoMeta);
    await db.events.bulkAdd(extendedEvents);
    await get().loadEvents();
  },

  importFromVideoAnalysis: async (rawEvents) => {
    const timeline: Timeline = rawEvents.map((e, idx) => ({
      event_index: idx,
      start_sec: e.start_sec ?? 0,
      end_sec: e.end_sec ?? 0,
      start_hms: secToHms(e.start_sec ?? 0),
      end_hms: secToHms(e.end_sec ?? 0),
      title: e.title ?? `Event ${idx + 1}`,
      summary: e.summary ?? '',
    }));
    await get().importTimeline(timeline, 'video-analysis.json');
  },

  exportData: async () => {
    const events = get().events;
    const dataStr = JSON.stringify(events, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = 'memorylib_export.json';
    link.click();
  },

  clearEvents: async () => {
    await db.events.clear();
    await db.videos.clear();
    set({ events: [], selectedEventId: null });
  },

  syncToMemoryCore: async () => {
    const events = get().events;
    if (!events.length) {
      throw new Error('娌℃湁鍙悓姝ョ殑浜嬩欢');
    }
    const token = getToken();
    const raw_events = events.map((e) => ({
      start_sec: e.startSec,
      end_sec: e.endSec,
      title: (e.userTitle || e.title || '').trim() || `Event ${e.eventIndex + 1}`,
      summary: (e.userSummary || e.summary || '').trim(),
      tags: e.tags,
    }));
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch('/api/memory-core/api/v1/timeline/import', {
      method: 'POST',
      headers,
      body: JSON.stringify({ filename: 'vite-dexie-sync.json', raw_events }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || `鍚屾澶辫触 (${res.status})`);
    }
    return res.json();
  },
}));
