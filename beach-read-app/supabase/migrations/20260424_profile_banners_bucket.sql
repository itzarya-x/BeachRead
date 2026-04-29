-- 20260424_profile_banners_bucket.sql
-- Create a new bucket for profile banners

insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do nothing;

drop policy if exists "Banner images are publicly readable" on storage.objects;
create policy "Banner images are publicly readable"
on storage.objects
for select
using (bucket_id = 'banners');

drop policy if exists "Users can upload their own banners" on storage.objects;
create policy "Users can upload their own banners"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'banners'
    and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update their own banners" on storage.objects;
create policy "Users can update their own banners"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'banners'
    and (select auth.uid())::text = (storage.foldername(name))[1]
)
with check (
    bucket_id = 'banners'
    and (select auth.uid())::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete their own banners" on storage.objects;
create policy "Users can delete their own banners"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'banners'
    and (select auth.uid())::text = (storage.foldername(name))[1]
);
