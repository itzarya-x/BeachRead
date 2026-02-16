-- Migration: Refactor Tier System to use dedicated tier_items table
-- adheres to MASTER PROMPT requirements

-- 1. Ensure tiers table structure matches requirements
-- We need: id, user_id, name, color, "order", created_at, updated_at

create extension if not exists pgcrypto;

-- Alter tiers table to match exact requirements
alter table public.tiers
  drop column if exists board_id, -- Removing legacy board_id if it exists
  add column if not exists updated_at timestamptz default now();

-- Rename order_index to "order" if it exists, otherwise add "order"
do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'tiers' and column_name = 'order_index') then
    alter table public.tiers rename column order_index to "order";
  elsif not exists (select 1 from information_schema.columns where table_name = 'tiers' and column_name = 'order') then
    alter table public.tiers add column "order" integer not null default 0;
  end if;
end $$;

-- 2. Create tier_items table (MANDATORY ARCHITECTURE)
create table if not exists public.tier_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tier_id uuid not null references public.tiers(id) on delete cascade,
  series_id integer not null,
  position integer not null default 0,
  media_type text not null default 'ANIME',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Mandatory constraint from prompt
  unique (user_id, tier_id, series_id)
);

-- 3. Data Migration (Best Effort)
-- Move data from user_media (tier_id, tier_position) to tier_items
insert into public.tier_items (user_id, tier_id, series_id, position, media_type)
select 
  user_id, 
  tier_id, 
  series_id, 
  coalesce(tier_position, 0), 
  media_type
from public.user_media
where tier_id is not null
on conflict (user_id, tier_id, series_id) do nothing;

-- 4. Clean up user_media (Remove tier columns as they are no longer source of truth)
alter table public.user_media
  drop column if exists tier_id,
  drop column if exists tier_position;

-- 5. RLS Policies
alter table public.tier_items enable row level security;

drop policy if exists "Users can manage their own tier items" on public.tier_items;
create policy "Users can manage their own tier items"
on public.tier_items
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 6. Realtime
begin;
  -- Remove table from publication if it exists to avoid errors
  alter publication supabase_realtime drop table if exists public.tier_items;
commit;

alter publication supabase_realtime add table public.tier_items;

-- Ensure tiers is in realtime
alter publication supabase_realtime add table public.tiers;

-- 7. Indexes for performance
create index if not exists idx_tier_items_user_id on public.tier_items(user_id);
create index if not exists idx_tier_items_tier_id on public.tier_items(tier_id);
create index if not exists idx_tier_items_user_series on public.tier_items(user_id, series_id);
