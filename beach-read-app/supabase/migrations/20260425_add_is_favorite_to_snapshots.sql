-- 20260425_add_is_favorite_to_snapshots.sql
-- Add is_favorite column to provider_library_snapshots for better sync tracking

alter table public.provider_library_snapshots
add column if not exists is_favorite boolean not null default false;

-- Update existing snapshots based on raw_payload if possible (optional but helpful)
update public.provider_library_snapshots
set is_favorite = coalesce((raw_payload->>'isFavorite')::boolean, false)
where is_favorite = false;
