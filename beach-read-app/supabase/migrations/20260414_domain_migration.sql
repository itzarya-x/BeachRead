-- 1. Ensure new tables from robust_backend_schema exist (if not already created)
-- Note: This is a subset of 20260413_robust_backend_schema.sql for idempotency

-- Extend public_profiles
ALTER TABLE public.public_profiles ADD COLUMN IF NOT EXISTS has_onboarded BOOLEAN DEFAULT false;
ALTER TABLE public.public_profiles ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'DARK';

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'external_provider') THEN
        CREATE TYPE external_provider AS ENUM ('ANILIST', 'MAL');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'library_status') THEN
        CREATE TYPE library_status AS ENUM ('READING', 'COMPLETED', 'PAUSED', 'DROPPED', 'PLANNING');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_job_type') THEN
        CREATE TYPE sync_job_type AS ENUM ('FULL', 'INCREMENTAL');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sync_job_status') THEN
        CREATE TYPE sync_job_status AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REQUIRES_RESOLUTION');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM ('NEW_CHAPTER', 'SYNC_CONFLICT', 'MILESTONE', 'SYSTEM');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_source') THEN
        CREATE TYPE audit_source AS ENUM ('WEB_UI', 'ANILIST_SYNC', 'MAL_SYNC', 'SYSTEM');
    END IF;
END $$;

-- Titles Cache
CREATE TABLE IF NOT EXISTS public.titles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    external_provider external_provider NOT NULL,
    external_id text NOT NULL,
    title_romaji text,
    title_english text,
    cover_url text,
    banner_url text,
    genres text[],
    total_chapters int,
    status text,
    synopsis text,
    metadata_updated_at timestamptz DEFAULT now(),
    UNIQUE(external_provider, external_id)
);

-- Library Entries
CREATE TABLE IF NOT EXISTS public.library_entries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE cascade,
    title_id uuid REFERENCES public.titles(id) ON DELETE cascade,
    status library_status NOT NULL DEFAULT 'PLANNING',
    progress int NOT NULL DEFAULT 0 CHECK (progress >= 0),
    score numeric(3,1) DEFAULT 0,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, title_id)
);

-- Sync Identities
CREATE TABLE IF NOT EXISTS public.sync_identities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE cascade,
    provider external_provider NOT NULL,
    provider_account_id text,
    access_token text,
    refresh_token text,
    last_synced_at timestamptz,
    UNIQUE(user_id, provider)
);

-- Sync Jobs
CREATE TABLE IF NOT EXISTS public.sync_jobs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE cascade,
    provider external_provider NOT NULL,
    type sync_job_type NOT NULL,
    status sync_job_status DEFAULT 'QUEUED',
    started_at timestamptz,
    completed_at timestamptz,
    error_log text,
    created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE cascade,
    type notification_type NOT NULL,
    reference_id uuid,
    title text,
    message text,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 2. Data Migration from legacy tables

-- Migrate Titles from user_media (AniList only for now as it was the default)
INSERT INTO public.titles (external_provider, external_id, title_romaji, cover_url, banner_url, genres, total_chapters, status)
SELECT 
    'ANILIST', 
    series_id::text, 
    raw_media->>'title', 
    raw_media->>'coverUrl', 
    raw_media->>'bannerUrl',
    ARRAY(SELECT jsonb_array_elements_text(raw_media->'genres')),
    (raw_media->>'chapters')::int, 
    status
FROM public.user_media
ON CONFLICT (external_provider, external_id) DO UPDATE SET
    title_romaji = EXCLUDED.title_romaji,
    cover_url = EXCLUDED.cover_url,
    banner_url = EXCLUDED.banner_url,
    genres = EXCLUDED.genres,
    total_chapters = EXCLUDED.total_chapters;

-- Migrate Library Entries
INSERT INTO public.library_entries (user_id, title_id, status, progress, score, started_at, completed_at, updated_at, created_at)
SELECT 
    um.user_id, 
    t.id, 
    CASE 
        WHEN um.status = 'CURRENT' THEN 'READING'::library_status
        WHEN um.status IN ('READING', 'COMPLETED', 'PAUSED', 'DROPPED', 'PLANNING') THEN um.status::library_status
        ELSE 'PLANNING'::library_status
    END,
    um.progress,
    um.score,
    um.started_at::timestamptz,
    um.completed_at::timestamptz,
    um.updated_at,
    um.updated_at
FROM public.user_media um
JOIN public.titles t ON t.external_id = um.series_id::text AND t.external_provider = 'ANILIST'
ON CONFLICT (user_id, title_id) DO NOTHING;

-- Migrate Identities
INSERT INTO public.sync_identities (user_id, provider, provider_account_id, access_token, last_synced_at)
SELECT 
    user_id, 
    UPPER(provider)::external_provider, 
    username, 
    access_token, 
    last_sync_at
FROM public.external_integrations
ON CONFLICT (user_id, provider) DO NOTHING;

-- Migrate Notifications from activity_log (select actions)
INSERT INTO public.notifications (user_id, type, title, message, created_at)
SELECT 
    user_id,
    'SYSTEM',
    CASE 
        WHEN action_type = 'LIBRARY_ADD' THEN 'Added to Archive'
        WHEN action_type = 'STATUS_UPDATE' THEN 'Status Update'
        WHEN action_type = 'PROGRESS_UPDATE' THEN 'Progress Increment'
        ELSE 'Archive Activity'
    END,
    details->>'series_title' || ': ' || action_type,
    created_at
FROM public.activity_log
WHERE action_type IN ('LIBRARY_ADD', 'STATUS_UPDATE', 'PROGRESS_UPDATE');

-- Enable RLS on new tables
ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Basic Policies
DROP POLICY IF EXISTS "Titles are public" ON public.titles;
CREATE POLICY "Titles are public" ON public.titles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users manage their library entries" ON public.library_entries;
CREATE POLICY "Users manage their library entries" ON public.library_entries FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage their identities" ON public.sync_identities;
CREATE POLICY "Users manage their identities" ON public.sync_identities FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage their sync jobs" ON public.sync_jobs;
CREATE POLICY "Users manage their sync jobs" ON public.sync_jobs FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users view their notifications" ON public.notifications;
CREATE POLICY "Users view their notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update their notifications" ON public.notifications;
CREATE POLICY "Users update their notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
