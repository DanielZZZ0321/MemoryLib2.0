import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Clock } from 'lucide-react';
import { useEventStore } from '@/stores/eventStore';

export function EventEditor() {
  const selectedEventId = useEventStore((state) => state.selectedEventId);
  const events = useEventStore((state) => state.events);
  const updateEvent = useEventStore((state) => state.updateEvent);
  const selectEvent = useEventStore((state) => state.selectEvent);

  const event = events.find((e) => e.id === selectedEventId);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.userTitle || event.title);
      setSummary(event.userSummary || event.summary);
      setNotes(event.notes || '');
    }
  }, [event]);

  const handleSave = async () => {
    if (!event) return;
    await updateEvent(event.id, {
      userTitle: title !== event.title ? title : null,
      userSummary: summary !== event.summary ? summary : null,
      notes,
    });
    selectEvent(null);
  };

  return (
    <AnimatePresence>
      {selectedEventId && event && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => selectEvent(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Slide-over panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Edit Event</h3>
              <button 
                onClick={() => selectEvent(null)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500 dark:text-zinc-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Area - Support both legacy (mediaUrl) and new (media[]) formats */}
            {(event.mediaUrl || (event.media && event.media.length > 0)) && (
              <div className="w-full bg-zinc-100 dark:bg-black border-b border-zinc-200 dark:border-zinc-800 relative">
                {event.media && event.media.length > 0 ? (
                  // Multi-media gallery
                  event.media.length > 1 ? (
                    <div className="grid grid-cols-2 gap-1 p-1 max-h-80 overflow-y-auto">
                      {event.media.map((m, idx) => (
                        <div key={idx} className="relative">
                          {m.type === 'image' ? (
                            <img
                              src={m.url}
                              alt={m.caption || `Media ${idx + 1}`}
                              className="w-full h-32 object-cover rounded"
                            />
                          ) : (
                            <video
                              src={m.url}
                              controls
                              className="w-full h-32 object-cover rounded"
                            />
                          )}
                          {m.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                              {m.caption}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Single media item
                    event.media[0].type === 'image' ? (
                      <img src={event.media[0].url} alt={event.media[0].caption || 'Media'} className="w-full max-h-64 object-contain" />
                    ) : (
                      <video src={event.media[0].url} controls className="w-full max-h-64 object-contain" />
                    )
                  )
                ) : (
                  // Legacy format: single mediaUrl
                  event.mediaType === 'image' ? (
                    <img src={event.mediaUrl} alt="Media" className="w-full max-h-64 object-contain" />
                  ) : (
                    <video src={event.mediaUrl} controls className="w-full max-h-64 object-contain" />
                  )
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Timing */}
              <div className="flex items-center text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 p-3 rounded-lg">
                <Clock className="w-4 h-4 mr-2" />
                <span>{event.startHms} - {event.endHms}</span>
                <span className="ml-auto text-xs opacity-50">Idx: {event.eventIndex}</span>
              </div>

              {/* Title Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={event.title}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 shadow-sm"
                />
                {event.userTitle && (
                  <p className="text-xs text-zinc-500">AI Original: {event.title}</p>
                )}
              </div>

              {/* Summary Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Summary</label>
                <textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder={event.summary}
                  rows={6}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-y shadow-sm"
                />
              </div>

              {/* Notes Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Personal Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your own notes here..."
                  rows={4}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-y shadow-sm"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 flex justify-end gap-3">
              <button
                onClick={() => selectEvent(null)}
                className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-md transition-colors shadow-lg shadow-blue-900/20"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
