import React from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

export type CardTheme = 'blue' | 'yellow' | 'green' | 'purple' | 'red';

export interface ProjectHistoryCardProps {
  title: string;
  theme: CardTheme;
  dateRange: string;
  tags: string[];
  onClick?: () => void;
  className?: string;
  isNew?: boolean;
}

const themeStyles: Record<CardTheme, { shadow: string, border: string, ribbon: string, text: string }> = {
  blue: {
    shadow: 'shadow-blue-500/20',
    border: 'border-blue-400',
    ribbon: 'bg-blue-400 text-white',
    text: 'text-blue-600 dark:text-blue-400'
  },
  yellow: {
    shadow: 'shadow-yellow-500/20',
    border: 'border-yellow-400',
    ribbon: 'bg-yellow-400 text-zinc-900',
    text: 'text-yellow-600 dark:text-yellow-400'
  },
  green: {
    shadow: 'shadow-green-500/20',
    border: 'border-green-400',
    ribbon: 'bg-green-400 text-zinc-900',
    text: 'text-green-600 dark:text-green-400'
  },
  purple: {
    shadow: 'shadow-purple-500/20',
    border: 'border-purple-400',
    ribbon: 'bg-purple-400 text-white',
    text: 'text-purple-600 dark:text-purple-400'
  },
  red: {
    shadow: 'shadow-red-500/20',
    border: 'border-red-400',
    ribbon: 'bg-red-400 text-white',
    text: 'text-red-600 dark:text-red-400'
  }
};

export function ProjectHistoryCard({
  title,
  theme,
  dateRange,
  tags,
  onClick,
  className,
  isNew = false
}: ProjectHistoryCardProps) {
  const styles = themeStyles[theme];

  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative rounded-3xl bg-white dark:bg-zinc-900 border-[3px] p-6 w-64 h-48 flex flex-col cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl overflow-hidden",
        styles.border,
        `shadow-[0_0_30px_-5px]`,
        styles.shadow,
        className
      )}
    >
      {/* Date Ribbon */}
      <div className={cn(
        "absolute -right-12 top-6 w-40 text-center py-1 text-xs font-bold rotate-45 transform origin-center font-mono shadow-sm",
        styles.ribbon
      )}>
        {dateRange}
      </div>

      <div className="flex-1 mt-2 pr-4">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
          {title === 'N/A' ? 'Untitled Project' : title}
        </h3>
      </div>

      <div className="flex flex-wrap gap-2 mt-auto">
        {tags.map((tag) => (
          <span 
            key={tag}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-full border bg-transparent",
              styles.text,
              styles.border
            )}
          >
            {tag}
          </span>
        ))}
      </div>
      
      {/* Plus Button Overlay for "New Project" variants */}
      {isNew && (
        <div className="absolute inset-0 bg-black/5 dark:bg-white/5 backdrop-blur-[1px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
           <div className="bg-zinc-800 text-white rounded-full py-2 px-4 flex items-center gap-2 font-medium shadow-lg">
             New MemoryLib <Plus className="w-5 h-5 bg-white text-zinc-800 rounded-full" />
           </div>
        </div>
      )}
    </div>
  );
}
