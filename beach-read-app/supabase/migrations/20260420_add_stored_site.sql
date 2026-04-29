-- Add stored_site column to user_media for jumping to specific sources
alter table public.user_media 
add column if not exists stored_site text;

-- Add a comment for documentation
comment on column public.user_media.stored_site is 'A custom URL for the user to quickly access their preferred reading/watching source for this series.';
