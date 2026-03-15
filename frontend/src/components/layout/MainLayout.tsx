/**
 * MainLayout - Main application layout with three-column structure
 *
 * Layout: Panel | Canvas | Chatbot
 * - Panel: Data organization and event management
 * - Canvas: Task execution area (diary, etc.)
 * - Chatbot: AI assistant (controlled by other team members)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { useEventStore } from '@/stores/eventStore';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { DataPanel } from './DataPanel';
import { TaskCanvas } from './TaskCanvas';
import { Chatbot } from '@/components/chatbot';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  onLogout?: () => void;
}

export function MainLayout({ onLogout }: MainLayoutProps) {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(320);
  const [activeView, setActiveView] = useState<'panel' | 'canvas'>('panel');

  const user = useUIStore((state) => state.user);
  const events = useEventStore((state) => state.events);

  // Handle panel resize
  const handleLeftPanelResize = (e: React.MouseEvent) => {
    e.preventDefault();

    const startX = e.clientX;
    const startWidth = leftPanelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(280, Math.min(600, startWidth + delta));
      setLeftPanelWidth(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      {/* Header */}
      <header className="h-14 flex-shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-30">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left: Logo and navigation */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600/20 p-1.5 rounded-lg border border-blue-500/30">
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <span className="font-semibold text-sm tracking-tight">MemoryLib</span>
            </div>

            {/* View switcher */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-0.5 rounded-lg">
              <button
                onClick={() => setActiveView('panel')}
                className={cn(
                  'flex items-center px-3 py-1 text-xs rounded-md transition-all',
                  activeView === 'panel'
                    ? 'bg-white dark:bg-zinc-900 shadow-sm font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                )}
              >
                <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                Panel
              </button>
              <button
                onClick={() => setActiveView('canvas')}
                className={cn(
                  'flex items-center px-3 py-1 text-xs rounded-md transition-all',
                  activeView === 'canvas'
                    ? 'bg-white dark:bg-zinc-900 shadow-sm font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                )}
              >
                <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                Canvas
              </button>
            </div>
          </div>

          {/* Center: Stats or info */}
          <div className="flex items-center gap-4">
            {events.length > 0 && (
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {events.length} events loaded
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Panel toggles */}
            <button
              onClick={() => setLeftPanelOpen(!leftPanelOpen)}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                leftPanelOpen
                  ? 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  : 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
              )}
              title={leftPanelOpen ? 'Hide Panel' : 'Show Panel'}
            >
              {leftPanelOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeft className="w-4 h-4" />
              )}
            </button>

            <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700" />

            <ModeToggle />

            {user && (
              <div className="flex items-center gap-2 pl-2">
                <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Data Organization */}
        <AnimatePresence mode="wait">
          {leftPanelOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: leftPanelWidth, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden relative"
              style={{ width: leftPanelWidth }}
            >
              <DataPanel />

              {/* Resize handle */}
              <div
                onMouseDown={handleLeftPanelResize}
                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors group"
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-zinc-300 dark:bg-zinc-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center: Task Canvas */}
        <div className="flex-1 overflow-hidden">
          <TaskCanvas activeView={activeView} />
        </div>
      </div>

      {/* Chatbot (floating) */}
      <Chatbot />
    </div>
  );
}