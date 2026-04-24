import React, { useState } from 'react';
import { Settings, RefreshCw } from 'lucide-react';
import { Select } from '@/components/ui/select';
import { RangeSlider } from '@/components/ui/slider';

const PRIMARY_ELEMENTS = [
  { value: 'event', label: 'Event' },
  { value: 'emotion', label: 'Emotion' },
  { value: 'people', label: 'People' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'custom', label: 'Custom' },
];

const SECONDARY_ELEMENTS = [
  { value: 'time', label: 'Time' },
  ...PRIMARY_ELEMENTS.filter(p => p.value !== 'event')
];

export function FilterToolbar() {
  const [primaryElement, setPrimaryElement] = useState('event');
  const [secondaryElement, setSecondaryElement] = useState('time');
  const [timePeriod, setTimePeriod] = useState<[number, number]>([2.13, 2.22]);
  
  // Settings popover state
  const [showSettings, setShowSettings] = useState(false);
  const [fineness, setFineness] = useState<[number, number]>([50, 50]);
  const [displayCount, setDisplayCount] = useState<[number, number]>([30, 30]);

  // Format label to look like dates (e.g., 2.13)
  const formatTimeLabel = (val: number) => {
    const month = Math.floor(val);
    const day = Math.round((val - month) * 100);
    return `${month}.${day.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col mb-8 gap-4 px-2">
      <div className="flex flex-wrap items-end gap-6 relative">
        {/* Primary Element */}
        <div className="flex flex-col gap-2 w-36 relative z-30">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Primary Element
          </label>
          <Select 
            value={primaryElement}
            onChange={setPrimaryElement}
            options={PRIMARY_ELEMENTS}
            className="bg-zinc-100 dark:bg-zinc-800/50 border-transparent w-full text-base py-2.5 rounded-lg"
          />
        </div>

        {/* Secondary Element */}
        <div className="flex flex-col gap-2 w-36 relative z-20">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Secondary Element
          </label>
          <Select 
            value={secondaryElement}
            onChange={setSecondaryElement}
            options={SECONDARY_ELEMENTS}
            className="bg-zinc-100 dark:bg-zinc-800/50 border-transparent w-full text-base py-2.5 rounded-lg"
          />
        </div>

        {/* Time Period */}
        <div className="flex flex-col gap-2 w-64 ml-4">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Time Period
          </label>
          <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-full px-4 py-2 border border-transparent dark:border-zinc-800 flex items-center h-[46px]">
            <RangeSlider 
              min={1.01} 
              max={12.31} 
              value={timePeriod} 
              onChange={setTimePeriod}
              formatLabel={formatTimeLabel}
              className="mt-1"
            />
          </div>
        </div>

        {/* Settings Toggle */}
        <div className="flex flex-col gap-2 relative">
           <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 invisible">
             Setting {/* Invisible label for alignment */}
           </label>
           <button 
             onClick={() => setShowSettings(!showSettings)}
             className="w-[46px] h-[46px] flex items-center justify-center rounded-xl bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 transition-colors border border-transparent"
             aria-label="Settings"
           >
             <Settings className="w-6 h-6 hover:rotate-90 transition-transform duration-300" strokeWidth={1.5} />
           </button>

           {/* Dropdown Settings Panel */}
           {showSettings && (
             <div className="absolute top-full left-0 mt-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-4 z-40 flex items-center gap-6 animate-in fade-in slide-in-from-top-4">
               
               <div className="flex flex-col gap-3 w-40">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Classification Fineness</span>
                  <div className="px-2">
                    <RangeSlider min={0} max={100} value={[0, fineness[1]]} onChange={(v) => setFineness([0, v[1]])} />
                  </div>
               </div>

               <div className="w-px h-12 bg-zinc-200 dark:bg-zinc-800" />

               <div className="flex flex-col gap-3 w-40">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Memory Display Count</span>
                  <div className="px-2">
                    <RangeSlider min={0} max={100} value={[0, displayCount[1]]} onChange={(v) => setDisplayCount([0, v[1]])} />
                  </div>
               </div>

               <div className="w-px h-12 bg-zinc-200 dark:bg-zinc-800" />

               <div className="flex items-center gap-4">
                 <div className="flex flex-col items-center gap-2">
                   <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Key Words</span>
                   <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                    <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-zinc-900 dark:peer-checked:bg-zinc-100"></div>
                  </label>
                 </div>

                 <button className="flex flex-col items-center gap-2 group p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                    <RefreshCw className="w-5 h-5 text-blue-500 group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-[10px] font-semibold text-zinc-500">Renew</span>
                 </button>
               </div>

             </div>
           )}
        </div>
      </div>
    </div>
  );
}
