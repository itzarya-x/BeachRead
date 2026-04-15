-- 1) Add Favorite Characters storage to public profiles
alter table public.public_profiles
add column if not exists favorite_characters jsonb not null default '[]'::jsonb;

-- 2) Add explicit favourite flag to user_media for reliable filtering/sync
alter table public.user_media
add column if not exists is_favourite boolean not null default false;

-- 3) Index json payload used for AniList custom lists
create index if not exists user_media_custom_lists_idx
on public.user_media using gin (raw_list_entry);
