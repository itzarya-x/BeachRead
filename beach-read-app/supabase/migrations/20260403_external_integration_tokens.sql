alter table public.external_integrations
    add column if not exists refresh_token text,
    add column if not exists token_expires_at timestamptz;
