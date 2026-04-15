create table if not exists public.api_cache (
    cache_key text primary key,
    payload jsonb not null,
    fetched_at timestamptz not null default now(),
    expires_at timestamptz not null default (now() + interval '1 hour'),
    cooldown_until timestamptz,
    updated_at timestamptz not null default now()
);

alter table public.api_cache enable row level security;

create or replace function public.touch_api_cache_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists touch_api_cache_updated_at on public.api_cache;
create trigger touch_api_cache_updated_at
before update on public.api_cache
for each row
execute function public.touch_api_cache_updated_at();

-- API writes via service role; no anon/authenticated policies are required.
