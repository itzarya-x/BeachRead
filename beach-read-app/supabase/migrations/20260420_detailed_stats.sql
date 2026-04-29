-- Add detailed stats columns to public_profiles
alter table public.public_profiles 
add column if not exists anime_stats jsonb,
add column if not exists manga_stats jsonb;
