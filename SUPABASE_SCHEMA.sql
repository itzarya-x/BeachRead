-- SUPABASE SCHEMA: User Media table for Cloud Sync
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/utcoxardgtuzufroeuey/sql

-- 1. Create the user_media table
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

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.user_media ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy so users can only see/edit their own data
-- Policy: "Users can manage their own media"
DROP POLICY IF EXISTS "Users can manage their own media" ON public.user_media;
CREATE POLICY "Users can manage their own media" 
ON public.user_media 
FOR ALL 
USING (auth.uid() = user_id);

-- 4. Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_media_user_id ON public.user_media(user_id);
CREATE INDEX IF NOT EXISTS idx_user_media_deleted ON public.user_media(deleted);

-- 5. Enable real-time synchronization for this table
-- This allows changes on one device to appear on others instantly
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'user_media'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE user_media;
    END IF;
END $$;
