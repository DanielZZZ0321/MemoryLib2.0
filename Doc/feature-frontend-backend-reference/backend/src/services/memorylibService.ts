/**
 * MemoryLib 璇诲啓鏈嶅姟 - 渚涜矾鐢卞拰 chat 宸ュ叿璋冪敤鍏辩敤
 */
import fs from 'fs';
import path from 'path';

const MEMORYLIBS_DIR = path.join(__dirname, '../../../data/memorylibs');

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
  media?: Array<{ type: string; url: string; caption?: string; duration?: number }>;
}

export interface MemoryLibData {
  title?: string;
  dateRange?: string;
  color?: string;
  year?: number;
  events?: MemoryLibEvent[];
}

function safeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, '');
}

export function getMemoryLib(id: string): MemoryLibData | null {
  const filePath = path.join(MEMORYLIBS_DIR, `${safeId(id)}.json`);
  try {
    if (!fs.existsSync(filePath)) return null;
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data) as MemoryLibData;
  } catch {
    return null;
  }
}

export function updateMemoryLib(
  id: string,
  updates: Partial<Pick<MemoryLibData, 'events' | 'title' | 'dateRange' | 'color' | 'year'>>
): MemoryLibData | null {
  const current = getMemoryLib(id);
  if (!current) return null;
  const merged = { ...current, ...updates };
  const filePath = path.join(MEMORYLIBS_DIR, `${safeId(id)}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify(merged, null, 2), 'utf-8');
    return merged;
  } catch {
    return null;
  }
}
