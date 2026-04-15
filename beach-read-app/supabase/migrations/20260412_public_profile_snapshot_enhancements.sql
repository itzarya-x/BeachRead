alter table public.public_profiles 
add column if not exists favorites_count integer not null default 0;
