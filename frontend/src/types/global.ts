// ============================================
// Global Types for MemoryLib2.0
// ============================================

// Cold Start Configuration
export interface ColdStartConfig {
  startTime: Date | null;
  endTime: Date | null;
  granularity: 'daily' | 'weekly' | 'monthly' | 'event';
  purpose: 'review' | 'diary' | 'project' | 'reflection' | 'custom';
  primaryIndex: IndexType;
  secondaryIndex?: IndexType;
}

export type IndexType = 'time' | 'event_type' | 'emotion' | 'person' | 'location' | 'keyword';

// User
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
  coldStartCompleted: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultGranularity: 'daily' | 'weekly' | 'monthly';
  defaultIndex: IndexType;
}

// Panel Types
export type ZoomLevel = 1 | 2 | 3;
export type LayoutType = 'graph' | 'timeline' | 'grid' | 'list';

export interface PanelFilter {
  timeRange: {
    start: Date | null;
    end: Date | null;
  };
  eventTypes: string[];
  emotions: string[];
  people: string[];
  locations: string[];
  keywords: string[];
}

// Canvas Types
export type TaskType = 'diary' | 'reflection' | 'slides' | 'custom';

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  thumbnail?: string;
  defaultSize: { width: number; height: number };
}

// UI State Types
export type ActivePanel = 'panel' | 'canvas' | 'chatbot';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  read: boolean;
}

// Drag and Drop Types
export interface DragItem {
  type: 'event' | 'media' | 'keyword';
  id: string;
  data: unknown;
}

export interface DropZone {
  id: string;
  type: 'canvas' | 'chatbot';
  accepts: DragItem['type'][];
}

// Event Categories for Organization
export const EVENT_CATEGORIES = [
  'work',
  'sports',
  'entertainment',
  'social',
  'travel',
  'food',
  'learning',
  'health',
  'shopping',
  'other',
] as const;

export type EventCategory = typeof EVENT_CATEGORIES[number];

// Emotion Types
export const EMOTION_TYPES = [
  'happy',
  'sad',
  'angry',
  'anxious',
  'calm',
  'excited',
  'bored',
  'nostalgic',
  'grateful',
  'stressed',
] as const;

export type EmotionType = typeof EMOTION_TYPES[number];