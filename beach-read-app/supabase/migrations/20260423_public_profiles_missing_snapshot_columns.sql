-- Columns expected by client (publicProfile.ts) but absent on some deployments.
alter table public.public_profiles
  add column if not exists favorites_count integer not null default 0,
  add column if not exists favorite_manga_order jsonb not null default '[]'::jsonb,
  add column if not exists pinned_manga_ids jsonb not null default '[]'::jsonb,
  add column if not exists anime_stats jsonb,
  add column if not exists manga_stats jsonb;

comment on column public.public_profiles.favorites_count is 'Cached count of favorited library entries for public profile stats.';
comment on column public.public_profiles.favorite_manga_order is 'Ordered list of series IDs (strings) for favorites showcase.';
comment on column public.public_profiles.pinned_manga_ids is 'Pinned / highlighted series IDs for profile showcase.';
comment on column public.public_profiles.anime_stats is 'Serialized anime breakdown for public profile (JSON).';
comment on column public.public_profiles.manga_stats is 'Serialized manga breakdown for public profile (JSON).';
