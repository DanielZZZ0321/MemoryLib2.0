import { db } from '../db/database';
import {
  loadTimelineIndex,
  scoreSegmentsForQuery,
  resolveClipPath,
  type TimelineSegmentEntry,
} from './videoAssetService';
import { queryFullVideoVlm, querySegmentVlm } from './videoVlmService';

export function videoOwnedByUser(videoId: string, userId: number): boolean {
  const r = db.prepare('SELECT id FROM videos WHERE id = ? AND user_id = ?').get(videoId, userId) as { id: string } | undefined;
  return !!r;
}

export function getSourceVideoPath(videoId: string, userId: number): string | null {
  const r = db.prepare('SELECT source_ref FROM videos WHERE id = ? AND user_id = ?').get(videoId, userId) as
    | { source_ref: string }
    | undefined;
  return r?.source_ref ?? null;
}

export function searchTimelineForUser(videoId: string, userId: number, query: string): string {
  if (!videoOwnedByUser(videoId, userId)) return '错误：无权访问该视频或视频不存在。';
  const tl = loadTimelineIndex(videoId);
  if (!tl) return '未找到该视频的时间线索引。请先完成视频入库（ingest），或确认 data/video_assets 已生成。';
  const q = query.trim();
  if (!q) return '请提供搜索关键词或问题片段。';
  const scored = scoreSegmentsForQuery(tl, q);
  if (scored.length === 0) {
    return `时间线中未匹配到与「${q}」相关的片段。可改用「query_full_video_memory」对整段视频提问。`;
  }
  const top = scored.slice(0, 8);
  const lines = top.map(({ segment, score }, i) => {
    const range = `${(segment.start_ms / 1000).toFixed(1)}s–${(segment.end_ms / 1000).toFixed(1)}s`;
    return `${i + 1}. [event_id=${segment.eventId}] ${segment.title} (${range}) score=${score}\n   摘要: ${segment.summary.slice(0, 160)}${segment.summary.length > 160 ? '…' : ''}`;
  });
  return `共 ${scored.length} 个候选片段，以下为最相关的前 ${top.length} 个：\n${lines.join('\n')}`;
}

function findSegmentByEventId(videoId: string, eventId: string): TimelineSegmentEntry | null {
  const tl = loadTimelineIndex(videoId);
  if (!tl) return null;
  return tl.segments.find((s) => s.eventId === eventId) ?? null;
}

export function mineSegmentForUser(
  videoId: string,
  userId: number,
  eventId: string,
  question: string
): string {
  if (!videoOwnedByUser(videoId, userId)) return '错误：无权访问该视频。';
  const seg = findSegmentByEventId(videoId, eventId.trim());
  if (!seg) return `未找到事件 ${eventId}，请先用 search_video_timeline 查看有效 event_id。`;
  const clip = resolveClipPath(videoId, seg);
  if (!clip) {
    return `片段 ${eventId} 没有可用的切片文件（可能未安装 ffmpeg 或切片失败）。请使用 query_full_video_memory 对整段视频提问。`;
  }
  const q = question.trim();
  if (!q) return '请提供具体问题。';
  const r = querySegmentVlm(clip, q);
  if (!r.ok) return `VLM 片段分析失败：${r.error}`;
  return r.text;
}

export function queryFullVideoForUser(videoId: string, userId: number, question: string): string {
  if (!videoOwnedByUser(videoId, userId)) return '错误：无权访问该视频。';
  const src = getSourceVideoPath(videoId, userId);
  if (!src) return '找不到原始视频文件路径。';
  const q = question.trim();
  if (!q) return '请提供具体问题。';
  const r = queryFullVideoVlm(src, q);
  if (!r.ok) return `整段视频 VLM 查询失败：${r.error}`;
  return r.text;
}
