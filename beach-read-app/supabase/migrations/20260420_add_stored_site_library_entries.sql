-- Add reader_url to library_entries for specific reading source tracking
alter table public.library_entries 
add column if not exists reader_url text;

-- Add comment for documentation
comment on column public.library_entries.reader_url is 'A custom URL for the user to quickly access their preferred reading/watching source for this specific library entry.';
