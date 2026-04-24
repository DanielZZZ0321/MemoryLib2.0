/**
 * TaskCanvas - Center area for task execution (diary, reflection, etc.)
 *
 * Integrates with existing DiaryCanvas component
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, BookOpen, Presentation, Lightbulb } from 'lucide-react';
import { DiaryCanvas } from '@/components/canvas/DiaryCanvas';
import { useCanvasStore } from '@/stores/canvasStore';
import type { TaskType } from '@/types/global';

interface TaskCanvasProps {
  activeView: 'panel' | 'canvas';
}

const TASK_TEMPLATES: Array<{
  id: TaskType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'diary',
    name: 'Diary',
    description: 'Create a multi-modality diary entry',
    icon: BookOpen,
  },
  {
    id: 'reflection',
    name: 'Reflection',
    description: 'Reflect on your memories and experiences',
    icon: Lightbulb,
  },
  {
    id: 'slides',
    name: 'Slides',
    description: 'Create a presentation from your memories',
    icon: Presentation,
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Start with a blank canvas',
    icon: FileText,
  },
];

export function TaskCanvas(_props: TaskCanvasProps) {
  const currentEntry = useCanvasStore((state) => state.currentEntry);
  const createNewEntry = useCanvasStore((state) => state.createNewEntry);

  const [selectedTask, setSelectedTask] = useState<TaskType | null>(
    currentEntry ? 'diary' : null
  );

  // Show template selector if no task selected
  if (!selectedTask || !currentEntry) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              What would you like to create?
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">
              Choose a template to get started, or drag events from the panel
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {TASK_TEMPLATES.map((template) => {
              const Icon = template.icon;
              return (
                <motion.button
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedTask(template.id);
                    createNewEntry(`New ${template.name}`);
                  }}
                  className="p-6 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 hover:border-blue-400 hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                      <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {template.name}
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-zinc-400">
              Tip: You can also drag events directly from the panel to start creating
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show canvas with active task
  return (
    <div className="h-full">
      <DiaryCanvas />
    </div>
  );
}
