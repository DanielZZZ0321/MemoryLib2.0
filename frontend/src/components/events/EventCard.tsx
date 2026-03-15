import { Clock, Tag as TagIcon, GripVertical } from 'lucide-react';
import type { EventExtended } from '@/types/event';

interface EventCardProps {
  event: EventExtended;
  onClick: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, event: EventExtended) => void;
}

export function EventCard({ event, onClick, draggable = true, onDragStart }: EventCardProps) {

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('eventData', JSON.stringify(event));
    e.dataTransfer.setData('type', 'event-card');
    e.dataTransfer.setData('eventId', event.id);
    e.dataTransfer.effectAllowed = 'copy';

    // Call custom onDragStart if provided
    onDragStart?.(e, event);

    // Create custom drag image
    const dragPreview = document.createElement('div');
    dragPreview.className = 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 shadow-lg';
    dragPreview.textContent = event.userTitle || event.title;
    dragPreview.style.position = 'absolute';
    dragPreview.style.top = '-1000px';
    document.body.appendChild(dragPreview);
    e.dataTransfer.setDragImage(dragPreview, 0, 0);
    setTimeout(() => document.body.removeChild(dragPreview), 0);
  };
  const renderMediaHeader = () => {
    const hasMediaUrl = event.mediaUrl;
    const hasMediaArray = event.media && event.media.length > 0;
    const firstMedia = hasMediaArray && event.media ? event.media[0] : null;

    if (!hasMediaUrl && !hasMediaArray) return null;

    // If has media array with multiple items, show gallery
    if (hasMediaArray && event.media && event.media.length > 1) {
      return (
        <div className="w-full h-32 bg-zinc-100 dark:bg-zinc-950 flex-shrink-0 relative overflow-hidden flex gap-1">
          {event.media.slice(0, 4).map((m, idx) => (
            <div key={idx} className="flex-1 relative overflow-hidden">
              {m.type === 'image' ? (
                <img
                  src={m.url}
                  alt={m.caption || 'Event Media'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video src={m.url} className="w-full h-full object-cover" muted loop playsInline />
              )}
              {/* Show "+N" indicator if more than 4 items */}
              {idx === 3 && event.media && event.media.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-medium text-sm">
                  +{event.media.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Single media item (legacy or new format)
    return (
      <div className="w-full h-32 bg-zinc-100 dark:bg-zinc-950 flex-shrink-0 relative overflow-hidden">
        {hasMediaArray && firstMedia ? (
          firstMedia.type === 'image' ? (
            <img
              src={firstMedia.url}
              alt={firstMedia.caption || 'Event Media'}
              className="w-full h-full object-cover"
            />
          ) : (
            <video src={firstMedia.url} className="w-full h-full object-cover" muted loop playsInline />
          )
        ) : (
          event.mediaType === 'image' ? (
            <img src={event.mediaUrl} alt="Event Media" className="w-full h-full object-cover" />
          ) : (
            <video src={event.mediaUrl} className="w-full h-full object-cover" muted loop playsInline />
          )
        )}
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      draggable={draggable}
      onDragStart={handleDragStart}
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-0 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-sm hover:shadow-md dark:shadow-lg dark:hover:shadow-xl overflow-hidden flex flex-col group relative hover:-translate-y-1 hover:scale-[1.01] active:scale-[0.98] transform transition-transform"
    >
      {/* Drag handle indicator */}
      {draggable && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded p-1">
            <GripVertical className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {renderMediaHeader()}

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-3">
          <h4 className="text-zinc-900 dark:text-zinc-100 font-semibold text-lg line-clamp-1">
          {event.userTitle || event.title}
        </h4>
        <div className="flex items-center text-xs text-zinc-600 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/50 px-2 py-1 rounded-md shrink-0 ml-3">
          <Clock className="w-3 h-3 mr-1" />
          {event.startHms} - {event.endHms}
        </div>
      </div>
      
      <p className="text-zinc-600 dark:text-zinc-400 text-sm line-clamp-3 mb-4 flex-1">
        {event.userSummary || event.summary}
      </p>

      {event.tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {event.tags.map(tag => (
            <span key={tag} className="flex items-center text-xs px-2 py-1 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20">
              <TagIcon className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <div className="h-6" /* Placeholder to maintain height */ />
      )}
      </div>
    </div>
  );
}
