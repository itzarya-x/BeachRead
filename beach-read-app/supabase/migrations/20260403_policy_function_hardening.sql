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
