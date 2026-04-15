-- Generalize Media Types for Anime, Manga, and Novels

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type') THEN
        CREATE TYPE media_type AS ENUM ('ANIME', 'MANGA');
    END IF;
END $$;

-- Update Titles table
ALTER TABLE public.titles 
ADD COLUMN IF NOT EXISTS media_type media_type NOT NULL DEFAULT 'MANGA',
ADD COLUMN IF NOT EXISTS format text,
ADD COLUMN IF NOT EXISTS total_episodes integer,
ADD COLUMN IF NOT EXISTS genres text[];

-- Update Library Entries
ALTER TABLE public.library_entries
ADD COLUMN IF NOT EXISTS progress_volumes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS repeat_count integer DEFAULT 0;

-- Rename progress to progress_chapters for clarity, but keep 'progress' as a generated or alias if possible?
-- Actually, let's keep 'progress' as the primary unit (Chapters for Manga, Episodes for Anime).
-- But for Manga, progress_volumes is also used.

-- Update get_finish_quickly RPC to be media-agnostic
CREATE OR REPLACE FUNCTION public.get_finish_quickly(p_user_id uuid, p_limit integer DEFAULT 5)
RETURNS TABLE (
  title_id uuid,
  title text,
  cover_url text,
  progress integer,
  units_total integer,
  media_type media_type,
  percent_complete numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title_romaji,
    t.cover_url,
    le.progress,
    COALESCE(t.total_chapters, t.total_episodes, 0) AS units_total,
    t.media_type,
    ROUND((le.progress::numeric / NULLIF(COALESCE(t.total_chapters, t.total_episodes, 0), 0)::numeric) * 100, 2) AS percent_complete
  FROM public.library_entries le
  JOIN public.titles t ON le.title_id = t.id
  WHERE le.user_id = p_user_id
    AND le.status = 'READING'
    AND COALESCE(t.total_chapters, t.total_episodes, 0) > 0
    AND le.progress < COALESCE(t.total_chapters, t.total_episodes, 0)
  ORDER BY percent_complete DESC
  LIMIT p_limit;
END;
$$;

-- Update get_short_reads RPC
CREATE OR REPLACE FUNCTION public.get_short_reads(p_user_id uuid, p_max_units integer DEFAULT 30, p_limit integer DEFAULT 5)
RETURNS TABLE (
  title_id uuid,
  title text,
  cover_url text,
  units_total integer,
  media_type media_type,
  genres text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title_romaji,
    t.cover_url,
    COALESCE(t.total_chapters, t.total_episodes, 0) AS units_total,
    t.media_type,
    t.genres
  FROM public.library_entries le
  JOIN public.titles t ON le.title_id = t.id
  WHERE le.user_id = p_user_id
    AND le.status = 'PLANNING'
    AND COALESCE(t.total_chapters, t.total_episodes, 0) > 0
    AND COALESCE(t.total_chapters, t.total_episodes, 0) <= p_max_units
  ORDER BY t.metadata_updated_at DESC
  LIMIT p_limit;
END;
$$;
