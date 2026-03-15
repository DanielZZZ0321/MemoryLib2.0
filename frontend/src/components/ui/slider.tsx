import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils'; // Assuming this utility exists or we'll add it

export interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatLabel?: (val: number) => string;
  className?: string;
}

export function RangeSlider({ min, max, value, onChange, formatLabel, className }: RangeSliderProps) {
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const getPercentage = (val: number) => ((val - min) / (max - min)) * 100;
  
  const handlePointerDown = (thumb: 'start' | 'end', e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(thumb);
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || !trackRef.current) return;

      const trackRect = trackRef.current.getBoundingClientRect();
      let percent = (e.clientX - trackRect.left) / trackRect.width;
      percent = Math.max(0, Math.min(1, percent));
      
      const newValue = min + percent * (max - min);

      if (isDragging === 'start') {
        const clampedNewValue = Math.min(newValue, value[1] - (max - min) * 0.05);
        onChange([clampedNewValue, value[1]]);
      } else {
        const clampedNewValue = Math.max(newValue, value[0] + (max - min) * 0.05);
        onChange([value[0], clampedNewValue]);
      }
    };

    const handlePointerUp = () => {
      setIsDragging(null);
    };

    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, value, min, max, onChange]);

  return (
    <div className={cn("relative w-full h-12 flex flex-col justify-center select-none group", className)}>
      {/* Track Background */}
      <div 
        className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 bg-zinc-200 dark:bg-zinc-800 rounded-full" 
        ref={trackRef}
      />
      
      {/* Active Track */}
      <div 
        className="absolute top-1/2 h-1.5 -translate-y-1/2 bg-zinc-900 dark:bg-zinc-400 rounded-full"
        style={{
          left: `${getPercentage(value[0])}%`,
          right: `${100 - getPercentage(value[1])}%`,
        }}
      />
      
      {/* Start Thumb */}
      <div
        className={cn(
          "absolute top-1/2 w-4 h-4 -translate-y-1/2 -mt-[0px] -ml-2 rounded-full border-2 border-zinc-900 dark:border-zinc-400 bg-white shadow-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer z-10 hover:scale-110",
          isDragging === 'start' && "scale-110 ring-2 ring-zinc-400/50"
        )}
        style={{ left: `${getPercentage(value[0])}%` }}
        onPointerDown={(e) => handlePointerDown('start', e)}
      >
         {formatLabel && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {formatLabel(value[0])}
          </div>
        )}
      </div>
      
      {/* End Thumb */}
      <div
        className={cn(
          "absolute top-1/2 w-4 h-4 -translate-y-1/2 -mt-[0px] -ml-2 rounded-full border-2 border-zinc-900 dark:border-zinc-400 bg-white shadow-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer z-10 hover:scale-110",
          isDragging === 'end' && "scale-110 ring-2 ring-zinc-400/50"
        )}
        style={{ left: `${getPercentage(value[1])}%` }}
        onPointerDown={(e) => handlePointerDown('end', e)}
      >
        {formatLabel && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
             {formatLabel(value[1])}
          </div>
        )}
      </div>
    </div>
  );
}
