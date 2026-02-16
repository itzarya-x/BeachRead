-- Migration: User Activity Tracking (v2 - aligned with ActivityLog interface)
-- Date: 2026-02-16

create table if not exists user_activity (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  series_id integer,
  media_id text, -- UUID or ID from vault

  action_type text not null, 
  -- "add", "progress", "status_change", "tier_move", "rating_change", "import", "sync"

  media_type text, -- "ANIME", "MANGA"

  details jsonb default '{}'::jsonb,

  created_at timestamptz default now()
);

-- Indices for performance
create index if not exists idx_user_activity_user_id on user_activity (user_id);
create index if not exists idx_user_activity_created_at on user_activity (created_at desc);
create index if not exists idx_user_activity_action_type on user_activity (action_type);

-- RLS
alter table user_activity enable row level security;

create policy "Users can access their own activity"
on user_activity
for all
using (auth.uid() = user_id);
