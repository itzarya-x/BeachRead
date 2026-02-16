-- SUPABASE REPAIR/SETUP SCHEMA (FIXED SYNTAX)
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/utcoxardgtuzufroeuey/sql

-- 1. Canonical Media Table (Lossless & Optimized)
CREATE TABLE IF NOT EXISTS public.user_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    anilist_media_id INTEGER NOT NULL,
    anilist_list_entry_id INTEGER,
    media_type TEXT NOT NULL DEFAULT 'ANIME',
    status TEXT,
    score INTEGER,
    progress INTEGER DEFAULT 0,
    progress_volumes INTEGER DEFAULT 0,
    repeat INTEGER DEFAULT 0,
    priority INTEGER DEFAULT 0,
    private BOOLEAN DEFAULT false,
    hidden BOOLEAN DEFAULT false,
    started_at DATE,
    completed_at DATE,
    notes TEXT,
    custom_lists JSONB DEFAULT '[]'::jsonb,
    year INTEGER,
    format TEXT,
    origin TEXT, -- manga/manhwa/manhua
    country TEXT,
    source TEXT,
    runtime INTEGER,
    episodes INTEGER,
    chapters INTEGER,
    volumes INTEGER,
    genres TEXT[],
    tags TEXT[],
    average_score INTEGER,
    popularity INTEGER,
    cover_image TEXT,
    banner_image TEXT,
    title_romaji TEXT,
    title_english TEXT,
    title_native TEXT,
    description TEXT,
    raw_media JSONB DEFAULT '{}'::jsonb,
    raw_list_entry JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted BOOLEAN NOT NULL DEFAULT false,
    UNIQUE(user_id, anilist_media_id)
);

-- PHASE 1: Tier Boards
CREATE TABLE IF NOT EXISTS public.tier_boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PHASE 1: Tiers (Rows)
CREATE TABLE IF NOT EXISTS public.tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES public.tier_boards(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    "order" INTEGER NOT NULL
);

-- PHASE 1: Tier Assignments
CREATE TABLE IF NOT EXISTS public.tier_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES public.tier_boards(id) ON DELETE CASCADE,
    media_id TEXT NOT NULL, -- Refers to user_media.id or anilist_media_id string
    tier_id UUID REFERENCES public.tiers(id) ON DELETE CASCADE, -- NULL means unassigned pool
    position INTEGER NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(user_id, board_id, media_id)
);

-- PHASE 2: Activity Table for Behavioral Analytics
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    series_id INTEGER,
    action_type TEXT NOT NULL, -- 'progress', 'add', 'status_change', 'tier_move', 'rating_change'
    media_type TEXT, -- 'ANIME', 'MANGA'
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PHASE 3: Lossless Mapping Extension
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- ANIME / MANGA / CHARACTER / STAFF / STUDIO
    anilist_id INTEGER NOT NULL,
    position INTEGER NOT NULL,
    raw JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_profile_snapshot (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PHASE 4: Automated Analytics Cache
CREATE TABLE IF NOT EXISTS public.user_stats_cache (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_entries INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0,
  dropped INTEGER DEFAULT 0,
  planning INTEGER DEFAULT 0,
  current INTEGER DEFAULT 0,
  mean_score NUMERIC DEFAULT 0,
  total_minutes_watched BIGINT DEFAULT 0,
  completion_rate NUMERIC DEFAULT 0,
  drop_rate NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. "Repair" step & Column additions for existing tables
DO $$ 
BEGIN 
    -- user_media repair / column addition
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_media' AND column_name='anilist_media_id') THEN
        ALTER TABLE public.user_media ADD COLUMN anilist_media_id INTEGER;
    END IF;

    -- [Omitting full redundancy for brevity, but ensuring core unique constraint update]
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc 
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public' 
        AND tc.table_name = 'user_media' 
        AND tc.constraint_type = 'UNIQUE'
        AND kcu.column_name = 'series_id'
    ) THEN
        ALTER TABLE public.user_media DROP CONSTRAINT user_media_user_id_series_id_key;
    END IF;
END $$;

-- 3. Stats Recomputation Logic
CREATE OR REPLACE FUNCTION public.recompute_user_stats(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total integer;
  v_completed integer;
  v_dropped integer;
  v_planning integer;
  v_current integer;
  v_mean_score numeric;
  v_minutes bigint;
BEGIN

  SELECT count(*) INTO v_total
  FROM public.user_media
  WHERE user_id = p_user_id AND deleted = false;

  SELECT count(*) INTO v_completed
  FROM public.user_media
  WHERE user_id = p_user_id AND status = 'COMPLETED' AND deleted = false;

  SELECT count(*) INTO v_dropped
  FROM public.user_media
  WHERE user_id = p_user_id AND status = 'DROPPED' AND deleted = false;

  SELECT count(*) INTO v_planning
  FROM public.user_media
  WHERE user_id = p_user_id AND status = 'PLANNING' AND deleted = false;

  SELECT count(*) INTO v_current
  FROM public.user_media
  WHERE user_id = p_user_id AND status = 'CURRENT' AND deleted = false;

  SELECT avg(score) INTO v_mean_score
  FROM public.user_media
  WHERE user_id = p_user_id AND score IS NOT NULL AND score > 0 AND deleted = false;

  SELECT sum(COALESCE(progress,0) * COALESCE(runtime,24))
  INTO v_minutes
  FROM public.user_media
  WHERE user_id = p_user_id AND media_type = 'ANIME' AND deleted = false;

  INSERT INTO public.user_stats_cache
  VALUES (
    p_user_id,
    v_total,
    v_completed,
    v_dropped,
    v_planning,
    v_current,
    ROUND(COALESCE(v_mean_score,0), 2),
    COALESCE(v_minutes,0),
    ROUND((v_completed::numeric / NULLIF(v_total,0)) * 100, 2),
    ROUND((v_dropped::numeric / NULLIF(v_total,0)) * 100, 2),
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_entries = EXCLUDED.total_entries,
    completed = EXCLUDED.completed,
    dropped = EXCLUDED.dropped,
    planning = EXCLUDED.planning,
    current = EXCLUDED.current,
    mean_score = EXCLUDED.mean_score,
    total_minutes_watched = EXCLUDED.total_minutes_watched,
    completion_rate = EXCLUDED.completion_rate,
    drop_rate = EXCLUDED.drop_rate,
    updated_at = now();

END;
$$;

-- 4. Trigger Function
CREATE OR REPLACE FUNCTION public.trigger_recompute_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM public.recompute_user_stats(OLD.user_id);
    RETURN OLD;
  ELSE
    PERFORM public.recompute_user_stats(NEW.user_id);
    RETURN NEW;
  END IF;
END;
$$;

-- 5. Attach Trigger
DROP TRIGGER IF EXISTS user_media_stats_trigger ON public.user_media;
CREATE TRIGGER user_media_stats_trigger
AFTER INSERT OR UPDATE OR DELETE
ON public.user_media
FOR EACH ROW
EXECUTE FUNCTION public.trigger_recompute_stats();

-- 6. RLS & Real-time
ALTER TABLE public.user_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own media" ON public.user_media;
CREATE POLICY "Users can manage their own media" ON public.user_media FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own stats" ON public.user_stats_cache;
CREATE POLICY "Users can view their own stats" ON public.user_stats_cache FOR SELECT USING (auth.uid() = user_id);

-- HYBRID STAT ARCHITECTURE: DATABASE LAYER
-- Views for efficient aggregation
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

-- Snapshot table for ultra-fast access
CREATE TABLE IF NOT EXISTS public.user_stats_snapshot (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_entries INT DEFAULT 0,
  mean_score NUMERIC DEFAULT 0,
  completed INT DEFAULT 0,
  dropped INT DEFAULT 0,
  total_minutes BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger to keep snapshot updated
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

-- PHASE 5: User Integrations (OAuth Tokens)
CREATE TABLE IF NOT EXISTS public.user_integrations (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'anilist'
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own integrations" ON public.user_integrations;
CREATE POLICY "Users can manage their own integrations" ON public.user_integrations FOR ALL USING (auth.uid() = user_id);

-- Enable real-time
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_stats_cache') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE user_stats_cache;
        END IF;
    END IF;
END $$;
