import React from 'react';

export function TimelineCoordinateView() {
  return (
    <div className="flex flex-col gap-6 w-full p-8 overflow-x-auto select-none pointer-events-none opacity-80">
      
      {/* Top Controls mock */}
      <h3 className="text-xl font-bold">Elements Choosing (Timeline Mode)</h3>

      {/* Axis Area */}
      <div className="relative h-96 w-full min-w-[800px] mt-12 bg-[url('/grid.svg')] dark:bg-none">
         {/* Y Axis line */}
         <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-zinc-400 dark:bg-zinc-600">
           <div className="absolute -top-2 -left-[5px] border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-zinc-400 dark:border-b-zinc-600" />
         </div>

         {/* X Axis line */}
         <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-zinc-400 dark:bg-zinc-600">
            <div className="absolute -right-2 -top-[5px] border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-zinc-400 dark:border-l-zinc-600" />
         </div>

         {/* Axis Labels */}
         <div className="absolute top-1/4 left-1/2 -ml-10 px-3 py-1 bg-white dark:bg-zinc-900 border-2 border-zinc-400 dark:border-zinc-600 rounded-full font-bold text-sm">Working</div>
         <div className="absolute bottom-1/4 left-1/2 -ml-9 px-3 py-1 bg-white dark:bg-zinc-900 border-2 border-zinc-400 dark:border-zinc-600 rounded-full font-bold text-sm">Resting</div>

         {/* X Axis Markers */}
         <div className="absolute top-1/2 -mt-4 flex w-full justify-around px-12">
           {['8:00', '10:00', '11:00', '12:00', '14:00', '16:00', '18:00', '21:00'].map(t => (
             <div key={t} className="px-3 py-1 bg-white dark:bg-zinc-900 border-2 border-zinc-400 dark:border-zinc-600 rounded-full font-bold text-sm z-10 relative shadow-sm">{t}</div>
           ))}
         </div>

         {/* Event Blocks Mockups */}
         <div className="absolute top-4 left-[5%] w-24 h-16 border-4 border-zinc-800 dark:border-zinc-100 bg-zinc-200 dark:bg-zinc-700 shadow-lg" />
         <div className="absolute top-12 left-[18%] w-20 h-14 border border-zinc-400 dark:border-zinc-600 bg-zinc-200/80 dark:bg-zinc-700/80" />
         
         <div className="absolute bottom-[10%] left-[25%] w-32 h-20 border-4 border-zinc-800 dark:border-zinc-100 bg-zinc-200 dark:bg-zinc-700 shadow-lg" />
         <div className="absolute top-[20%] right-[15%] w-24 h-16 border-4 border-zinc-800 dark:border-zinc-100 bg-zinc-200 dark:bg-zinc-700 shadow-lg" />

         <div className="absolute bottom-8 right-[25%] w-32 h-24 border border-zinc-400 dark:border-zinc-600 bg-zinc-200/80 dark:bg-zinc-700/80" />
         <div className="absolute top-8 right-[40%] w-24 h-20 border border-zinc-400 dark:border-zinc-600 bg-zinc-200/80 dark:bg-zinc-700/80" />
      </div>
    </div>
  );
}
