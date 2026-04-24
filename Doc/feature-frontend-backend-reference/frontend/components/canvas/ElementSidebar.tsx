import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, GripVertical, Clock, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import type { EventExtended } from '../../types/event';

interface ElementSidebarProps {
  events: EventExtended[];
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  onAddEventCard: (eventId: string) => void;
}

export function ElementSidebar({
  events,
  selectedEventId,
  onSelectEvent,
}: ElementSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['today', 'this-week'])
  );

  const filteredEvents = events.filter((event) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const tags = event.tags ?? [];
    return (
      event.title.toLowerCase().includes(query) ||
      event.summary.toLowerCase().includes(query) ||
      tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  const groupedEvents = groupEventsByDate(filteredEvents);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData('eventId', eventId);
    e.dataTransfer.setData('type', 'event-card');
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleMediaDragStart = (e: React.DragEvent | React.MouseEvent, mediaUrl: string, mediaType: 'image' | 'video') => {
    const ev = e as React.DragEvent;
    if (ev.dataTransfer) {
      ev.dataTransfer.setData('mediaUrl', mediaUrl);
      ev.dataTransfer.setData('mediaType', mediaType);
      ev.dataTransfer.setData('type', 'media');
      ev.dataTransfer.effectAllowed = 'copy';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Events</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-100"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedEvents).map(([category, categoryEvents]) => (
          <div key={category} className="border-b border-zinc-100 dark:border-zinc-800">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {expandedCategories.has(category) ? (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                )}
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 capitalize">
                  {category.replace('-', ' ')}
                </span>
              </div>
              <span className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                {categoryEvents.length}
              </span>
            </button>
            {expandedCategories.has(category) && (
              <div className="pb-2">
                {categoryEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, event.id)}
                    onClick={() => onSelectEvent(event.id)}
                    className={`mx-2 mb-2 rounded-lg cursor-pointer transition-all border-2 ${
                      selectedEventId === event.id
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 shadow-md'
                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 shadow-sm'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {(event.media ?? []).length > 0 ? (
                      <div className="flex gap-1 p-2 overflow-x-auto">
                        {event.media!.slice(0, 4).map((media, idx) => (
                          <div
                            key={idx}
                            className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-900 cursor-grab"
                            draggable
                            onDragStart={(e) => handleMediaDragStart(e as React.DragEvent, media.url, media.type)}
                          >
                            {media.type === 'image' ? (
                              <img src={media.url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                <span className="text-xs text-white">瑙嗛</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : event.mediaUrl ? (
                      <div
                        className="w-full h-24 bg-zinc-100 dark:bg-zinc-900 rounded-t-lg overflow-hidden cursor-grab"
                        draggable
                        onDragStart={(e) =>
                          handleMediaDragStart(e as React.DragEvent, event.mediaUrl!, event.mediaType || 'image')
                        }
                      >
                        {event.mediaType === 'image' ? (
                          <img src={event.mediaUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                            <span className="text-xs text-white">瑙嗛</span>
                          </div>
                        )}
                      </div>
                    ) : null}
                    <div className="p-3">
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-zinc-300 dark:text-zinc-600 mt-0.5 flex-shrink-0 cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {event.userTitle || event.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-zinc-400" />
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">
                              {event.startHms} - {event.endHms}
                            </span>
                          </div>
                          {(event.tags ?? []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {(event.tags ?? []).slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ))}
        {filteredEvents.length === 0 && (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {searchQuery ? 'No events found' : 'No events available'}
            </p>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
        <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
          Drag events to the canvas or click to select
        </p>
      </div>
    </div>
  );
}

function groupEventsByDate(events: EventExtended[]): Record<string, EventExtended[]> {
  const groups: Record<string, EventExtended[]> = {};
  events.forEach((event) => {
    let category = 'recent';
    if (event.createdAt) {
      const diffDays = Math.floor(
        (Date.now() - new Date(event.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 0) category = 'today';
      else if (diffDays <= 7) category = 'this-week';
      else if (diffDays <= 30) category = 'this-month';
      else category = 'older';
    }
    if (!groups[category]) groups[category] = [];
    groups[category].push(event);
  });
  Object.keys(groups).forEach((k) => groups[k].sort((a, b) => a.startSec - b.startSec));
  return groups;
}
