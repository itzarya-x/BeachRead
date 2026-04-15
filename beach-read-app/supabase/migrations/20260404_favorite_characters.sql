-- Add favorite_characters column to public_profiles
ALTER TABLE public.public_profiles 
ADD COLUMN IF NOT EXISTS favorite_characters jsonb NOT NULL DEFAULT '[]'::jsonb;
