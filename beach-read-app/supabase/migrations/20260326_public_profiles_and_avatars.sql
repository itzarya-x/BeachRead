create table if not exists public.public_profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    username text not null,
    display_name text not null,
    avatar_url text,
    bio text,
    total_entries integer not null default 0,
    completed_entries integer not null default 0,
    reading_entries integer not null default 0,
    total_chapters integer not null default 0,
    mean_score numeric(4, 1) not null default 0,
    genre_stats jsonb not null default '[]'::jsonb,
    recent_library jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    constraint public_profiles_username_format check (
        username ~ '^[a-z0-9](?:[a-z0-9._-]{1,28}[a-z0-9])?$'
    )
);

create unique index if not exists public_profiles_username_lower_key
    on public.public_profiles (lower(username));

create or replace function public.touch_public_profiles_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    new.updated_at = timezone('utc', now());
    return new;
end;
$$;

drop trigger if exists touch_public_profiles_updated_at on public.public_profiles;
create trigger touch_public_profiles_updated_at
before update on public.public_profiles
for each row
execute function public.touch_public_profiles_updated_at();

alter table public.public_profiles enable row level security;

drop policy if exists "Public profiles are readable" on public.public_profiles;
create policy "Public profiles are readable"
on public.public_profiles
for select
using (true);

drop policy if exists "Users can insert their own public profile" on public.public_profiles;
create policy "Users can insert their own public profile"
on public.public_profiles
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own public profile" on public.public_profiles;
create policy "Users can update their own public profile"
on public.public_profiles
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own public profile" on public.public_profiles;
create policy "Users can delete their own public profile"
on public.public_profiles
for delete
to authenticated
using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
on storage.objects
for select
using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatars" on storage.objects;
create policy "Users can upload their own avatars"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update their own avatars" on storage.objects;
create policy "Users can update their own avatars"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
)
with check (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete their own avatars" on storage.objects;
create policy "Users can delete their own avatars"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
);
