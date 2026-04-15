-- P1 Features: Collections, Notes, and Recommendations

-- 1. Tables for Collections
CREATE TABLE IF NOT EXISTS public.collections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    is_private boolean NOT NULL DEFAULT false,
    color_theme jsonb,
    custom_data jsonb DEFAULT '{}'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.collection_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    title_id uuid NOT NULL REFERENCES public.titles(id) ON DELETE CASCADE,
    sort_order integer NOT NULL DEFAULT 0,
    added_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE (collection_id, title_id)
);

-- 2. Tables for Structured Notes/Journal
CREATE TABLE IF NOT EXISTS public.notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    library_entry_id uuid NOT NULL REFERENCES public.library_entries(id) ON DELETE CASCADE,
    content text NOT NULL,
    chapter_marker integer, -- Optional: link note to a specific progress milestone
    is_public boolean NOT NULL DEFAULT false,
    emotion_tags text[], -- New for P1: e.g. ["Sad", "Hype", "Shocked"]
    quotes text[], -- New for P1
    is_ending_reflection boolean DEFAULT false, -- New for P1
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- 3. Views and RPCs for Recommendations (Queue + backlog intelligence)

-- View for "Next to Read"
CREATE OR REPLACE VIEW public.next_to_read AS
SELECT 
  le.user_id,
  t.id AS title_id,
  t.title_romaji AS title,
  t.cover_url,
  le.progress,
  t.total_chapters as chapters_total,
  (t.total_chapters - le.progress) AS chapters_remaining
FROM public.library_entries le
JOIN public.titles t ON le.title_id = t.id
WHERE le.status = 'READING'
  AND t.total_chapters > le.progress
ORDER BY le.updated_at DESC;

-- RPC for "Finish Quickly"
CREATE OR REPLACE FUNCTION public.get_finish_quickly(p_user_id uuid, p_limit integer DEFAULT 5)
RETURNS TABLE (
  title_id uuid,
  title text,
  cover_url text,
  progress integer,
  chapters_total integer,
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
    t.total_chapters,
    ROUND((le.progress::numeric / NULLIF(t.total_chapters, 0)::numeric) * 100, 2) AS percent_complete
  FROM public.library_entries le
  JOIN public.titles t ON le.title_id = t.id
  WHERE le.user_id = p_user_id
    AND le.status = 'READING'
    AND t.total_chapters > 0
    AND le.progress < t.total_chapters
  ORDER BY percent_complete DESC
  LIMIT p_limit;
END;
$$;

-- RPC for "Short Reads"
CREATE OR REPLACE FUNCTION public.get_short_reads(p_user_id uuid, p_max_chapters integer DEFAULT 30, p_limit integer DEFAULT 5)
RETURNS TABLE (
  title_id uuid,
  title text,
  cover_url text,
  chapters_total integer,
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
    t.total_chapters,
    t.genres
  FROM public.library_entries le
  JOIN public.titles t ON le.title_id = t.id
  WHERE le.user_id = p_user_id
    AND le.status = 'PLANNING'
    AND t.total_chapters > 0
    AND t.total_chapters <= p_max_chapters
  ORDER BY t.metadata_updated_at DESC -- Sort by recently updated if popularity is missing
  LIMIT p_limit;
END;
$$;

-- RLS & Policies
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their collections" ON public.collections FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users manage their collection items" ON public.collection_items FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.collections WHERE id = collection_id AND user_id = auth.uid())
);
CREATE POLICY "Users manage their notes" ON public.notes FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.library_entries WHERE id = library_entry_id AND user_id = auth.uid())
);
