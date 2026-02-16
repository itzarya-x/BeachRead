-- Migration: User Activity Tracking (v2 - aligned with ActivityLog interface)
-- Date: 2026-02-16

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  series_id integer,
  media_id text, -- UUID or ID from vault

  action_type text not null, 
  -- "add", "progress", "complete", "drop", "score_change", "tier_change"

  media_type text, -- "ANIME", "MANGA"

  details jsonb default '{}'::jsonb,

  created_at timestamptz default now()
);

-- Indices for performance
create index if not exists idx_activity_log_user_id on activity_log (user_id);
create index if not exists idx_activity_log_created_at on activity_log (created_at desc);
create index if not exists idx_activity_log_action_type on activity_log (action_type);

-- RLS
alter table activity_log enable row level security;

create policy "Users can access their own activity"
on activity_log
for all
using (auth.uid() = user_id);
