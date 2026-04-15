-- 1) Core Domain Models for Manga Tracking (Normalized Restructuring)

-- Titles (Global metadata cache to avoid AniList/MAL real-time dependency)
create table if not exists public.titles (
  id uuid primary key default gen_random_uuid(),
  series_id bigint not null unique, -- AniList ID
  mal_id bigint,
  title_romaji text not null,
  title_english text,
  title_native text,
  description text,
  genres text[],
  tags text[],
  cover_url text,
  banner_url text,
  status text, -- RELEASING, FINISHED, etc.
  format text, -- MANGA, NOVEL, etc.
  chapters_total integer,
  volumes_total integer,
  average_score numeric(4,2),
  popularity integer,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

-- Library Entries (User-specific tracking)
create table if not exists public.library_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title_id uuid not null references public.titles(id) on delete cascade,
  status text not null default 'PLANNING', -- PLANNING, READING, COMPLETED, PAUSED, DROPPED
  progress integer not null default 0,
  progress_volumes integer not null default 0,
  score numeric(4,1) default 0,
  is_favourite boolean not null default false,
  repeat_count integer not null default 0,
  private_notes text,
  started_at timestamptz,
  completed_at timestamptz,
  last_read_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, title_id)
);

-- Collections (Themed lists/shelves)
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  is_private boolean not null default false,
  color_theme jsonb,
  custom_data jsonb default '{}'::jsonb,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

-- Collection Items (Join table for Collections and Titles with ordering)
create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  title_id uuid not null references public.titles(id) on delete cascade,
  sort_order integer not null default 0,
  added_at timestamptz not null default timezone('utc', now()),
  unique (collection_id, title_id)
);

-- Notes (Detailed thoughts/journals per entry)
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  library_entry_id uuid not null references public.library_entries(id) on delete cascade,
  content text not null,
  chapter_marker integer, -- Optional: link note to a specific progress milestone
  is_public boolean not null default false,
  updated_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

-- Notifications (Real system events)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, -- RELEASE, SYNC_CONFLICT, MILESTONE, SYSTEM
  title text not null,
  message text not null,
  data jsonb default '{}'::jsonb, -- Store related IDs (mangaId, jobId, etc.)
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

-- Sync Jobs (Worker-processed external sync)
create table if not exists public.sync_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null, -- ANILIST, MAL
  job_type text not null, -- INITIAL_IMPORT, INCREMENTAL_PULL, PUSH_LOCAL
  status text not null default 'PENDING', -- PENDING, RUNNING, COMPLETED, FAILED, CONFLICT
  payload jsonb, -- Store remote data or diff
  error_details text,
  conflict_data jsonb, -- Side-by-side diff for UI resolution
  processed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

-- Release Polling (Worker utility to track new chapters)
create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references public.titles(id) on delete cascade,
  chapter_number numeric(10,2) not null,
  chapter_title text,
  released_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (title_id, chapter_number)
);

-- RLS & Policies (Simplified for restructured models)
alter table public.titles enable row level security;
alter table public.library_entries enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.notes enable row level security;
alter table public.notifications enable row level security;
alter table public.sync_jobs enable row level security;
alter table public.releases enable row level security;

-- Public read for titles and releases
create policy "Titles are publicly readable" on public.titles for select using (true);
create policy "Releases are publicly readable" on public.releases for select using (true);

-- User-specific access
create policy "Users manage their library" on public.library_entries for all to authenticated using (auth.uid() = user_id);
create policy "Users manage their collections" on public.collections for all to authenticated using (auth.uid() = user_id);
create policy "Users manage their collection items" on public.collection_items for all to authenticated using (
  exists (select 1 from public.collections where id = collection_id and user_id = auth.uid())
);
create policy "Users manage their notes" on public.notes for all to authenticated using (
  exists (select 1 from public.library_entries where id = library_entry_id and user_id = auth.uid())
);
create policy "Users view their notifications" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "Users manage their sync jobs" on public.sync_jobs for all to authenticated using (auth.uid() = user_id);

-- Indexes for performance
create index idx_library_user_status on public.library_entries(user_id, status);
create index idx_titles_series_id on public.titles(series_id);
create index idx_sync_jobs_user_status on public.sync_jobs(user_id, status);
create index idx_notifications_user_read on public.notifications(user_id, is_read);
create index idx_releases_title_at on public.releases(title_id, released_at desc);
