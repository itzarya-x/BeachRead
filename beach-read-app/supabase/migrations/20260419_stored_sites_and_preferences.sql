-- Add support for custom reader URLs and extended diary preferences
ALTER TABLE public.library_entries 
ADD COLUMN IF NOT EXISTS reader_url text;

-- Extend user preferences for Tactile Sanctuary features
-- We can add these to the profile table if they aren't already in a JSONB preferences column
-- Based on previous investigation, preferences are in a JSONB column in profiles (or auth.users)
-- Let's ensure the profiles table can handle these aesthetic settings if we want them indexed, 
-- but JSONB is usually fine for these.

-- Add a index for media_type to improve filtering performance
CREATE INDEX IF NOT EXISTS idx_titles_media_type ON public.titles(media_type);
