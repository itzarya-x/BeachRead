-- 1) Enhance public profiles with customization fields used by frontend
alter table public.public_profiles
add column if not exists banner_url text,
add column if not exists location text,
add column if not exists website text,
add column if not exists twitter_handle text,
add column if not exists is_private boolean not null default false,
add column if not exists show_stats boolean not null default true,
add column if not exists custom_colors jsonb not null default '{"primary": "#F77F00", "background": "#000000"}'::jsonb;

-- 2) Ensure user_media exists and aligns with sync schema
create table if not exists public.user_media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  series_id bigint not null,
  media_type text not null default 'MANGA',
  status text,
  score integer default 0,
  progress integer default 0,
  progress_volumes integer default 0,
  repeat integer default 0,
  started_at date,
  completed_at date,
  raw_media jsonb not null default '{}'::jsonb,
  raw_list_entry jsonb not null default '{}'::jsonb,
  deleted boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, series_id)
);

alter table public.user_media
  alter column series_id type bigint using series_id::bigint,
  alter column series_id drop default,
  alter column media_type set default 'MANGA',
  alter column score set default 0,
  alter column progress set default 0,
  alter column progress_volumes set default 0,
  alter column repeat set default 0,
  alter column raw_media set default '{}'::jsonb,
  alter column raw_list_entry set default '{}'::jsonb,
  alter column deleted set default false;

-- Normalize timestamp columns for older schemas.
alter table public.user_media
  alter column created_at type timestamptz using created_at at time zone 'UTC',
  alter column updated_at type timestamptz using updated_at at time zone 'UTC';

update public.user_media
set created_at = timezone('utc', now())
where created_at is null;

update public.user_media
set updated_at = timezone('utc', now())
where updated_at is null;

update public.user_media
set raw_media = '{}'::jsonb
where raw_media is null;

update public.user_media
set raw_list_entry = '{}'::jsonb
where raw_list_entry is null;

alter table public.user_media
  alter column user_id set not null,
  alter column series_id set not null,
  alter column media_type set not null,
  alter column raw_media set not null,
  alter column raw_list_entry set not null,
  alter column deleted set not null,
  alter column created_at set not null,
  alter column updated_at set not null,
  alter column created_at set default timezone('utc', now()),
  alter column updated_at set default timezone('utc', now());

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_media_user_id_fkey'
      and conrelid = 'public.user_media'::regclass
  ) then
    alter table public.user_media
      add constraint user_media_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end
$$;

create index if not exists user_media_user_id_idx on public.user_media(user_id);
create index if not exists user_media_series_id_idx on public.user_media(series_id);

-- 3) RLS + policy
alter table public.user_media enable row level security;

drop policy if exists "Users can manage their own media" on public.user_media;
drop policy if exists "Users can manage their media" on public.user_media;

create policy "Users can manage their own media"
on public.user_media
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- 4) Touch updated_at on mutation
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists touch_user_media_updated_at on public.user_media;
create trigger touch_user_media_updated_at
before update on public.user_media
for each row execute function public.touch_updated_at();
