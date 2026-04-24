/**
 * DataPanel - Left panel for data organization and event management
 *
 * Features:
 * - Three-layer zoom structure (Overview -> Category Detail -> Event Edit)
 * - Event filtering and search
 * - Drag and drop support for events
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Network,
} from 'lucide-react';
import { useEventStore } from '@/stores/eventStore';
import { useUIStore } from '@/stores/uiStore';
import { EventCard } from '@/components/events/EventCard';
import { EventEditor } from '@/components/events/EventEditor';
import { JSONUploader } from '@/components/events/JSONUploader';
import type { EventExtended } from '@/types/event';
import { cn } from '@/lib/utils';

export function DataPanel() {
  const events = useEventStore((state) => state.events);
  const selectedEventId = useEventStore((state) => state.selectedEventId);
  const selectEvent = useEventStore((state) => state.selectEvent);

  const panelZoomLevel = useUIStore((state) => state.panelZoomLevel);
  const setPanelZoomLevel = useUIStore((state) => state.setPanelZoomLevel);
  const panelLayout = useUIStore((state) => state.panelLayout);
  const setPanelLayout = useUIStore((state) => state.setPanelLayout);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter events based on search
  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;

    const query = searchQuery.toLowerCase();
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        event.summary.toLowerCase().includes(query) ||
        event.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [events, searchQuery]);

  // Group events by category/tags for graph view
  const groupedEvents = useMemo(() => {
    const groups: Record<string, EventExtended[]> = {};

    filteredEvents.forEach((event) => {
      // Use tags as categories
      if (event.tags.length > 0) {
        event.tags.forEach((tag) => {
          if (!groups[tag]) groups[tag] = [];
          groups[tag].push(event);
        });
      } else {
        if (!groups['Uncategorized']) groups['Uncategorized'] = [];
        groups['Uncategorized'].push(event);
      }
    });

    return groups;
  }, [filteredEvents]);

  // Handle event drag start
  const handleDragStart = (e: React.DragEvent, event: EventExtended) => {
    e.dataTransfer.setData('type', 'event-card');
    e.dataTransfer.setData('eventId', event.id);
    e.dataTransfer.setData('eventData', JSON.stringify(event));
  };

  // Show empty state if no events
  if (events.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="font-semibold text-sm">Data Panel</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <JSONUploader />
        </div>
      </div>
    );
  }

  // Zoom Level 3: Event Detail View
  if (panelZoomLevel === 3 && selectedEventId) {
    const selectedEvent = events.find((e) => e.id === selectedEventId);
    if (selectedEvent) {
      return (
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
            <button
              onClick={() => setPanelZoomLevel(2)}
              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="font-semibold text-sm truncate">
              {selectedEvent.userTitle || selectedEvent.title}
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <EventEditor />
          </div>
        </div>
      );
    }
  }

  // Zoom Level 2: Category Detail View
  if (panelZoomLevel === 2 && selectedCategory) {
    const categoryEvents = groupedEvents[selectedCategory] || [];
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <button
            onClick={() => {
              setPanelZoomLevel(1);
              setSelectedCategory(null);
            }}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="font-semibold text-sm">{selectedCategory}</h2>
          <span className="text-xs text-zinc-500">({categoryEvents.length} events)</span>
        </div>

        {/* Search for this category */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg focus:ring-2 focus:ring-blue-500/30 outline-none"
            />
          </div>
        </div>

        {/* Events list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {categoryEvents.map((event) => (
            <div
              key={event.id}
              draggable
              onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, event)}
              onClick={() => {
                selectEvent(event.id);
                setPanelZoomLevel(3);
              }}
              className="cursor-grab active:cursor-grabbing"
            >
              <EventCard event={event} onClick={() => {}} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Zoom Level 1: Overview (default)
  return (
    <div className="h-full flex flex-col">
      {/* Header with search and layout toggle */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Data Panel</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPanelLayout('graph')}
              className={cn(
                'p-1.5 rounded transition-colors',
                panelLayout === 'graph'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400'
              )}
              title="Graph View"
              >
                <Network className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPanelLayout('grid')}
              className={cn(
                'p-1.5 rounded transition-colors',
                panelLayout === 'grid'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400'
              )}
              title="Grid View"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPanelLayout('list')}
              className={cn(
                'p-1.5 rounded transition-colors',
                panelLayout === 'list'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                  : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400'
              )}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg focus:ring-2 focus:ring-blue-500/30 outline-none"
          />
        </div>
      </div>

      {/* Content based on layout */}
      <div className="flex-1 overflow-y-auto">
        {panelLayout === 'graph' && (
          <GraphView
            groupedEvents={groupedEvents}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setPanelZoomLevel(2);
            }}
          />
        )}

        {panelLayout === 'grid' && (
          <GridView
            events={filteredEvents}
            onDragStart={handleDragStart}
            onSelectEvent={(id) => {
              selectEvent(id);
              setPanelZoomLevel(3);
            }}
          />
        )}

        {panelLayout === 'list' && (
          <ListView
            events={filteredEvents}
            onDragStart={handleDragStart}
            onSelectEvent={(id) => {
              selectEvent(id);
              setPanelZoomLevel(3);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Graph View Component
interface GraphViewProps {
  groupedEvents: Record<string, EventExtended[]>;
  onSelectCategory: (category: string) => void;
}

function GraphView({ groupedEvents, onSelectCategory }: GraphViewProps) {
  const categories = Object.entries(groupedEvents).sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="p-4">
      <div className="flex flex-wrap gap-3 justify-center">
        {categories.map(([category, events]) => {
          const count = events.length;
          const size = Math.min(Math.max(count * 10 + 60, 80), 150);

          return (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectCategory(category)}
              className="flex flex-col items-center justify-center rounded-full bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 hover:border-blue-400 hover:shadow-lg transition-all p-4"
              style={{ width: size, height: size }}
            >
              <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate max-w-full">
                {category}
              </span>
              <span className="text-xs text-zinc-500 mt-1">{count}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// Grid View Component
interface GridViewProps {
  events: EventExtended[];
  onDragStart: (e: React.DragEvent, event: EventExtended) => void;
  onSelectEvent: (id: string) => void;
}

function GridView({ events, onDragStart, onSelectEvent }: GridViewProps) {
  return (
    <div className="p-3 grid grid-cols-2 gap-3">
      {events.map((event) => (
        <div
          key={event.id}
          draggable
          onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, event)}
          onClick={() => onSelectEvent(event.id)}
          className="cursor-grab active:cursor-grabbing hover:scale-[1.02] transition-transform"
        >
          <div className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 hover:border-blue-400 transition-colors">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {event.userTitle || event.title}
            </h4>
            <p className="text-xs text-zinc-500 mt-1">
              {event.startHms} - {event.endHms}
            </p>
            {event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {event.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// List View Component
interface ListViewProps {
  events: EventExtended[];
  onDragStart: (e: React.DragEvent, event: EventExtended) => void;
  onSelectEvent: (id: string) => void;
}

function ListView({ events, onDragStart, onSelectEvent }: ListViewProps) {
  return (
    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {events.map((event) => (
        <div
          key={event.id}
          draggable
          onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, event)}
          onClick={() => onSelectEvent(event.id)}
          className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-grab active:cursor-grabbing flex items-start gap-3"
        >
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {event.userTitle || event.title}
            </h4>
            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
              {event.userSummary || event.summary}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-zinc-400">{event.startHms}</span>
              {event.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-1" />
        </div>
      ))}
    </div>
  );
}
