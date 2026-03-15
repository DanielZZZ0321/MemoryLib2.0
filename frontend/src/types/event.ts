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
  location?: string;
  mood?: string;
  people?: string[];
  work?: Record<string, any>;
  health?: Record<string, any>;
  relationship?: string;
  activity?: Record<string, any>;
  transport?: Record<string, any>;
  purchases?: any[];
  end_of_day?: boolean;
}

export type Timeline = Event[];

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface EventExtended {
  id: string; // Composite ID: videoId_eventIndex
  videoId: string;
  eventIndex: number;
  startSec: number;
  endSec: number;
  startHms: string;
  endHms: string;

  // AI Generated
  title: string;
  summary: string;

  // User edits
  userTitle: string | null;
  userSummary: string | null;
  tags: string[];
  notes: string;

  // Media Extensions (legacy support)
  mediaUrl?: string;
  mediaType?: 'image' | 'video';

  // Media Extensions (new array format)
  media?: MediaItem[];

  // Metadata
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

// ============================================
// Project Types
// ============================================

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  eventIds: string[];
  thumbnailUrl?: string;
  status: 'active' | 'archived' | 'completed';
}

// ============================================
// Chat Types
// ============================================

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
