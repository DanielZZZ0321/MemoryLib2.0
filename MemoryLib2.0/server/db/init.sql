-- Memoria 初始 Schema（PostgreSQL + pgvector）
-- 在首次启动 Postgres 容器时由 docker-entrypoint-initdb.d 执行

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ---------- ENUM ----------
CREATE TYPE raw_file_type AS ENUM (
  'video_fpv',
  'screen_recording',
  'photo',
  'document',
  'audio'
);

CREATE TYPE processing_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

CREATE TYPE keyframe_source_type AS ENUM (
  'original_photo',
  'video_frame',
  'ai_generated'
);

CREATE TYPE event_module_type AS ENUM (
  'photo_wall',
  'video',
  'summary',
  'transcript',
  'note',
  'file',
  'audio'
);

CREATE TYPE keyword_dimension AS ENUM ('person', 'keyword');

-- ---------- RawSource ----------
CREATE TABLE raw_source (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_path TEXT NOT NULL,
  file_type raw_file_type NOT NULL,
  original_filename TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  upload_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  processing_status processing_status NOT NULL DEFAULT 'pending',
  highlights JSONB NOT NULL DEFAULT '[]',
  vector_embedding vector(1536)
);

CREATE INDEX idx_raw_source_file_type ON raw_source (file_type);
CREATE INDEX idx_raw_source_upload_time ON raw_source (upload_time DESC);
CREATE INDEX idx_raw_source_processing ON raw_source (processing_status);

-- ---------- VideoClip ----------
CREATE TABLE video_clip (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raw_source_id UUID NOT NULL REFERENCES raw_source (id) ON DELETE CASCADE,
  start_time DOUBLE PRECISION NOT NULL,
  end_time DOUBLE PRECISION NOT NULL,
  clip_path TEXT,
  keyframe_path TEXT,
  keyframe_source_type keyframe_source_type,
  ai_description TEXT
);

CREATE INDEX idx_video_clip_raw ON video_clip (raw_source_id);

-- ---------- Timeline ----------
CREATE TABLE timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raw_source_id UUID NOT NULL REFERENCES raw_source (id) ON DELETE CASCADE,
  segment_start DOUBLE PRECISION NOT NULL,
  segment_end DOUBLE PRECISION NOT NULL,
  event_type TEXT NOT NULL,
  summary TEXT,
  confidence DOUBLE PRECISION,
  metadata_extracted JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_timeline_raw ON timeline (raw_source_id);

-- ---------- Event ----------
CREATE TABLE event (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  summary TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  location TEXT,
  event_type TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  vector_embedding vector(1536),
  is_highlighted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_start ON event (start_time DESC);
CREATE INDEX idx_event_highlight ON event (is_highlighted) WHERE is_highlighted = true;

-- 向量索引建议在有一定数据量后创建，例如：
-- CREATE INDEX idx_event_vector ON event USING ivfflat (vector_embedding vector_cosine_ops) WITH (lists = 100);

-- ---------- EventModule ----------
CREATE TABLE event_module (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES event (id) ON DELETE CASCADE,
  module_type event_module_type NOT NULL,
  title TEXT,
  content JSONB NOT NULL DEFAULT '{}',
  raw_source_ids UUID[] NOT NULL DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_event_module_event ON event_module (event_id, sort_order);

-- ---------- Keyword ----------
CREATE TABLE keyword (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  dimension keyword_dimension NOT NULL,
  weight DOUBLE PRECISION NOT NULL DEFAULT 1,
  vector_embedding vector(1536),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_keyword_name_dim ON keyword (name, dimension);

-- CREATE INDEX idx_keyword_vector ON keyword USING ivfflat (vector_embedding vector_cosine_ops) WITH (lists = 50);

-- ---------- KeywordEventRelation ----------
CREATE TABLE keyword_event_relation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword_id UUID NOT NULL REFERENCES keyword (id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES event (id) ON DELETE CASCADE,
  relevance_score DOUBLE PRECISION,
  is_manually_added BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (keyword_id, event_id)
);

CREATE INDEX idx_ker_keyword ON keyword_event_relation (keyword_id);
CREATE INDEX idx_ker_event ON keyword_event_relation (event_id);

-- ---------- Workspace ----------
CREATE TABLE workspace (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  filter_criteria JSONB NOT NULL DEFAULT '{}',
  event_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- updated_at 触发器 ----------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_event_updated
  BEFORE UPDATE ON event
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER tr_event_module_updated
  BEFORE UPDATE ON event_module
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER tr_workspace_updated
  BEFORE UPDATE ON workspace
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
