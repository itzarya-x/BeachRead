-- 1. Domain Model Schema

-- Custom Types
CREATE TYPE external_provider AS ENUM ('ANILIST', 'MAL');
CREATE TYPE library_status AS ENUM ('READING', 'COMPLETED', 'PAUSED', 'DROPPED', 'PLANNING');
CREATE TYPE sync_job_type AS ENUM ('FULL', 'INCREMENTAL');
CREATE TYPE sync_job_status AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REQUIRES_RESOLUTION');
CREATE TYPE notification_type AS ENUM ('NEW_CHAPTER', 'SYNC_CONFLICT', 'MILESTONE', 'SYSTEM');
CREATE TYPE audit_source AS ENUM ('WEB_UI', 'ANILIST_SYNC', 'MAL_SYNC', 'SYSTEM');

-- Titles (Manga) Cache
CREATE TABLE IF NOT EXISTS public.titles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    external_provider external_provider NOT NULL,
    external_id text NOT NULL,
    title_romaji text,
    title_english text,
    cover_url text,
    total_chapters int,
    status text,
    synopsis text,
    metadata_updated_at timestamptz DEFAULT now(),
    UNIQUE(external_provider, external_id)
);

-- Releases (Polled Chapters)
CREATE TABLE IF NOT EXISTS public.releases (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title_id uuid REFERENCES public.titles(id) ON DELETE CASCADE,
    chapter_number int NOT NULL,
    release_date timestamptz DEFAULT now()
);

-- Library Entries
CREATE TABLE IF NOT EXISTS public.library_entries (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title_id uuid REFERENCES public.titles(id) ON DELETE CASCADE,
    status library_status NOT NULL DEFAULT 'PLANNING',
    progress int NOT NULL DEFAULT 0 CHECK (progress >= 0),
    score numeric(3,1) DEFAULT 0,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, title_id)
);

-- Collections
CREATE TABLE IF NOT EXISTS public.collections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    is_public boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Collection Items
CREATE TABLE IF NOT EXISTS public.collection_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id uuid REFERENCES public.collections(id) ON DELETE CASCADE,
    title_id uuid REFERENCES public.titles(id) ON DELETE CASCADE,
    sort_order int DEFAULT 0,
    added_at timestamptz DEFAULT now(),
    UNIQUE(collection_id, title_id)
);

-- Notes
CREATE TABLE IF NOT EXISTS public.notes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    title_id uuid REFERENCES public.titles(id) ON DELETE CASCADE,
    content text NOT NULL,
    is_spoiler boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Sync Identities
CREATE TABLE IF NOT EXISTS public.sync_identities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
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
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    provider external_provider NOT NULL,
    type sync_job_type NOT NULL,
    status sync_job_status DEFAULT 'QUEUED',
    started_at timestamptz,
    completed_at timestamptz,
    error_log text,
    created_at timestamptz DEFAULT now()
);

-- Sync Conflicts
CREATE TABLE IF NOT EXISTS public.sync_conflicts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sync_job_id uuid REFERENCES public.sync_jobs(id) ON DELETE CASCADE,
    title_id uuid REFERENCES public.titles(id) ON DELETE CASCADE,
    local_state jsonb NOT NULL,
    remote_state jsonb NOT NULL,
    resolved_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    reference_id uuid, -- Polymorphic reference (release_id, sync_conflict_id, etc)
    title text,
    message text,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Entry Audit Logs
CREATE TABLE IF NOT EXISTS public.entry_audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    library_entry_id uuid REFERENCES public.library_entries(id) ON DELETE CASCADE,
    previous_state jsonb,
    new_state jsonb NOT NULL,
    source audit_source NOT NULL,
    changed_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lib_user_status ON public.library_entries(user_id, status);
CREATE INDEX IF NOT EXISTS idx_lib_user_updated ON public.library_entries(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_titles_external ON public.titles(external_provider, external_id);
CREATE INDEX IF NOT EXISTS idx_releases_title ON public.releases(title_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON public.sync_jobs(status) WHERE status IN ('QUEUED', 'PROCESSING');

-- Queue / Recommendation RPCs
CREATE OR REPLACE FUNCTION get_finish_quickly_queue(p_user_id uuid)
RETURNS TABLE (
    entry_id uuid,
    title_id uuid,
    title_romaji text,
    cover_url text,
    progress int,
    total_chapters int,
    remaining_chapters int
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        le.id AS entry_id,
        t.id AS title_id,
        t.title_romaji,
        t.cover_url,
        le.progress,
        t.total_chapters,
        (t.total_chapters - le.progress) AS remaining_chapters
    FROM public.library_entries le
    JOIN public.titles t ON le.title_id = t.id
    WHERE le.user_id = p_user_id
      AND le.status = 'READING'
      AND t.total_chapters IS NOT NULL
      AND (t.total_chapters - le.progress) > 0
      AND (t.total_chapters - le.progress) <= 10
    ORDER BY remaining_chapters ASC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_short_reads_queue(p_user_id uuid)
RETURNS TABLE (
    entry_id uuid,
    title_id uuid,
    title_romaji text,
    cover_url text,
    total_chapters int
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        le.id AS entry_id,
        t.id AS title_id,
        t.title_romaji,
        t.cover_url,
        t.total_chapters
    FROM public.library_entries le
    JOIN public.titles t ON le.title_id = t.id
    WHERE le.user_id = p_user_id
      AND le.status = 'PLANNING'
      AND t.total_chapters IS NOT NULL
      AND t.total_chapters <= 30
    ORDER BY t.total_chapters ASC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically log library_entries changes
CREATE OR REPLACE FUNCTION log_library_entry_change()
RETURNS TRIGGER AS $$
DECLARE
    v_source audit_source;
BEGIN
    -- Infer source from application_name or a custom session variable. Default to WEB_UI.
    v_source := COALESCE(current_setting('app.audit_source', true), 'WEB_UI')::audit_source;
    
    INSERT INTO public.entry_audit_logs (library_entry_id, previous_state, new_state, source)
    VALUES (
        NEW.id,
        (CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END)::jsonb,
        row_to_json(NEW)::jsonb,
        v_source
    );
    
    -- Also enqueue a sync job if an identity exists
    IF EXISTS (SELECT 1 FROM public.sync_identities WHERE user_id = NEW.user_id AND provider = 'ANILIST') THEN
        INSERT INTO public.sync_jobs (user_id, provider, type, status)
        VALUES (NEW.user_id, 'ANILIST', 'INCREMENTAL', 'QUEUED');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_library_entry_change ON public.library_entries;
CREATE TRIGGER trigger_log_library_entry_change
AFTER INSERT OR UPDATE ON public.library_entries
FOR EACH ROW EXECUTE FUNCTION log_library_entry_change();

-- Trigger for Milestones Notification
CREATE OR REPLACE FUNCTION check_milestones()
RETURNS TRIGGER AS $$
DECLARE
    v_completed_count int;
BEGIN
    IF NEW.status = 'COMPLETED' AND (TG_OP = 'INSERT' OR OLD.status != 'COMPLETED') THEN
        SELECT count(*) INTO v_completed_count FROM public.library_entries WHERE user_id = NEW.user_id AND status = 'COMPLETED';
        IF v_completed_count > 0 AND v_completed_count % 50 = 0 THEN
            INSERT INTO public.notifications (user_id, type, title, message)
            VALUES (NEW.user_id, 'MILESTONE', 'Milestone Reached!', 'You have completed ' || v_completed_count || ' series. Great job!');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_check_milestones ON public.library_entries;
CREATE TRIGGER trigger_check_milestones
AFTER INSERT OR UPDATE ON public.library_entries
FOR EACH ROW EXECUTE FUNCTION check_milestones();
