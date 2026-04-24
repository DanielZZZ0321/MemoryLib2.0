import React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export interface MemoryNodeProps {
  title: string;
  images?: string[];
  selected?: boolean;
  dateStr?: string;
  description?: string;
  className?: string;
  onClick?: () => void;
  // Node type can dictate the style (e.g. pill only vs detail card)
  variant?: 'pill' | 'detail' | 'image-cluster';
}

export function MemoryNode({ 
  title, 
  images = [], 
  selected = false, 
  dateStr,
  description,
  variant = 'pill',
  className,
  onClick 
}: MemoryNodeProps) {

  if (variant === 'detail') {
    return (
      <div 
        onClick={onClick}
        className={cn(
          "w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border p-3 flex flex-col gap-2 transition-transform hover:scale-[1.02] cursor-pointer",
          selected ? "border-blue-500 border-[3px] border-dashed" : "border-zinc-200 dark:border-zinc-800",
          className
        )}
      >
        {images.length > 0 && (
          <div className="w-full h-36 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-950">
            <img src={images[0]} alt={title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="px-1">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
          {(dateStr || description) && (
            <div className="mt-1 flex flex-col gap-1">
              {dateStr && <span className="text-xs text-zinc-500 font-medium">{dateStr}</span>}
              {description && <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-4 leading-relaxed">{description}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'image-cluster') {
    return (
      <div 
        onClick={onClick}
        className={cn(
          "relative group cursor-pointer",
          selected ? "p-1 border-4 border-blue-400 border-dashed bg-blue-500/10" : "",
          className
        )}
      >
         {images.length > 0 ? (
           <img 
             src={images[0]} 
             alt={title} 
             className="w-40 h-28 object-cover border-2 border-white dark:border-zinc-900 shadow-md group-hover:scale-105 transition-transform" 
           />
         ) : (
           <div className="w-40 h-28 bg-zinc-200 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 shadow-md flex items-center justify-center">
             <span className="text-zinc-400 text-xs shadow-sm">No Image</span>
           </div>
         )}
      </div>
    );
  }

  // Default 'pill' variant
  return (
    <div 
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-100 rounded-full shadow-sm text-sm font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:scale-105 transition-all",
        selected && "ring-4 ring-blue-500/30 border-blue-500 text-blue-600 dark:text-blue-400",
        className
      )}
    >
      {title}
    </div>
  );
}
