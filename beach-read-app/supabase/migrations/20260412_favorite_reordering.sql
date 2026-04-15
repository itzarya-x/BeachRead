-- Add column to store the preferred order of favorite manga series IDs
alter table public.public_profiles
add column if not exists favorite_manga_order jsonb not null default '[]'::jsonb;

-- Comment for documentation
comment on column public.public_profiles.favorite_manga_order is 'Array of series IDs (as strings) to define the sort order of favorite manga in the showcase.';
