# BeachRead Application

A modern frontend application built with React, Vite, and Tailwind CSS, replicating the BeachRead Figma prototype aesthetics. This includes a fully functional UI hierarchy and a Node.js Express backend API to provide mock layout data.

## Project Structure
- `/client`: React Vite Frontend application
- `/api`: Node.js Express Backend API

## How to Run

### 1. One-time install
```bash
cd beach-read-app
npm run install:all
```

### 2. Single start command (frontend + backend)
```bash
cd beach-read-app
npm run dev
```
*This starts both API (`http://localhost:3001`) and frontend (`http://localhost:5173`) together.*

### Optional Cloud Cache (Supabase)
To share AniList cache across restarts/instances:

1. Apply [`supabase/migrations/20260403_api_cache.sql`](./supabase/migrations/20260403_api_cache.sql)
2. Set API env vars from [`api/.env.example`](./api/.env.example)

The API will still work with local disk cache when these vars are not set.

### 3. Configure Supabase Auth (Required for login/register)
Set frontend environment variables in `client/.env` (or `.env.local`) based on [`client/.env.example`](./client/.env.example):

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_AUTH_REDIRECT_URL=http://localhost:5173
```

In Supabase dashboard, configure these URLs:
- `Authentication` -> `URL Configuration` -> `Site URL`: `http://localhost:5173` (for local dev)
- `Authentication` -> `URL Configuration` -> `Redirect URLs`:
  - `http://localhost:5173`
  - `http://localhost:5173/verify-email`
  - `http://localhost:5173/reset-password`

If you also have a cloud site URL configured, keep `VITE_AUTH_REDIRECT_URL=http://localhost:5173` locally so OAuth returns to localhost.

Schema-backed Supabase features used by this app:
- `public.user_media`: Cloud storage for library items (Migration: `20260404_user_media.sql`)
- `public.public_profiles`: Customizable user profiles (Migrations: `20260326_public_profiles_and_avatars.sql`, `20260404_public_profiles_customization.sql`)
- Existing projects created before April 2026 should also apply `20260404_profile_customization_and_library_sync.sql` to backfill profile customization fields, normalize `user_media`, and update RLS/trigger behavior.
- `public.external_integrations`: Provider connection storage (AniList/MAL)
- `public.external_sync_jobs`: Sync history and job status tracking
- `public.external_media_mappings`: Mappings between local entries and provider media IDs
- `public.api_cache`: Backend API response caching
- `storage.buckets` / `storage.objects`: `avatars` bucket for user profile photos

The tracked SQL for these objects lives under [`supabase/migrations`](./supabase/migrations). Apply them sequentially to a fresh Supabase project.

Tracking sync provider setup:
- Manual bearer token entry is still supported in the account settings UI.
- OAuth connect is available when the API server is configured with provider credentials in `api/.env.local`.
- The app validates the token against the provider before saving the connection.
- If you enter a username manually, it must match the provider account resolved from that token.
- If you leave username blank, the app fills it from the verified provider identity.
- OAuth refresh metadata lives in `public.external_integrations.refresh_token` and `public.external_integrations.token_expires_at`, created by [`supabase/migrations/20260403_external_integration_tokens.sql`](./supabase/migrations/20260403_external_integration_tokens.sql).
- For local OAuth testing, set these API env vars: `ANILIST_CLIENT_ID`, `ANILIST_CLIENT_SECRET`, `ANILIST_REDIRECT_URI`, `MAL_CLIENT_ID`, `MAL_CLIENT_SECRET`, `MAL_REDIRECT_URI`, `OAUTH_FRONTEND_ORIGIN`.
- `OAUTH_FRONTEND_ORIGIN` is the allowlist used for API CORS and OAuth popup callbacks. Use a comma-separated list if you need both `http://localhost:5173` and a deployed frontend origin.

Email confirmation behavior:
- If `Confirm email` is enabled in Supabase, users must verify email before first login.
- If disabled, signup can immediately create an active session.

Google sign-in setup:
- In Supabase: `Authentication` -> `Providers` -> enable `Google`.
- In Google Cloud OAuth client, add this Authorized redirect URI:
  - `https://<your-project-ref>.supabase.co/auth/v1/callback`
- In Supabase Google provider settings, set your Google OAuth Client ID and Client Secret.

## Key Features Implemented:
* **Tailwind CSS Styling**: Faithfully recreated the Figma dark blue `#001B2E`, cream background base, and crisp typography using the Inter font.
* **Reusable UI Components**: Custom built `Button`, `Tabs`, `Badge` components relying strictly on Tailwind utility classes and variants and a CSS variable themed configuration.
* **Component-Based Architecture**: Separation of concerns matching the UX flow (`HeroFeature`, `LatestUpdateCard`, `RankingTable`, `MangaCard`).
* **Express Integration**: Uses a custom `useFetch` hook to connect to the Node.js backend.
* **React Router**: Routing functionality covering Home (`/`), Library (`/discover`), and specific Manga profiles (`/manga/:id`).
