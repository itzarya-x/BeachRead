-- SUPABASE REPAIR/SETUP SCHEMA (FIXED SYNTAX)
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/utcoxardgtuzufroeuey/sql

-- 1. Ensure the table exists
CREATE TABLE IF NOT EXISTS public.user_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    series_id INTEGER NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    edited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    media_type TEXT NOT NULL DEFAULT 'ANIME',
    UNIQUE(user_id, series_id)
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
    media_id TEXT NOT NULL, -- Refers to user_media.id or series_id string
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

-- 2. "Repair" step
DO $$ 
BEGIN 
    -- user_media repair
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_media' AND column_name='deleted') THEN
        ALTER TABLE public.user_media ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_media' AND column_name='series_id') THEN
        ALTER TABLE public.user_media ADD COLUMN series_id INTEGER NOT NULL DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_media' AND column_name='data') THEN
        ALTER TABLE public.user_media ADD COLUMN data JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_media' AND column_name='media_type') THEN
        ALTER TABLE public.user_media ADD COLUMN media_type TEXT NOT NULL DEFAULT 'ANIME';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_media' AND column_name='edited_at') THEN
        ALTER TABLE public.user_media ADD COLUMN edited_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_media' AND column_name='created_at') THEN
        ALTER TABLE public.user_media ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_media' AND column_name='updated_at') THEN
        ALTER TABLE public.user_media ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc 
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public' 
        AND tc.table_name = 'user_media' 
        AND tc.constraint_type = 'UNIQUE'
        AND kcu.column_name IN ('user_id', 'series_id')
        GROUP BY tc.constraint_name
        HAVING COUNT(*) = 2
    ) THEN
        ALTER TABLE public.user_media ADD CONSTRAINT user_media_user_id_series_id_key UNIQUE (user_id, series_id);
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE public.user_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DROP POLICY IF EXISTS "Users can manage their own media" ON public.user_media;
CREATE POLICY "Users can manage their own media" ON public.user_media FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own boards" ON public.tier_boards;
CREATE POLICY "Users can manage their own boards" ON public.tier_boards FOR ALL USING (auth.uid() = user_id);

-- Tiers are shared via boards (cascaded by board_id) but we need policies for them too
DROP POLICY IF EXISTS "Users can manage tiers of their boards" ON public.tiers;
CREATE POLICY "Users can manage tiers of their boards" ON public.tiers FOR ALL 
USING (EXISTS (SELECT 1 FROM public.tier_boards b WHERE b.id = board_id AND b.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own assignments" ON public.tier_assignments;
CREATE POLICY "Users can manage their own assignments" ON public.tier_assignments FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own activity" ON public.activity_log;
CREATE POLICY "Users can manage their own activity" ON public.activity_log FOR ALL USING (auth.uid() = user_id);
-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_user_media_user_id ON public.user_media(user_id);
CREATE INDEX IF NOT EXISTS idx_tier_boards_user_id ON public.tier_boards(user_id);
CREATE INDEX IF NOT EXISTS idx_tier_assignments_user_id ON public.tier_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_tier_assignments_board_id ON public.tier_assignments(board_id);

-- 6. Enable real-time for all
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_media') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE user_media;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tier_boards') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE tier_boards;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tiers') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE tiers;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'tier_assignments') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE tier_assignments;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'activity_log') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;
        END IF;
    END IF;
END $$;
