import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.db');
export const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    source_type TEXT NOT NULL,
    source_ref TEXT NOT NULL,
    filename TEXT,
    size INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    metadata_json TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
  CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);

  CREATE TABLE IF NOT EXISTS video_segments (
    id TEXT PRIMARY KEY,
    video_id TEXT NOT NULL,
    start_ms INTEGER NOT NULL,
    end_ms INTEGER NOT NULL,
    summary TEXT,
    tags_json TEXT,
    raw_json TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(video_id) REFERENCES videos(id)
  );
  CREATE INDEX IF NOT EXISTS idx_video_segments_video_id ON video_segments(video_id);

  CREATE TABLE IF NOT EXISTS events_global (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    video_id TEXT,
    start_ms INTEGER,
    end_ms INTEGER,
    title TEXT NOT NULL,
    summary TEXT,
    tags_json TEXT,
    media_refs_json TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(video_id) REFERENCES videos(id)
  );
  CREATE INDEX IF NOT EXISTS idx_events_global_user_id ON events_global(user_id);
  CREATE INDEX IF NOT EXISTS idx_events_global_video_id ON events_global(video_id);

  CREATE TABLE IF NOT EXISTS themes (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    score REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE INDEX IF NOT EXISTS idx_themes_user_id ON themes(user_id);

  CREATE TABLE IF NOT EXISTS theme_event (
    theme_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    weight REAL DEFAULT 1,
    PRIMARY KEY(theme_id, event_id),
    FOREIGN KEY(theme_id) REFERENCES themes(id),
    FOREIGN KEY(event_id) REFERENCES events_global(id)
  );
  CREATE INDEX IF NOT EXISTS idx_theme_event_theme_id ON theme_event(theme_id);
  CREATE INDEX IF NOT EXISTS idx_theme_event_event_id ON theme_event(event_id);

  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    config_json TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
  CREATE INDEX IF NOT EXISTS idx_cards_user_id ON cards(user_id);

  CREATE TABLE IF NOT EXISTS card_graph (
    card_id TEXT PRIMARY KEY,
    nodes_json TEXT NOT NULL,
    edges_json TEXT NOT NULL,
    layout_json TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(card_id) REFERENCES cards(id)
  );

  CREATE TABLE IF NOT EXISTS card_event (
    card_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    PRIMARY KEY(card_id, event_id),
    FOREIGN KEY(card_id) REFERENCES cards(id),
    FOREIGN KEY(event_id) REFERENCES events_global(id)
  );
  CREATE INDEX IF NOT EXISTS idx_card_event_card_id ON card_event(card_id);
  CREATE INDEX IF NOT EXISTS idx_card_event_event_id ON card_event(event_id);
`);
