# BeachRead Client

BeachRead keeps the UI/routes from this app, and uses:

- Supabase auth/session for private user access
- Supabase `user_media` for authenticated library data
- Supabase `public_profiles`, `external_integrations`, `external_sync_jobs`, and `external_media_mappings`
- Local guest storage fallback for unauthenticated mode
- Public `/api/*` for discovery/search/trending content plus AniList/MAL OAuth helpers

## Environment

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`
- `VITE_AUTH_REDIRECT_URL`

## Run

```bash
npm install
npm run dev
```

If you also want discovery endpoints, run the companion API server in `../api` and keep Vite proxy enabled.
Provider OAuth and MAL token refresh also require the API server.

## Auth/Data Flow

- `AuthContext` restores session with `supabase.auth.getSession()`.
- Login/Register/Logout call Supabase auth methods.
- Avatar uploads use Supabase Storage bucket `avatars`.
- `DataContext` switches behavior:
  - authenticated + configured Supabase: cloud `user_media` CRUD
  - otherwise: local guest library storage
- Profile and stats are derived from Supabase-backed auth/data contexts.
- `TrackingSyncPanel` persists provider connections, sync jobs, and media mappings in Supabase and can connect through manual tokens or API-backed OAuth.
