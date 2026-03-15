import { useEffect } from 'react';
import { useEventStore } from '@/stores/eventStore';
import { EventCard } from './EventCard';
import { JSONUploader } from './JSONUploader';

export function EventList() {
  const events = useEventStore((state) => state.events);
  const loadEvents = useEventStore((state) => state.loadEvents);
  const selectEvent = useEventStore((state) => state.selectEvent);

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {events.map(event => (
        <EventCard 
          key={event.id} 
          event={event} 
          onClick={() => selectEvent(event.id)} 
        />
      ))}
    </div>
  );
}
