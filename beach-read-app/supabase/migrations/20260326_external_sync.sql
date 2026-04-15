create table if not exists public.external_integrations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    provider text not null,
    status text not null default 'connected',
    username text not null,
    access_token text,
    sync_mode text not null default 'manual',
    conflict_mode text not null default 'newest_wins',
    last_sync_at timestamptz,
    last_pull_at timestamptz,
    last_push_at timestamptz,
    last_error text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    constraint external_integrations_provider_check check (provider in ('anilist', 'mal')),
    constraint external_integrations_status_check check (status in ('connected', 'disconnected', 'error')),
    constraint external_integrations_sync_mode_check check (sync_mode in ('manual', 'import-only', 'bidirectional')),
    constraint external_integrations_conflict_mode_check check (conflict_mode in ('local_wins', 'provider_wins', 'newest_wins')),
    constraint external_integrations_user_provider_key unique (user_id, provider)
);

create table if not exists public.external_sync_jobs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    provider text not null,
    direction text not null,
    sync_mode text not null default 'manual',
    status text not null default 'pending',
    items_processed integer not null default 0,
    items_total integer not null default 0,
    error_message text,
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    constraint external_sync_jobs_provider_check check (provider in ('anilist', 'mal')),
    constraint external_sync_jobs_direction_check check (direction in ('import', 'pull', 'export', 'push')),
    constraint external_sync_jobs_sync_mode_check check (sync_mode in ('manual', 'import-only', 'bidirectional')),
    constraint external_sync_jobs_status_check check (status in ('pending', 'running', 'completed', 'failed'))
);

create table if not exists public.external_media_mappings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    provider text not null,
    series_id bigint not null,
    provider_media_id text not null,
    provider_media_type text not null default 'MANGA',
    provider_title text,
    local_title text,
    provider_updated_at timestamptz,
    last_seen_at timestamptz not null default timezone('utc', now()),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    constraint external_media_mappings_provider_check check (provider in ('anilist', 'mal')),
    constraint external_media_mappings_media_type_check check (provider_media_type in ('MANGA')),
    constraint external_media_mappings_user_provider_series_key unique (user_id, provider, series_id),
    constraint external_media_mappings_user_provider_media_key unique (user_id, provider, provider_media_id)
);

create index if not exists external_sync_jobs_user_created_idx
    on public.external_sync_jobs (user_id, created_at desc);

create index if not exists external_media_mappings_user_provider_series_idx
    on public.external_media_mappings (user_id, provider, series_id);

create or replace function public.touch_external_sync_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

drop trigger if exists touch_external_integrations_updated_at on public.external_integrations;
create trigger touch_external_integrations_updated_at
before update on public.external_integrations
for each row
execute function public.touch_external_sync_updated_at();

drop trigger if exists touch_external_sync_jobs_updated_at on public.external_sync_jobs;
create trigger touch_external_sync_jobs_updated_at
before update on public.external_sync_jobs
for each row
execute function public.touch_external_sync_updated_at();

drop trigger if exists touch_external_media_mappings_updated_at on public.external_media_mappings;
create trigger touch_external_media_mappings_updated_at
before update on public.external_media_mappings
for each row
execute function public.touch_external_sync_updated_at();

alter table public.external_integrations enable row level security;
alter table public.external_sync_jobs enable row level security;
alter table public.external_media_mappings enable row level security;

drop policy if exists "Users manage their external integrations" on public.external_integrations;
create policy "Users manage their external integrations"
on public.external_integrations
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their external sync jobs" on public.external_sync_jobs;
create policy "Users manage their external sync jobs"
on public.external_sync_jobs
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their external media mappings" on public.external_media_mappings;
create policy "Users manage their external media mappings"
on public.external_media_mappings
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
