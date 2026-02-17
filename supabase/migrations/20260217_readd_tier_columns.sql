-- Migration: Re-add tier columns to user_media for compatibility
-- Even though tier_items is the source of truth, these columns are used for quick lookups and DataContext sync.

alter table public.user_media
add column if not exists tier_id uuid references public.tiers(id) on delete set null,
add column if not exists tier_position numeric default 0;

-- Backfill data from tier_items if available
update public.user_media m
set 
  tier_id = i.tier_id,
  tier_position = i.position
from public.tier_items i
where m.user_id = i.user_id and m.series_id = i.series_id;

-- Create indexes for performance
create index if not exists idx_user_media_tier_id_col on public.user_media(tier_id);
create index if not exists idx_user_media_tier_position_col on public.user_media(tier_id, tier_position);
