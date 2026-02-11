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

-- 2. "Repair" step: Ensure columns exist if the table was created previously without them
DO $$ 
BEGIN 
    -- Add deleted column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_media' AND column_name='deleted') THEN
        ALTER TABLE public.user_media ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- Add series_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_media' AND column_name='series_id') THEN
        ALTER TABLE public.user_media ADD COLUMN series_id INTEGER NOT NULL DEFAULT 0;
    END IF;

    -- Add data if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_media' AND column_name='data') THEN
        ALTER TABLE public.user_media ADD COLUMN data JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;
    -- Add media_type if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_media' AND column_name='media_type') THEN
        ALTER TABLE public.user_media ADD COLUMN media_type TEXT NOT NULL DEFAULT 'ANIME';
    END IF;

    -- Add edited_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_media' AND column_name='edited_at') THEN
        ALTER TABLE public.user_media ADD COLUMN edited_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;

    -- Add created_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_media' AND column_name='created_at') THEN
        ALTER TABLE public.user_media ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;

    -- Add updated_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_media' AND column_name='updated_at') THEN
        ALTER TABLE public.user_media ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;

    -- NEW: Ensure the unique constraint exists on (user_id, series_id)
    -- This is required for our 'upsert' logic to work correctly
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
        -- Try to drop any existing singular uniques on series_id if they exist
        -- (Some older versions might have had a unique on just series_id)
        ALTER TABLE public.user_media ADD CONSTRAINT user_media_user_id_series_id_key UNIQUE (user_id, series_id);
    END IF;
END $$;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.user_media ENABLE ROW LEVEL SECURITY;

-- 4. Create a policy so users can only see/edit their own data
DROP POLICY IF EXISTS "Users can manage their own media" ON public.user_media;
CREATE POLICY "Users can manage their own media" 
ON public.user_media 
FOR ALL 
USING (auth.uid() = user_id);

-- 5. Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_media_user_id ON public.user_media(user_id);
CREATE INDEX IF NOT EXISTS idx_user_media_deleted ON public.user_media(deleted);

-- 6. Enable real-time synchronization
-- Note: We check if the publication exists before trying to add the table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'user_media'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE user_media;
        END IF;
    END IF;
END $$;
