# Manga Archive System Architecture

## 1. Domain Model
The system uses a normalized PostgreSQL schema in Supabase.
- **Titles**: Global cache of manga/anime metadata (AniList/MAL).
- **Library Entries**: User-specific tracking (Progress, Status, Score).
- **Sync Jobs**: Async tracking of provider synchronization.
- **Notifications**: Real-time system events (Releases, Conflicts).

## 2. Sync Engine
- **Providers**: Native support for AniList (GraphQL) and MyAnimeList (REST).
- **Conflict Resolution**: Detects mismatches between local and remote states. Flags entries for user resolution when delta > 1 chapter or status differs.
- **Retry Logic**: Handles 429 rate limits and 5xx errors with exponential backoff via background workers.

## 3. Worker System
- **Sync Worker**: Processes `sync_jobs` from the database.
- **Release Poller**: Cron-based worker (every 2 hours) that checks for new chapters/episodes of titles in active reading lists.
- **Notification Worker**: Triggers real-time alerts for users based on database events.

## 4. Recommendation Engine
- **Finish Quickly**: RPC identifying series > 80% complete.
- **Short Reads**: RPC suggesting series < 30 chapters from planning list.
- **Next to Read**: View providing immediate resume links for the most recently read active series.

## 5. Scalability & Performance
- **Caching**: Aggressive caching of external API metadata in the `titles` table.
- **Optimistic UI**: Frontend updates locally before API confirmation.
- **Indexing**: Optimized for `user_id` and `status` queries.
