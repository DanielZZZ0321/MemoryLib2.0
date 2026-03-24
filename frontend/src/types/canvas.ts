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
  content?: string;
  mediaUrl?: string;
  eventId?: string;
  event?: EventExtended;
  style?: ElementStyle;
}

export interface ElementStyle {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  color?: string;
}

export interface DiaryEntry {
  id: string;
  title: string;
  date: string;
  elements: CanvasElement[];
  canvasSize: { width: number; height: number };
  createdAt: string;
  updatedAt: string;
}
