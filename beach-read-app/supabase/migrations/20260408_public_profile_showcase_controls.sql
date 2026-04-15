alter table public.public_profiles
add column if not exists profile_sections jsonb not null default '{
  "visible": {
    "stats": true,
    "snapshot": true,
    "now_reading": true,
    "featured_collections": true,
    "favorites": true,
    "changelog": true,
    "archive": true,
    "characters": true
  },
  "order": ["now_reading","snapshot","stats","featured_collections","favorites","changelog","archive","characters"]
}'::jsonb,
add column if not exists profile_privacy jsonb not null default '{
  "showScores": true,
  "showProgress": true,
  "showDroppedPaused": true,
  "hideAdultContent": false
}'::jsonb,
add column if not exists featured_collections jsonb not null default '[]'::jsonb,
add column if not exists snapshot_cards jsonb not null default '["archive_overview","completion_ratio","top_genre"]'::jsonb,
add column if not exists now_reading jsonb,
add column if not exists public_changelog jsonb not null default '[]'::jsonb;
