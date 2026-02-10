-- SUPABASE REPAIR/SETUP SCHEMA
-- This script ensures the table exists AND has all required columns.
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/utcoxardgtuzufroeuey/sql

-- 1. Ensure the table exists
CREATE TABLE IF NOT EXISTS public.user_media (
    id BIGINT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    series_id INTEGER NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    edited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, series_id)
);

-- 2. "Repair" step: Ensure columns exist if the table was created previously without them
DO $$ 
BEGIN 
    -- Add deleted column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_media' AND column_name='deleted') THEN
        ALTER TABLE public.user_media ADD COLUMN deleted BOOLEAN NOT NULL DEFAULT false;
    END IF;

    -- Add series_id if missing (just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_media' AND column_name='series_id') THEN
        ALTER TABLE public.user_media ADD COLUMN series_id INTEGER NOT NULL DEFAULT 0;
    END IF;

    -- Add data if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='user_media' AND column_name='data') THEN
        ALTER TABLE public.user_media ADD COLUMN data JSONB NOT NULL DEFAULT '{}'::jsonb;
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
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'user_media'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE user_media;
    EXCEPTION WHEN OTHERS THEN
        -- Publication might not exist yet in some Supabase projects
        NULL;
    END IF;
END $$;
