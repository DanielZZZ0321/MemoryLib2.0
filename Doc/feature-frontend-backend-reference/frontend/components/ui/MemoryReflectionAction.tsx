import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, Palette, GitMerge, BrainCircuit, HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const REFLECTION_TASKS = [
  { id: 'color-diary', label: 'Color\nDiary', icon: Palette },
  { id: 'event-logic', label: 'Event\nLogic', icon: GitMerge },
  { id: 'decision-making', label: 'Decision\nMaking', icon: BrainCircuit },
  { id: 'emotion-healing', label: 'Emotion\nHealing', icon: HeartPulse },
];

export function MemoryReflectionAction() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="fixed bottom-8 left-8 z-50 flex flex-col items-start gap-4">
      {/* Expanded Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-4 w-auto flex flex-col gap-2 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
            
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 px-2">Memory Reflection Tasks</h3>
              <div className="w-2 h-2 rounded-full bg-red-400" />
            </div>

            <div className="flex items-center gap-3">
              {REFLECTION_TASKS.map((task) => {
                const Icon = task.icon;
                return (
                  <button
                    key={task.id}
                    className="w-24 h-24 bg-zinc-700 hover:bg-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-2xl shadow-inner flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 hover:-translate-y-1 active:scale-95"
                  >
                    <Icon className="w-6 h-6 opacity-80" />
                    <span className="text-xs font-medium text-center whitespace-pre-line leading-tight">{task.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 px-6 py-3.5 rounded-full shadow-lg transition-all duration-300 backdrop-blur-md",
          isOpen 
            ? "bg-zinc-800 text-zinc-50 dark:bg-zinc-200 dark:text-zinc-900 hover:bg-zinc-900 dark:hover:bg-zinc-100" 
            : "bg-zinc-600/90 hover:bg-zinc-700 dark:bg-zinc-700/90 dark:hover:bg-zinc-600 text-white"
        )}
      >
        <span className="font-medium text-lg tracking-wide">Memory Reflection</span>
        <div className="bg-white text-zinc-800 dark:bg-zinc-900 dark:text-white rounded-full p-0.5">
           {isOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </div>
      </button>
    </div>
  );
}
