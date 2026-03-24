/**
 * Event Editor Popup - Full-featured event editor with overview and edit modes
 * Supports: video, audio, photos, notes, summary, metadata
 */
import { useState } from 'react';
import { X, Clock, Tag, FileText, Image, Video, Music, Edit3, Eye } from 'lucide-react';
import type { MemoryLibEvent } from './EventNodeCard';

export interface MediaItem {
  type: 'image' | 'video' | 'audio';
  url: string;
  caption?: string;
  duration?: number;
}

export interface EventEditorData extends Omit<MemoryLibEvent, 'media'> {
  media?: MediaItem[];
  notes?: string;
  start_sec?: number;
  end_sec?: number;
  metadata?: Record<string, string>;
}

interface EventEditorPopupProps {
  event: EventEditorData;
  eventIndex: number;
  accent: string;
  onClose: () => void;
  onSave?: (event: EventEditorData) => void;
}

export function EventEditorPopup({ event: initialEvent, eventIndex, accent, onClose, onSave }: EventEditorPopupProps) {
  const [event, setEvent] = useState<EventEditorData>({
    ...initialEvent,
    media: initialEvent.media ?? [],
    notes: initialEvent.notes ?? '',
    metadata: initialEvent.metadata ?? {},
  });
  const [mode, setMode] = useState<'overview' | 'edit'>('overview');

  const update = (patch: Partial<EventEditorData>) => {
    setEvent((e) => ({ ...e, ...patch }));
  };

  const videos = event.media?.filter((m) => m.type === 'video') ?? [];
  const audios = event.media?.filter((m) => m.type === 'audio') ?? [];
  const photos = event.media?.filter((m) => m.type === 'image') ?? [];

  const handleSave = () => {
    onSave?.(event);
    setMode('overview');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: 'min(90vw, 560px)', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0"
          style={{ background: `linear-gradient(135deg, ${accent}20, transparent)` }}
        >
          <h2 className="font-semibold text-slate-100 text-lg truncate pr-4">{event.title}</h2>
          <div className="flex items-center gap-2 shrink-0">
            {/* Overview / Edit 切换 */}
            <div className="flex rounded-lg bg-slate-800/80 border border-slate-600 p-0.5">
              <button
                type="button"
                onClick={() => setMode('overview')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  mode === 'overview'
                    ? 'bg-slate-700 text-slate-100'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-4 h-4" />
                概览
              </button>
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  mode === 'edit'
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                style={mode === 'edit' ? { background: accent } : {}}
              >
                <Edit3 className="w-4 h-4" />
                编辑
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Metadata */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" /> 元数据
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {mode === 'edit' ? (
                <>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">标题</label>
                    <input
                      type="text"
                      value={event.title}
                      onChange={(e) => update({ title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">开始时间</label>
                    <input
                      type="text"
                      value={event.start_hms}
                      onChange={(e) => update({ start_hms: e.target.value })}
                      placeholder="09:00"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">结束时间</label>
                    <input
                      type="text"
                      value={event.end_hms}
                      onChange={(e) => update({ end_hms: e.target.value })}
                      placeholder="09:30"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">标签 (逗号分隔)</label>
                    <input
                      type="text"
                      value={(event.tags ?? []).join(', ')}
                      onChange={(e) =>
                        update({
                          tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                        })
                      }
                      placeholder="People, Emotion"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </>
              ) : (
                <div className="col-span-2 flex flex-wrap gap-2 text-sm">
                  <span className="text-slate-400">事件 #{eventIndex + 1}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">{event.start_hms} – {event.end_hms}</span>
                  {event.tags && event.tags.length > 0 && (
                    <>
                      <span className="text-slate-500">·</span>
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {event.tags.join(', ')}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Summary */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" /> 摘要
            </h3>
            {mode === 'edit' ? (
              <textarea
                value={event.summary}
                onChange={(e) => update({ summary: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y"
                placeholder="事件描述..."
              />
            ) : (
              <p className="text-slate-300 text-sm leading-relaxed">{event.summary || '—'}</p>
            )}
          </section>

          {/* Notes */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" /> 笔记
            </h3>
            {mode === 'edit' ? (
              <textarea
                value={event.notes ?? ''}
                onChange={(e) => update({ notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y"
                placeholder="补充笔记..."
              />
            ) : (
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{event.notes || '—'}</p>
            )}
          </section>

          {/* Video */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
              <Video className="w-3.5 h-3.5" /> 视频
            </h3>
            {videos.length > 0 ? (
              <div className="space-y-2">
                {videos.map((m, i) => (
                  <div key={i} className="rounded-lg overflow-hidden bg-slate-800 border border-slate-600">
                    <video
                      src={m.url}
                      controls
                      className="w-full max-h-48"
                    />
                    {mode === 'edit' && (
                      <div className="p-2 flex gap-2">
                        <input
                          type="text"
                          value={m.url}
                          onChange={(e) => {
                            const next = [...(event.media ?? [])];
                            const idx = next.findIndex((x) => x === m);
                            if (idx >= 0) next[idx] = { ...next[idx], url: e.target.value };
                            update({ media: next });
                          }}
                          placeholder="视频 URL"
                          className="flex-1 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-100 text-xs"
                        />
                        <input
                          type="text"
                          value={m.caption ?? ''}
                          onChange={(e) => {
                            const next = [...(event.media ?? [])];
                            const idx = next.findIndex((x) => x === m);
                            if (idx >= 0) next[idx] = { ...next[idx], caption: e.target.value };
                            update({ media: next });
                          }}
                          placeholder="说明"
                          className="flex-1 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-100 text-xs"
                        />
                      </div>
                    )}
                    {m.caption && mode === 'overview' && (
                      <p className="px-2 py-1 text-xs text-slate-500">{m.caption}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">{mode === 'edit' ? '暂无视频，可在 media 数组中添加 type: "video" 的项' : '暂无视频'}</p>
            )}
          </section>

          {/* Audio */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
              <Music className="w-3.5 h-3.5" /> 音频
            </h3>
            {audios.length > 0 ? (
              <div className="space-y-2">
                {audios.map((m, i) => (
                  <div key={i} className="rounded-lg bg-slate-800 border border-slate-600 p-3">
                    <audio src={m.url} controls className="w-full" />
                    {mode === 'edit' && (
                      <input
                        type="text"
                        value={m.url}
                        onChange={(e) => {
                          const next = [...(event.media ?? [])];
                          const idx = next.findIndex((x) => x === m);
                          if (idx >= 0) next[idx] = { ...next[idx], url: e.target.value };
                          update({ media: next });
                        }}
                        placeholder="音频 URL"
                        className="mt-2 w-full px-2 py-1 bg-slate-900 border border-slate-600 rounded text-slate-100 text-xs"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">{mode === 'edit' ? '暂无音频。在 media 中添加 type: "audio" 的项以显示' : '暂无音频'}</p>
            )}
          </section>

          {/* Photos */}
          <section className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
              <Image className="w-3.5 h-3.5" /> 照片
            </h3>
            {photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((m, i) => (
                  <div key={i} className="rounded-lg overflow-hidden bg-slate-800 border border-slate-600">
                    <img
                      src={m.url}
                      alt={m.caption ?? ''}
                      className="w-full aspect-square object-cover"
                    />
                    {(m.caption || mode === 'edit') && (
                      <div className="p-1.5">
                        {mode === 'edit' ? (
                          <input
                            type="text"
                            value={m.caption ?? ''}
                            onChange={(e) => {
                              const next = [...(event.media ?? [])];
                              const idx = next.findIndex((x) => x === m);
                              if (idx >= 0) next[idx] = { ...next[idx], caption: e.target.value };
                              update({ media: next });
                            }}
                            placeholder="说明"
                            className="w-full px-2 py-0.5 bg-slate-900 border border-slate-600 rounded text-slate-100 text-xs"
                          />
                        ) : (
                          <p className="text-xs text-slate-500 truncate">{m.caption}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">暂无照片</p>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-700 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-300 hover:text-slate-100 hover:bg-slate-700/50 transition-colors"
          >
            取消
          </button>
          {mode === 'edit' && (
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-white font-medium transition-colors"
              style={{ background: accent }}
            >
              保存
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
