export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  timestamp?: string;
  caption?: string;
  duration?: number;
}

export interface Event {
  event_index: number;
  start_sec: number;
  end_sec: number;
  start_hms: string;
  end_hms: string;
  title: string;
  summary: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  media?: MediaItem[];
  tags?: string[];
}

export type Timeline = Event[];

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface EventExtended {
  id: string;
  videoId: string;
  eventIndex: number;
  startSec: number;
  endSec: number;
  startHms: string;
  endHms: string;
  title: string;
  summary: string;
  userTitle: string | null;
  userSummary: string | null;
  tags: string[];
  notes: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  media?: MediaItem[];
  createdAt: string;
  updatedAt: string;
}

export interface VideoMeta {
  id: string;
  filename: string;
  duration: number;
  importedAt: string;
  eventCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachedEventIds?: string[];
}

export interface ChatSession {
  id: string;
  projectId: string | null;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
