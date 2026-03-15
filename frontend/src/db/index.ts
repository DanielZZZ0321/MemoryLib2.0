import Dexie, { Table } from 'dexie';
import type { EventExtended, VideoMeta, Tag } from '../types/event';

export class MemoryLibDB extends Dexie {
  events!: Table<EventExtended>;
  videos!: Table<VideoMeta>;
  tags!: Table<Tag>;

  constructor() {
    super('MemoryLibDB');
    this.version(1).stores({
      events: 'id, videoId, eventIndex, *tags',
      videos: 'id, filename, importedAt',
      tags: 'id, name',
    });
  }
}

export const db = new MemoryLibDB();
