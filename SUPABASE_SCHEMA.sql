-- SUPABASE REPAIR/SETUP SCHEMA
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/utcoxardgtuzufroeuey/sql

-- 1. Safely add missing relational columns to user_media
-- This ensures existing tables are "promoted" to the new relational standard
DO $$ 
BEGIN 
    -- Tracking Identification
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_media' AND column_name='anilist_media_id') THEN
        ALTER TABLE public.user_media ADD COLUMN anilist_media_id INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_media' AND column_name='anilist_list_entry_id') THEN
        ALTER TABLE public.user_media ADD COLUMN anilist_list_entry_id INTEGER;
    END IF;

    -- Core Stats Columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_media' AND column_name='status') THEN
        ALTER TABLE public.user_media ADD COLUMN status TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_media' AND column_name='score') THEN
        ALTER TABLE public.user_media ADD COLUMN score INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_media' AND column_name='progress') THEN
        ALTER TABLE public.user_media ADD COLUMN progress INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_media' AND column_name='progress_volumes') THEN
        ALTER TABLE public.user_media ADD COLUMN progress_volumes INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_media' AND column_name='repeat') THEN
        ALTER TABLE public.user_media ADD COLUMN repeat INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_media' AND column_name='runtime') THEN
        ALTER TABLE public.user_media ADD COLUMN runtime INTEGER DEFAULT 24;
    END IF;

    -- Date Metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_media' AND column_name='started_at') THEN
        ALTER TABLE public.user_media ADD COLUMN started_at DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_media' AND column_name='completed_at') THEN
        ALTER TABLE public.user_media ADD COLUMN completed_at DATE;
    END IF;

    -- Intelligence Metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_media' AND column_name='genres') THEN
        ALTER TABLE public.user_media ADD COLUMN genres TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_media' AND column_name='format') THEN
        ALTER TABLE public.user_media ADD COLUMN format TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_media' AND column_name='year') THEN
        ALTER TABLE public.user_media ADD COLUMN year INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_media' AND column_name='origin') THEN
        ALTER TABLE public.user_media ADD COLUMN origin TEXT;
    END IF;

    -- Lossless JSON Storage
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_media' AND column_name='raw_media') THEN
        ALTER TABLE public.user_media ADD COLUMN raw_media JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_media' AND column_name='raw_list_entry') THEN
        ALTER TABLE public.user_media ADD COLUMN raw_list_entry JSONB DEFAULT '{}'::jsonb;
    END IF;

END $$;

-- 2. Update the Unique Constraint
-- Drop old constraint and apply the canonical AniList ID constraint
ALTER TABLE public.user_media DROP CONSTRAINT IF EXISTS user_media_user_id_series_id_key;
ALTER TABLE public.user_media DROP CONSTRAINT IF EXISTS user_media_user_id_anilist_media_id_key;
ALTER TABLE public.user_media ADD CONSTRAINT user_media_user_id_anilist_media_id_key UNIQUE (user_id, anilist_media_id);

-- 3. Canonical Tables (Creation if missing)
CREATE TABLE IF NOT EXISTS public.tier_boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES public.tier_boards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    "order" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tier_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES public.tier_boards(id) ON DELETE CASCADE,
    media_id TEXT NOT NULL,
    tier_id UUID REFERENCES public.tiers(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(user_id, board_id, media_id)
);

CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    series_id INTEGER,
    action_type TEXT NOT NULL,
    media_type TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. HYBRID STAT VIEWS
CREATE OR REPLACE VIEW public.user_stats_core AS
SELECT
  user_id,
  count(*) AS total_entries,
  count(*) FILTER (WHERE status = 'COMPLETED') AS completed,
  count(*) FILTER (WHERE status = 'DROPPED') AS dropped,
  count(*) FILTER (WHERE status = 'CURRENT') AS current,
  count(*) FILTER (WHERE status = 'PLANNING') AS planning,
  avg(score) FILTER (WHERE score > 0) AS mean_score,
  sum(COALESCE(runtime, 24) * progress) AS total_minutes
FROM public.user_media
WHERE deleted = false
GROUP BY user_id;

CREATE OR REPLACE VIEW public.user_score_distribution AS
SELECT
  user_id,
  floor(score/10)*10 AS score_bucket,
  count(*) AS count
FROM public.user_media
WHERE score > 0 AND deleted = false
GROUP BY user_id, score_bucket;

CREATE OR REPLACE VIEW public.user_activity_heatmap AS
SELECT
  user_id,
  date_trunc('day', created_at) AS day,
  count(*) AS activity_count
FROM public.activity_log
GROUP BY user_id, day;

-- 5. SNAPSHOT TABLE
CREATE TABLE IF NOT EXISTS public.user_stats_snapshot (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_entries INT DEFAULT 0,
  mean_score NUMERIC DEFAULT 0,
  completed INT DEFAULT 0,
  dropped INT DEFAULT 0,
  total_minutes BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Trigger to keep snapshot updated
CREATE OR REPLACE FUNCTION public.refresh_user_stats_snapshot()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_stats_snapshot (user_id, total_entries, mean_score, completed, dropped, total_minutes)
  SELECT
    user_id,
    count(*),
    avg(score),
    count(*) FILTER (WHERE status = 'COMPLETED'),
    count(*) FILTER (WHERE status = 'DROPPED'),
    sum(COALESCE(runtime, 24) * progress)
  FROM public.user_media
  WHERE user_id = COALESCE(new.user_id, old.user_id) AND deleted = false
  GROUP BY user_id
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_entries = EXCLUDED.total_entries,
    mean_score = EXCLUDED.mean_score,
    completed = EXCLUDED.completed,
    dropped = EXCLUDED.dropped,
    total_minutes = EXCLUDED.total_minutes,
    updated_at = now();

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_stats_snapshot ON public.user_media;
CREATE TRIGGER update_stats_snapshot
AFTER INSERT OR UPDATE OR DELETE
ON public.user_media
FOR EACH ROW
EXECUTE FUNCTION public.refresh_user_stats_snapshot();

-- 7. Real-time Publication
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_stats_snapshot') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE user_stats_snapshot;
        END IF;
    END IF;
END $$;
