alter table public.public_profiles 
add column if not exists banner_url text,
add column if not exists location text,
add column if not exists website text,
add column if not exists twitter_handle text,
add column if not exists is_private boolean not null default false,
add column if not exists show_stats boolean not null default true,
add column if not exists custom_colors jsonb not null default '{"primary": "#F77F00", "background": "#000000"}'::jsonb;
