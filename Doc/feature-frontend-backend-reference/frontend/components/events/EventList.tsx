import { useEffect, useState } from 'react';
import { useEventStore } from '../../stores/eventStore';
import { EventCard } from './EventCard';
import { JSONUploader } from './JSONUploader';

export function EventList() {
  const events = useEventStore((state) => state.events);
  const loadEvents = useEventStore((state) => state.loadEvents);
  const selectEvent = useEventStore((state) => state.selectEvent);
  const syncToMemoryCore = useEventStore((state) => state.syncToMemoryCore);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  if (events.length === 0) {
    return (
      <div className="max-w-2xl mx-auto pt-20">
        <JSONUploader />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-end">
        <button
          type="button"
          disabled={syncBusy}
          onClick={async () => {
            setSyncMsg(null);
            setSyncBusy(true);
            try {
              const r = await syncToMemoryCore();
              const evCount = (r as { events?: unknown[] })?.events?.length ?? events.length;
              setSyncMsg(`宸插悓姝ュ埌 memory-core锛?{evCount} 鏉′簨浠讹級`);
            } catch (e) {
              setSyncMsg(e instanceof Error ? e.message : '鍚屾澶辫触');
            } finally {
              setSyncBusy(false);
            }
          }}
          className="text-sm px-3 py-1.5 rounded-lg bg-amber-600/90 hover:bg-amber-500 text-zinc-950 font-medium disabled:opacity-50"
        >
          {syncBusy ? '鍚屾涓€? : '鍚屾鍒?Memory Core'}
        </button>
        {syncMsg && <span className="text-xs text-zinc-400 max-w-md text-right">{syncMsg}</span>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {events.map(event => (
        <EventCard
          key={event.id}
          event={event}
          onClick={() => selectEvent(event.id)}
        />
      ))}
      </div>
    </div>
  );
}
