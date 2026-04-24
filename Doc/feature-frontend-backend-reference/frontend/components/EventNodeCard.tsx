/**
 * Event Node Card - Compact event module for concept graph nodes
 * Matches the event-block style from memorylib (event card form)
 */
import { Clock, Tag as TagIcon } from 'lucide-react';

export interface MemoryLibEvent {
  event_index: number;
  start_sec?: number;
  end_sec?: number;
  start_hms: string;
  end_hms: string;
  title: string;
  summary: string;
  tags?: string[];
  notes?: string;
  media?: Array<{ type: 'image' | 'video' | 'audio'; url: string; caption?: string; duration?: number }>;
}

interface EventNodeCardProps {
  event: MemoryLibEvent;
  accent: string;
  isCenter?: boolean;
  onClick?: () => void;
}

export function EventNodeCard({ event, accent, isCenter, onClick }: EventNodeCardProps) {
  const hasMedia = event.media && event.media.length > 0;
  const firstMedia = hasMedia ? event.media![0] : null;

  return (
    <div
      className="event-node-card cursor-pointer hover:opacity-90 transition-opacity"
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      style={{
        minWidth: isCenter ? 160 : 140,
        maxWidth: isCenter ? 200 : 180,
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%)',
        border: `1px solid ${accent}40`,
        boxShadow: `0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px ${accent}20`,
      }}
    >
      {hasMedia && firstMedia && (
        <div className="h-20 overflow-hidden flex-shrink-0">
          {firstMedia.type === 'image' ? (
            <img
              src={firstMedia.url}
              alt={firstMedia.caption || event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              src={firstMedia.url}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
            />
          )}
        </div>
      )}
      <div className="p-2 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h4
            className="event-block-title font-semibold text-sm text-slate-100 line-clamp-1 flex-1"
            style={{ fontSize: isCenter ? 13 : 12 }}
          >
            {event.title}
          </h4>
          <div className="flex items-center text-[10px] text-slate-400 shrink-0">
            <Clock className="w-2.5 h-2.5 mr-0.5" />
            {event.start_hms}
          </div>
        </div>
        <p className="event-block-desc text-[10px] text-slate-400 line-clamp-2 leading-tight">
          {event.summary}
        </p>
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {event.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center text-[9px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300"
              >
                <TagIcon className="w-2.5 h-2.5 mr-0.5" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
