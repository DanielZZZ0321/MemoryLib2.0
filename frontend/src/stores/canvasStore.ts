import { create } from 'zustand';
import type { CanvasElement, DiaryEntry, Position } from '../types/canvas';

interface CanvasState {
  // Current diary entry
  currentEntry: DiaryEntry | null;

  // Selected element for editing
  selectedElementId: string | null;

  // Drag state
  isDragging: boolean;
  draggedEventId: string | null;

  // Zoom and pan
  zoom: number;
  panOffset: Position;

  // Actions
  createNewEntry: (title: string, canvasSize?: { width: number; height: number }) => void;
  loadEntry: (entry: DiaryEntry) => void;
  saveEntry: () => DiaryEntry | null;
  updateCanvasSize: (size: { width: number; height: number }) => void;

  addElement: (element: CanvasElement) => void;
  updateElement: (id: string, changes: Partial<CanvasElement>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;

  setDragging: (isDragging: boolean, eventId?: string | null) => void;
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: Position) => void;

  // Element operations
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  duplicateElement: (id: string) => void;

  // Export
  exportAsImage: () => Promise<Blob | null>;
}

const generateId = () => crypto.randomUUID();

export const useCanvasStore = create<CanvasState>((set, get) => ({
  currentEntry: null,
  selectedElementId: null,
  isDragging: false,
  draggedEventId: null,
  zoom: 1,
  panOffset: { x: 0, y: 0 },

  createNewEntry: (title, canvasSize = { width: 800, height: 600 }) => {
    const now = new Date().toISOString();
    const entry: DiaryEntry = {
      id: generateId(),
      title,
      date: now.split('T')[0],
      elements: [],
      canvasSize,
      createdAt: now,
      updatedAt: now,
    };
    set({ currentEntry: entry, selectedElementId: null });
  },

  loadEntry: (entry) => {
    set({ currentEntry: entry, selectedElementId: null });
  },

  updateCanvasSize: (size) => {
    const { currentEntry } = get();
    if (!currentEntry) return;

    set({
      currentEntry: {
        ...currentEntry,
        canvasSize: size,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  saveEntry: () => {
    const { currentEntry } = get();
    if (!currentEntry) return null;

    const updated = {
      ...currentEntry,
      updatedAt: new Date().toISOString(),
    };
    set({ currentEntry: updated });
    return updated;
  },

  addElement: (element) => {
    const { currentEntry } = get();
    if (!currentEntry) return;

    set({
      currentEntry: {
        ...currentEntry,
        elements: [...currentEntry.elements, element],
      },
    });
  },

  updateElement: (id, changes) => {
    const { currentEntry } = get();
    if (!currentEntry) return;

    set({
      currentEntry: {
        ...currentEntry,
        elements: currentEntry.elements.map(el =>
          el.id === id ? { ...el, ...changes } : el
        ),
      },
    });
  },

  removeElement: (id) => {
    const { currentEntry, selectedElementId } = get();
    if (!currentEntry) return;

    set({
      currentEntry: {
        ...currentEntry,
        elements: currentEntry.elements.filter(el => el.id !== id),
      },
      selectedElementId: selectedElementId === id ? null : selectedElementId,
    });
  },

  selectElement: (id) => {
    set({ selectedElementId: id });
  },

  setDragging: (isDragging, eventId = null) => {
    set({ isDragging, draggedEventId: eventId });
  },

  setZoom: (zoom) => {
    set({ zoom: Math.max(0.1, Math.min(3, zoom)) });
  },

  setPanOffset: (offset) => {
    set({ panOffset: offset });
  },

  bringToFront: (id) => {
    const { currentEntry } = get();
    if (!currentEntry) return;

    const maxZ = Math.max(...currentEntry.elements.map(el => el.zIndex), 0);
    set({
      currentEntry: {
        ...currentEntry,
        elements: currentEntry.elements.map(el =>
          el.id === id ? { ...el, zIndex: maxZ + 1 } : el
        ),
      },
    });
  },

  sendToBack: (id) => {
    const { currentEntry } = get();
    if (!currentEntry) return;

    const minZ = Math.min(...currentEntry.elements.map(el => el.zIndex), 0);
    set({
      currentEntry: {
        ...currentEntry,
        elements: currentEntry.elements.map(el =>
          el.id === id ? { ...el, zIndex: minZ - 1 } : el
        ),
      },
    });
  },

  duplicateElement: (id) => {
    const { currentEntry } = get();
    if (!currentEntry) return;

    const element = currentEntry.elements.find(el => el.id === id);
    if (!element) return;

    const newElement: CanvasElement = {
      ...element,
      id: generateId(),
      position: {
        x: element.position.x + 20,
        y: element.position.y + 20,
      },
    };

    set({
      currentEntry: {
        ...currentEntry,
        elements: [...currentEntry.elements, newElement],
      },
    });
  },

  exportAsImage: async () => {
    // This would need to be implemented with html2canvas or similar
    // For now, return null
    return null;
  },
}));