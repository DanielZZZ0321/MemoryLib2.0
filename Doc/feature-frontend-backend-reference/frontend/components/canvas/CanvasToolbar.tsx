import React, { useRef } from 'react';
import { Type, Image as ImageIcon, ZoomIn, ZoomOut, Save, Download, PanelLeftClose, PanelLeft, LayoutTemplate } from 'lucide-react';
import { useCanvasStore } from '../../stores/canvasStore';
import type { CanvasElement } from '../../types/canvas';

interface CanvasToolbarProps {
  onAddText: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoom: number;
  onToggleSidebar: () => void;
  showSidebar: boolean;
}

export function CanvasToolbar({ onAddText, onZoomIn, onZoomOut, zoom, onToggleSidebar, showSidebar }: CanvasToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addElement, selectElement } = useCanvasStore();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      const element: CanvasElement = {
        id: crypto.randomUUID(),
        type: 'image',
        position: { x: 100, y: 100 },
        width: 300,
        height: 200,
        rotation: 0,
        zIndex: Date.now(),
        locked: false,
        mediaUrl: url,
        style: {},
      };
      addElement(element);
      selectElement(element.id);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="h-14 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <button onClick={onToggleSidebar} className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg">
          {showSidebar ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
        </button>
        <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-1" />
        <button onClick={onAddText} className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg">
          <Type className="w-4 h-4" /> Add Text
        </button>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg">
          <ImageIcon className="w-4 h-4" /> Add Image
        </button>
      </div>
      <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
        <LayoutTemplate className="w-4 h-4" />
        <span className="text-sm font-medium">Multi-modality Diary</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-700 rounded-lg">
          <button onClick={onZoomOut} className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-l-lg">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-3 text-sm min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={onZoomIn} className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-600 rounded-r-lg">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg">
          <Save className="w-4 h-4" /> Save
        </button>
        <button className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg">
          <Download className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
