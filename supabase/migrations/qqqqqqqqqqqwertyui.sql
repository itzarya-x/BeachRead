-- Compatibility patch for TierMaker cloud schema.
-- Aligns legacy tier tables with app expectations:
-- tiers.user_id + tiers.order_index and user_media.tier_id + user_media.tier_position.

create extension if not exists pgcrypto;

alter table public.tiers
  add column if not exists user_id uuid,
  add column if not exists order_index integer,
  add column if not exists created_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='tiers' and column_name='board_id'
  ) then
    update public.tiers t
    set user_id = b.user_id
    from public.tier_boards b
    where t.board_id = b.id and t.user_id is null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='tiers' and column_name='order'
  ) then
    execute 'update public.tiers set order_index = "order" where order_index is null and "order" is not null';
  end if;
end $$;

alter table public.tiers
  alter column user_id set not null,
  alter column order_index set not null;

alter table public.tiers drop constraint if exists tiers_user_id_fkey;
alter table public.tiers
  add constraint tiers_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.user_media
  add column if not exists tier_id uuid,
  add column if not exists tier_position integer;

alter table public.user_media drop constraint if exists user_media_tier_id_fkey;
alter table public.user_media
  add constraint user_media_tier_id_fkey
  foreign key (tier_id) references public.tiers(id) on delete set null;

create index if not exists idx_tiers_user_id_order_index
  on public.tiers(user_id, order_index);

create index if not exists idx_user_media_user_tier_position
  on public.user_media(user_id, tier_id, tier_position);

alter table public.tiers enable row level security;

drop policy if exists "Users can manage their own tiers" on public.tiers;

create policy "Users can manage their own tiers"
on public.tiers
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
