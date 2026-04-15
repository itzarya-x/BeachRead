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
    unique(user_id, series_id)
);

alter table public.user_media enable row level security;

create policy "Users can manage their own media"
on public.user_media
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create index if not exists user_media_user_id_idx on public.user_media(user_id);
create index if not exists user_media_series_id_idx on public.user_media(series_id);

create or replace function public.touch_user_media_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

drop trigger if exists touch_user_media_updated_at on public.user_media;
create trigger touch_user_media_updated_at
before update on public.user_media
for each row
execute function public.touch_user_media_updated_at();
