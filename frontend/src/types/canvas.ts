import type { EventExtended } from './event';

export type CanvasElementType = 'text' | 'image' | 'video' | 'event-card';

export interface Position {
  x: number;
  y: number;
}

export interface CanvasElement {
  id: string;
  type: CanvasElementType;
  position: Position;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;

  // Content based on type
  content?: string; // For text elements
  mediaUrl?: string; // For image/video
  eventId?: string; // Reference to event for event-card type
  event?: EventExtended; // Cached event data

  // Styling
  style?: ElementStyle;
}

export interface ElementStyle {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  borderColor?: string;
  borderWidth?: number;
}

export interface DiaryTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  elements: CanvasElement[];
  canvasSize: {
    width: number;
    height: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DiaryEntry {
  id: string;
  title: string;
  date: string;
  template?: string; // Template ID
  elements: CanvasElement[];
  canvasSize: {
    width: number;
    height: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Predefined templates
export const PREDEFINED_TEMPLATES: Pick<DiaryTemplate, 'id' | 'name' | 'description' | 'canvasSize'>[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch',
    canvasSize: { width: 800, height: 600 }
  },
  {
    id: 'daily-journal',
    name: 'Daily Journal',
    description: 'Perfect for daily reflections',
    canvasSize: { width: 800, height: 1000 }
  },
  {
    id: 'travel-log',
    name: 'Travel Log',
    description: 'Document your adventures',
    canvasSize: { width: 1000, height: 800 }
  },
  {
    id: 'photo-collage',
    name: 'Photo Collage',
    description: 'Showcase your memories',
    canvasSize: { width: 800, height: 800 }
  }
];