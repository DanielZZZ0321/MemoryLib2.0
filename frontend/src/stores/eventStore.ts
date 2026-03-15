import { create } from 'zustand';
import { db } from '../db';
import type { EventExtended, Timeline, VideoMeta } from '../types/event';

interface EventState {
  events: EventExtended[];
  selectedEventId: string | null;

  loadEvents: () => Promise<void>;
  selectEvent: (id: string | null) => void;
  updateEvent: (id: string, changes: Partial<EventExtended>) => Promise<void>;
  importTimeline: (timeline: Timeline, filename: string) => Promise<void>;
  exportData: () => Promise<void>;
  clearEvents: () => Promise<void>;
}

export const useEventStore = create<EventState>((set, get) => ({
  events: [],
  selectedEventId: null,

  loadEvents: async () => {
    const events = await db.events.toArray();
    // Sort by chronological order
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

  importTimeline: async (timeline: Timeline, filename: string) => {
    // Clear existing data before importing
    await db.events.clear();
    await db.videos.clear();

    const videoId = crypto.randomUUID();

    const parsedDuration = Math.max(...timeline.map(e => e.end_sec)) || 0;

    const videoMeta: VideoMeta = {
      id: videoId,
      filename,
      duration: parsedDuration,
      importedAt: new Date().toISOString(),
      eventCount: timeline.length,
    };

    const extendedEvents: EventExtended[] = timeline.map((e) => ({
      id: `${videoId}_${e.event_index}`,
      videoId,
      eventIndex: e.event_index,
      startSec: e.start_sec,
      endSec: e.end_sec,
      startHms: e.start_hms,
      endHms: e.end_hms,
      title: e.title,
      summary: e.summary,
      userTitle: null,
      userSummary: null,
      tags: e.tags || [],
      notes: '',
      // Support both legacy and new media formats
      mediaUrl: e.mediaUrl,
      mediaType: e.mediaType,
      media: e.media,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    await db.videos.add(videoMeta);
    await db.events.bulkAdd(extendedEvents);

    await get().loadEvents();
  },

  exportData: async () => {
    const events = get().events;
    // For MVP export we just dump the events extended to JSON
    // A more advanced version would map it back to the original `timeline_with_summary.json` format + custom fields
    const dataStr = JSON.stringify(events, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'memorylib_export.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  },

  clearEvents: async () => {
    await db.events.clear();
    await db.videos.clear();
    set({ events: [], selectedEventId: null });
  }
}));
