create table if not exists public.api_cache (
  cache_key text primary key,
  payload jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 hour'),
  cooldown_until timestamptz null,
  updated_at timestamptz not null default now()
);

alter table public.api_cache enable row level security;

-- Backend should use service role key; no anon policies needed.
