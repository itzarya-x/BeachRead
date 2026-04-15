# Scalable Backend Redesign

## Current Gaps Observed

- `client/src/context/DataContext.tsx` and related hooks still carry too much application state and orchestration.
- `worker/index.js` simulates conflict behavior and blends polling, sync processing, and notification writes in one loop.
- `api/services/syncService.js` treats provider fetch + merge + upsert as a single path and lacks source-of-truth versioning, retries, and durable conflict records.
- Recent migrations define useful tables, but the current model still mixes provider cache, local state, and notification/event concerns.

This redesign keeps Supabase/Postgres as the system of record and adds a dedicated worker layer for asynchronous processing.

---

## 1. Domain Model

### Core Principles

- `title` is global metadata, never user-owned.
- `library_entry` is the user’s canonical local state.
- provider state is stored separately from local state so sync can compare snapshots instead of overwriting blindly.
- notifications are produced from domain events, not UI activity logs.
- all mutating flows append history.

### Entity List

#### `profiles`

Extends `auth.users` with product-facing user settings.

| Column | Type | Constraints |
| --- | --- | --- |
| `user_id` | `uuid` | PK, FK -> `auth.users.id` |
| `handle` | `citext` | unique, not null |
| `display_name` | `text` | not null |
| `avatar_url` | `text` | null |
| `timezone` | `text` | not null default `'UTC'` |
| `reading_speed_chapters_per_hour` | `numeric(6,2)` | null |
| `notification_preferences` | `jsonb` | not null default `'{}'::jsonb` |
| `created_at` | `timestamptz` | not null default `now()` |
| `updated_at` | `timestamptz` | not null default `now()` |

#### `titles`

Canonical manga metadata, provider-agnostic.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `canonical_slug` | `text` | unique, not null |
| `primary_title` | `text` | not null |
| `title_romaji` | `text` | null |
| `title_english` | `text` | null |
| `title_native` | `text` | null |
| `format` | `text` | check in `('MANGA','NOVEL','ONE_SHOT')` |
| `publishing_status` | `text` | check in `('RELEASING','FINISHED','HIATUS','CANCELLED','NOT_YET_RELEASED')` |
| `description` | `text` | null |
| `cover_image_url` | `text` | null |
| `banner_image_url` | `text` | null |
| `chapter_count` | `integer` | check `>= 0` |
| `volume_count` | `integer` | check `>= 0` |
| `metadata_version` | `bigint` | not null default `1` |
| `source_updated_at` | `timestamptz` | null |
| `created_at` | `timestamptz` | not null |
| `updated_at` | `timestamptz` | not null |

#### `title_provider_mappings`

Maps one canonical title to each provider’s title id.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `title_id` | `uuid` | FK -> `titles.id`, not null |
| `provider` | `text` | check in `('ANILIST','MAL')`, not null |
| `provider_title_id` | `text` | not null |
| `provider_payload` | `jsonb` | not null default `'{}'::jsonb` |
| `last_seen_at` | `timestamptz` | not null |
| `created_at` | `timestamptz` | not null |
| `updated_at` | `timestamptz` | not null |

Constraints:

- unique (`provider`, `provider_title_id`)
- unique (`title_id`, `provider`)

#### `library_entries`

User-owned local source of truth.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK -> `auth.users.id`, not null |
| `title_id` | `uuid` | FK -> `titles.id`, not null |
| `status` | `text` | check in `('PLANNING','READING','PAUSED','COMPLETED','DROPPED')`, not null |
| `progress_chapters` | `integer` | not null default `0`, check `>= 0` |
| `progress_volumes` | `integer` | not null default `0`, check `>= 0` |
| `score` | `numeric(4,1)` | null, check between `0` and `10` |
| `started_at` | `timestamptz` | null |
| `completed_at` | `timestamptz` | null |
| `last_read_at` | `timestamptz` | null |
| `is_favorite` | `boolean` | not null default `false` |
| `entry_version` | `bigint` | not null default `1` |
| `last_mutation_source` | `text` | check in `('WEB','MOBILE','SYNC_PULL','SYNC_PUSH','SYSTEM')`, not null |
| `created_at` | `timestamptz` | not null |
| `updated_at` | `timestamptz` | not null |

Constraints:

- unique (`user_id`, `title_id`)
- `completed_at` must be non-null only when `status = 'COMPLETED'`
- optional trigger to enforce `progress_chapters <= titles.chapter_count` when chapter count is known

#### `collections`

Named shelves owned by a user.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK -> `auth.users.id`, not null |
| `name` | `text` | not null |
| `description` | `text` | null |
| `visibility` | `text` | check in `('PRIVATE','UNLISTED','PUBLIC')`, not null default `'PRIVATE'` |
| `sort_mode` | `text` | check in `('MANUAL','ADDED_AT','TITLE','PROGRESS')`, not null default `'MANUAL'` |
| `created_at` | `timestamptz` | not null |
| `updated_at` | `timestamptz` | not null |

Constraints:

- unique (`user_id`, `name`)

#### `collection_items`

Join between collection and title.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `collection_id` | `uuid` | FK -> `collections.id`, not null |
| `title_id` | `uuid` | FK -> `titles.id`, not null |
| `sort_order` | `integer` | not null default `0` |
| `added_by_user_id` | `uuid` | FK -> `auth.users.id`, not null |
| `created_at` | `timestamptz` | not null |

Constraints:

- unique (`collection_id`, `title_id`)
- unique (`collection_id`, `sort_order`)

#### `notes`

User annotations attached to a library entry.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `library_entry_id` | `uuid` | FK -> `library_entries.id`, not null |
| `user_id` | `uuid` | FK -> `auth.users.id`, not null |
| `chapter_marker` | `integer` | null, check `>= 0` |
| `visibility` | `text` | check in `('PRIVATE','PUBLIC')`, not null default `'PRIVATE'` |
| `body` | `text` | not null |
| `created_at` | `timestamptz` | not null |
| `updated_at` | `timestamptz` | not null |

Constraints:

- `user_id` must match the owner of `library_entry_id`

#### `notifications`

Durable inbox records.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK -> `auth.users.id`, not null |
| `type` | `text` | check in `('NEW_RELEASE','SYNC_CONFLICT','MILESTONE','FOLLOWED_TITLE_UPDATE','SYSTEM')`, not null |
| `actor_type` | `text` | null |
| `reference_type` | `text` | check in `('RELEASE','SYNC_CONFLICT','LIBRARY_ENTRY','TITLE','SYSTEM')`, not null |
| `reference_id` | `uuid` | not null |
| `title` | `text` | not null |
| `body` | `text` | not null |
| `payload` | `jsonb` | not null default `'{}'::jsonb` |
| `read_at` | `timestamptz` | null |
| `created_at` | `timestamptz` | not null |

Constraints:

- partial unique index to dedupe repeated alerts:
  - unique (`user_id`, `type`, `reference_type`, `reference_id`)

#### `sync_connections`

User-provider auth and policy.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK -> `auth.users.id`, not null |
| `provider` | `text` | check in `('ANILIST','MAL')`, not null |
| `provider_user_id` | `text` | not null |
| `provider_username` | `text` | null |
| `status` | `text` | check in `('CONNECTED','REQUIRES_REAUTH','DISCONNECTED')`, not null |
| `sync_mode` | `text` | check in `('IMPORT_ONLY','BIDIRECTIONAL')`, not null |
| `default_conflict_policy` | `text` | check in `('ASK','LOCAL_WINS','REMOTE_WINS','LATEST_WRITE_WINS')`, not null default `'ASK'` |
| `access_token_encrypted` | `text` | null |
| `refresh_token_encrypted` | `text` | null |
| `token_expires_at` | `timestamptz` | null |
| `cursor` | `text` | null |
| `last_full_sync_at` | `timestamptz` | null |
| `last_incremental_sync_at` | `timestamptz` | null |
| `last_successful_push_at` | `timestamptz` | null |
| `created_at` | `timestamptz` | not null |
| `updated_at` | `timestamptz` | not null |

Constraints:

- unique (`user_id`, `provider`)

#### `sync_jobs`

Job envelope processed by workers.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK -> `auth.users.id`, not null |
| `sync_connection_id` | `uuid` | FK -> `sync_connections.id`, not null |
| `provider` | `text` | not null |
| `job_type` | `text` | check in `('INITIAL_IMPORT','INCREMENTAL_PULL','INCREMENTAL_PUSH','FULL_RECONCILIATION')`, not null |
| `status` | `text` | check in `('PENDING','RUNNING','AWAITING_CONFLICT_RESOLUTION','RETRYABLE_FAILURE','FAILED','COMPLETED','CANCELLED')`, not null |
| `priority` | `smallint` | not null default `100` |
| `requested_by` | `text` | check in `('USER','SYSTEM','SCHEDULED')`, not null |
| `attempt_count` | `integer` | not null default `0` |
| `max_attempts` | `integer` | not null default `5` |
| `idempotency_key` | `text` | not null |
| `source_snapshot` | `jsonb` | null |
| `result_summary` | `jsonb` | null |
| `error_code` | `text` | null |
| `error_message` | `text` | null |
| `scheduled_at` | `timestamptz` | not null default `now()` |
| `started_at` | `timestamptz` | null |
| `finished_at` | `timestamptz` | null |
| `created_at` | `timestamptz` | not null |
| `updated_at` | `timestamptz` | not null |

Constraints:

- unique (`idempotency_key`)
- index on (`status`, `scheduled_at`, `priority`)

#### `sync_conflicts`

Conflict rows consumed directly by frontend.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `sync_job_id` | `uuid` | FK -> `sync_jobs.id`, not null |
| `user_id` | `uuid` | FK -> `auth.users.id`, not null |
| `title_id` | `uuid` | FK -> `titles.id`, not null |
| `library_entry_id` | `uuid` | FK -> `library_entries.id`, not null |
| `provider` | `text` | not null |
| `conflict_type` | `text` | check in `('STATUS_MISMATCH','PROGRESS_MISMATCH','SCORE_MISMATCH','DELETE_VS_UPDATE')`, not null |
| `local_snapshot` | `jsonb` | not null |
| `remote_snapshot` | `jsonb` | not null |
| `suggested_resolution` | `text` | check in `('LOCAL','REMOTE','MANUAL')`, not null |
| `resolved_with` | `text` | check in `('LOCAL','REMOTE','MANUAL')`, null |
| `resolved_at` | `timestamptz` | null |
| `resolved_by` | `uuid` | FK -> `auth.users.id`, null |
| `created_at` | `timestamptz` | not null |

Constraints:

- unresolved unique (`sync_job_id`, `library_entry_id`, `conflict_type`)

#### `provider_library_snapshots`

Last known provider-side state per title. This is critical for diffing and conflict detection.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK -> `auth.users.id`, not null |
| `provider` | `text` | not null |
| `title_id` | `uuid` | FK -> `titles.id`, not null |
| `provider_entry_id` | `text` | not null |
| `provider_status` | `text` | not null |
| `provider_progress_chapters` | `integer` | not null default `0` |
| `provider_progress_volumes` | `integer` | not null default `0` |
| `provider_score` | `numeric(4,1)` | null |
| `provider_updated_at` | `timestamptz` | null |
| `raw_payload` | `jsonb` | not null |
| `snapshot_hash` | `text` | not null |
| `last_pulled_at` | `timestamptz` | not null |
| `created_at` | `timestamptz` | not null |
| `updated_at` | `timestamptz` | not null |

Constraints:

- unique (`user_id`, `provider`, `title_id`)

#### `releases`

Normalized release events for a title.

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | `uuid` | PK |
| `title_id` | `uuid` | FK -> `titles.id`, not null |
| `provider` | `text` | check in `('ANILIST','MAL','INTERNAL')`, not null |
| `provider_release_id` | `text` | null |
| `chapter_number` | `numeric(10,2)` | not null |
| `volume_number` | `numeric(10,2)` | null |
| `release_title` | `text` | null |
| `released_at` | `timestamptz` | not null |
| `detected_at` | `timestamptz` | not null default `now()` |
| `payload` | `jsonb` | not null default `'{}'::jsonb` |

Constraints:

- unique (`title_id`, `chapter_number`)
- if provider release ids are stable, also unique (`provider`, `provider_release_id`)

#### Supporting Tables

These are required for integrity and analytics even though they were not listed in the strict entity set:

- `library_entry_history`: append-only before/after snapshots for every user mutation and sync mutation.
- `outbox_events`: transactional event outbox for notification generation and downstream workers.
- `user_title_follows`: users can follow titles even without a library entry.
- `reading_sessions`: optional event stream for queue estimation and streaks.

### Key Relationships

- `auth.users 1 -> 1 profiles`
- `titles 1 -> many title_provider_mappings`
- `auth.users 1 -> many library_entries`
- `titles 1 -> many library_entries`
- `collections 1 -> many collection_items`
- `titles 1 -> many collection_items`
- `library_entries 1 -> many notes`
- `auth.users 1 -> many notifications`
- `auth.users 1 -> many sync_connections`
- `sync_connections 1 -> many sync_jobs`
- `sync_jobs 1 -> many sync_conflicts`
- `titles 1 -> many releases`
- `auth.users + titles + provider -> provider_library_snapshots`

---

## 2. Sync System

### Sync Objectives

- support AniList and MAL without making either provider the local source of truth.
- separate initial import, incremental pull, and push flows.
- preserve enough state for deterministic conflict UI.
- support retries and resume without duplicate writes.

### Source Tracking

Every library mutation writes:

- `library_entries.last_mutation_source`
- `library_entries.entry_version`
- `library_entry_history.source`
- optional `origin_request_id` for deduping optimistic updates

Every provider pull writes:

- `provider_library_snapshots.raw_payload`
- `provider_library_snapshots.provider_updated_at`
- `provider_library_snapshots.snapshot_hash`

### Sync Types

#### Initial Import

Use when a user connects AniList or MAL for the first time.

Flow:

1. Create `sync_job(job_type='INITIAL_IMPORT')`.
2. Worker fetches all remote pages.
3. Upsert `titles` and `title_provider_mappings`.
4. Create `provider_library_snapshots`.
5. For each remote entry:
   - if no local `library_entry`, create one with `last_mutation_source='SYNC_PULL'`
   - if local entry exists, create `sync_conflict` unless policy is explicit
6. Mark job `COMPLETED` or `AWAITING_CONFLICT_RESOLUTION`.

#### Incremental Updates

Split into pull and push.

`INCREMENTAL_PULL`

- fetch changes since provider cursor or last sync timestamp
- refresh `provider_library_snapshots`
- compare snapshot against local `library_entry`
- if no conflict, apply patch to local
- emit outbox events for milestone or release-follow impacts if relevant

`INCREMENTAL_PUSH`

- triggered after local mutations for connected bidirectional accounts
- worker reads changed `library_entries` since last push watermark
- sends idempotent provider updates
- updates `provider_library_snapshots` with returned provider state

#### Conflict Resolution

Conflict logic should compare:

- current local `library_entry`
- latest `provider_library_snapshot`
- previous known synced version if available

Conflicts exist when:

- local and remote both changed since last known aligned state
- status transitions diverge
- progress regresses in one source without a matching status change
- delete/drop vs continue/update occurs

### Conflict UI Contract

Frontend needs side-by-side payloads. `sync_conflicts` should expose:

```json
{
  "id": "uuid",
  "title": {
    "id": "uuid",
    "primaryTitle": "One Piece",
    "coverImageUrl": "..."
  },
  "conflictType": "PROGRESS_MISMATCH",
  "local": {
    "status": "READING",
    "progressChapters": 120,
    "score": 8,
    "updatedAt": "2026-04-14T10:00:00Z",
    "source": "WEB"
  },
  "remote": {
    "provider": "ANILIST",
    "status": "COMPLETED",
    "progressChapters": 122,
    "score": 9,
    "updatedAt": "2026-04-14T10:03:00Z"
  },
  "suggestedResolution": "REMOTE"
}
```

Conflict resolution endpoints must allow:

- accept local
- accept remote
- submit manual merge payload

### Retry and Failure Handling

- use exponential backoff with jitter for provider failures.
- move retryable errors to `RETRYABLE_FAILURE`; workers reschedule by `scheduled_at`.
- mark `FAILED` only after `attempt_count >= max_attempts` or on non-retryable errors.
- token failures switch `sync_connections.status` to `REQUIRES_REAUTH`.
- store compact `error_code` values:
  - `RATE_LIMITED`
  - `TOKEN_EXPIRED`
  - `NETWORK_FAILURE`
  - `PROVIDER_5XX`
  - `VALIDATION_ERROR`

### Recommended Merge Policy

- default: `ASK`
- auto-resolve only when:
  - one side changed and the other side matches last synced snapshot
  - remote timestamp is newer and delta is monotonic and safe
  - local change is purely cosmetic while remote changed tracked fields

---

## 3. Background Jobs

### Worker Topology

Keep Supabase/Postgres. Add a stateless worker service that polls Postgres-backed queues or a lightweight queue broker.

Recommended queues:

- `sync_jobs`
- `release_jobs`
- `notification_jobs`

### Job Ownership

#### Sync Worker

- consumes `sync_jobs`
- handles import, pull, push, reconciliation
- writes `sync_conflicts`
- writes `provider_library_snapshots`
- emits outbox events

#### Release Poller

- scheduled cron every 15 to 30 minutes
- polls provider metadata for watched/followed titles only
- creates `releases`
- emits `TITLE_RELEASED` outbox events

#### Notification Worker

- consumes outbox events
- materializes `notifications`
- handles dedupe and preference filtering

### Execution Model

- `pg_cron` or external cron enqueues work, not heavy processing.
- workers do the heavy processing.
- use `FOR UPDATE SKIP LOCKED` or equivalent leasing pattern for safe parallel workers.

Pseudo-claim query:

```sql
update sync_jobs
set status = 'RUNNING',
    started_at = now(),
    attempt_count = attempt_count + 1
where id = (
  select id
  from sync_jobs
  where status in ('PENDING', 'RETRYABLE_FAILURE')
    and scheduled_at <= now()
  order by priority asc, scheduled_at asc
  for update skip locked
  limit 1
)
returning *;
```

---

## 4. Notifications System

Notifications are generated from domain events, not UI activity rows.

### Event Sources

- `TITLE_RELEASED`
- `SYNC_CONFLICT_CREATED`
- `LIBRARY_ENTRY_COMPLETED`
- `READING_STREAK_HIT`
- `FOLLOWED_TITLE_UPDATED`

### Trigger Rules

#### New Chapter Releases

- source: release poller creates `releases`
- recipients:
  - users with `library_entries.status in ('READING','PAUSED')`
  - users in `user_title_follows`

#### Sync Conflicts

- source: sync worker inserts unresolved `sync_conflicts`
- recipient: owning user

#### Milestones

- source: library mutation or sync application
- examples:
  - finished title
  - chapter milestone like 25, 50, 100
  - 7-day or 30-day reading streak

#### Followed Titles Updates

- source: title metadata update, status change, or release event
- recipient: users following title or owning it in specified statuses

### Delivery Guarantees

- notification generation uses outbox pattern in same transaction as event write
- notification worker is idempotent via unique dedupe index
- read state lives only in `notifications.read_at`

---

## 5. Queue / Recommendation Engine

This should be computed server-side from durable data, not local React state.

### Inputs

- `library_entries`
- `titles.chapter_count`
- `reading_sessions`
- `library_entry_history`
- `releases`

### Derived Metrics

- `remaining_chapters = max(title.chapter_count - entry.progress_chapters, 0)`
- `avg_chapters_per_day_30d`
- `avg_session_length_minutes`
- `days_since_last_read`
- `completion_time_hours = remaining_chapters / reading_speed_chapters_per_hour`
- `staleness_score`

### Queues

#### Next to Read

Rank formula:

- currently reading first
- boosted by recent releases
- boosted by recent activity
- penalized by large remaining chapter count

#### Finish Quickly

Filter:

- `status = 'READING'`
- `remaining_chapters <= user-configured threshold`

Rank:

- smallest `completion_time_hours`
- tie-break by `percent_complete desc`

#### Short Reads

Filter:

- `status in ('PLANNING','PAUSED')`
- `chapter_count <= threshold`

Rank:

- shortest total length
- boost highly rated and high-completion titles

#### Backlog Cleanup

Filter:

- stale entries in `PLANNING`, `PAUSED`, or old `READING`

Rank:

- high staleness
- manageable completion time
- deprioritize abandoned titles with repeated drops

### Materialization Strategy

- start with SQL views/RPCs in Postgres.
- if usage becomes heavy, materialize into `user_recommendation_snapshots` asynchronously.

---

## 6. API Design

Design these as server endpoints or Supabase Edge Functions, not direct client-side table orchestration.

### Library

#### `GET /v1/library`

Query params:

- `status`
- `cursor`
- `limit`
- `sort`
- `search`

Response includes entry summary + title metadata + optimistic concurrency token `entryVersion`.

#### `POST /v1/library`

Creates a `library_entry`.

Body:

```json
{
  "titleId": "uuid",
  "status": "PLANNING"
}
```

#### `PATCH /v1/library/{entryId}`

Partial update with optimistic concurrency.

Body:

```json
{
  "status": "READING",
  "score": 8.5,
  "entryVersion": 4,
  "requestId": "uuid"
}
```

#### `DELETE /v1/library/{entryId}`

Soft delete recommended if sync history matters.

### Fast Progress Endpoint

#### `POST /v1/library/{entryId}/progress`

Purpose:

- low-latency optimistic updates from reader UI

Body:

```json
{
  "deltaChapters": 1,
  "absoluteProgressChapters": 122,
  "completedAt": null,
  "entryVersion": 4,
  "requestId": "uuid"
}
```

Behavior:

- increments `entry_version`
- writes history
- appends outbox events
- enqueues incremental push job if needed

### Collections

- `GET /v1/collections`
- `POST /v1/collections`
- `PATCH /v1/collections/{collectionId}`
- `DELETE /v1/collections/{collectionId}`
- `POST /v1/collections/{collectionId}/items`
- `DELETE /v1/collections/{collectionId}/items/{titleId}`
- `POST /v1/collections/{collectionId}/reorder`

### Notes

- `GET /v1/library/{entryId}/notes`
- `POST /v1/library/{entryId}/notes`
- `PATCH /v1/notes/{noteId}`
- `DELETE /v1/notes/{noteId}`

### Notifications

- `GET /v1/notifications`
- `POST /v1/notifications/read`
- `POST /v1/notifications/read-all`

### Sync

- `GET /v1/sync/connections`
- `POST /v1/sync/{provider}/connect`
- `POST /v1/sync/{provider}/trigger`
- `GET /v1/sync/jobs`
- `GET /v1/sync/jobs/{jobId}`
- `GET /v1/sync/conflicts`
- `POST /v1/sync/conflicts/{conflictId}/resolve`

Example trigger body:

```json
{
  "jobType": "INCREMENTAL_PULL",
  "reason": "user_manual_refresh"
}
```

### Optimistic UI Support

All mutating endpoints should accept `requestId` and `entryVersion`.

Responses should return:

```json
{
  "requestId": "uuid",
  "serverAccepted": true,
  "entity": { "...": "..." },
  "entryVersion": 5,
  "syncState": {
    "pushQueued": true,
    "jobId": "uuid"
  }
}
```

---

## 7. Performance and Caching

### External API Caching

- do not call AniList or MAL from user-facing requests.
- cache provider title payloads in `title_provider_mappings.provider_payload`.
- cache provider library state in `provider_library_snapshots`.
- optionally add `external_api_cache` for raw paginated provider responses with TTL.

### Search and Query Indexing

Recommended indexes:

- `titles`
  - unique (`canonical_slug`)
  - gin on `to_tsvector('simple', coalesce(primary_title,'') || ' ' || coalesce(title_romaji,'') || ' ' || coalesce(title_english,''))`
  - btree on (`publishing_status`)
- `library_entries`
  - unique (`user_id`, `title_id`)
  - btree (`user_id`, `status`, `updated_at desc`)
  - btree (`user_id`, `last_read_at desc`)
  - btree (`user_id`, `is_favorite`)
- `collections`
  - unique (`user_id`, `name`)
- `collection_items`
  - unique (`collection_id`, `title_id`)
  - btree (`collection_id`, `sort_order`)
- `notifications`
  - btree (`user_id`, `read_at`, `created_at desc`)
  - partial index where `read_at is null`
- `sync_jobs`
  - btree (`status`, `scheduled_at`, `priority`)
  - btree (`user_id`, `created_at desc`)
- `sync_conflicts`
  - partial index where `resolved_at is null`
- `releases`
  - unique (`title_id`, `chapter_number`)
  - btree (`released_at desc`)

### Read Optimization

- use API aggregation for library pages instead of client fan-out queries.
- move recommendation queries into RPCs or read models.
- if needed later, add a read replica for search/library browsing endpoints.

---

## 8. Scalability Plan

### Phase 1

- keep Supabase Postgres as primary datastore
- move sync, release polling, and notifications into worker processes
- expose Edge Functions or API routes as the only write path

### Phase 2

- add Postgres-backed outbox/event model
- split read-heavy endpoints into denormalized views or materialized tables
- add separate worker deployments:
  - sync worker
  - release worker
  - notification worker

### Phase 3

- optional read replica for analytics/search/recommendation-heavy traffic
- optional dedicated queue broker if Postgres job throughput becomes a bottleneck

Supabase remains viable if:

- hot write paths stay narrow
- background work is outside the browser
- third-party API usage is fully asynchronous

---

## 9. Data Integrity Rules

### Duplicate Prevention

- unique (`user_id`, `title_id`) on `library_entries`
- unique (`collection_id`, `title_id`) on `collection_items`
- unique (`provider`, `provider_title_id`) on `title_provider_mappings`
- unique (`user_id`, `provider`) on `sync_connections`
- unique (`user_id`, `provider`, `title_id`) on `provider_library_snapshots`

### Sync Consistency

- every sync application updates both local canonical row and provider snapshot in one transaction
- push jobs are idempotent via `idempotency_key`
- conflict resolution must close all unresolved conflicts for the same entry/job atomically

### History Tracking

`library_entry_history` should store:

- `library_entry_id`
- `version`
- `changed_fields`
- `before_state`
- `after_state`
- `source`
- `request_id`
- `created_at`

This gives:

- auditability
- rollback support
- explainable sync decisions

---

## 10. Full Schema Design Summary

### Must-Have Tables

- `profiles`
- `titles`
- `title_provider_mappings`
- `library_entries`
- `collections`
- `collection_items`
- `notes`
- `notifications`
- `sync_connections`
- `sync_jobs`
- `sync_conflicts`
- `provider_library_snapshots`
- `releases`
- `library_entry_history`
- `outbox_events`
- `user_title_follows`
- `reading_sessions`

### Why This Is Better Than the Current Shape

- local user state and provider state are no longer the same thing
- notifications are generated from domain events, not client UI behavior
- release polling and sync work happen asynchronously
- conflict UI has a first-class durable model
- recommendations become server-computed and cacheable

---

## Sync Flow Diagram

```text
[Client mutation]
    |
    v
[API write endpoint]
    |
    +--> update library_entries
    +--> append library_entry_history
    +--> append outbox_events(LIBRARY_ENTRY_UPDATED / MILESTONE)
    +--> enqueue sync_jobs(INCREMENTAL_PUSH) if connection is bidirectional
    |
    v
[Response with entryVersion + requestId]


[Scheduled sync or manual sync trigger]
    |
    v
[sync_jobs row created]
    |
    v
[Sync Worker claims job]
    |
    +--> fetch provider deltas
    +--> upsert titles + title_provider_mappings
    +--> refresh provider_library_snapshots
    +--> compare local vs remote vs last snapshot
           |
           +--> no conflict --> apply change --> history/outbox --> complete job
           |
           +--> conflict --> create sync_conflicts --> outbox(SYNC_CONFLICT_CREATED)
                              --> job status AWAITING_CONFLICT_RESOLUTION


[Release cron]
    |
    v
[Release Worker polls watched titles]
    |
    +--> new release found
    +--> insert releases
    +--> append outbox(TITLE_RELEASED)
    |
    v
[Notification Worker]
    |
    +--> read outbox_events
    +--> fan out notifications by recipient rules
    +--> insert notifications with dedupe keys
```

---

## Background Job Architecture

```text
Cron / Scheduler
  -> enqueue release scan jobs
  -> enqueue periodic incremental pull jobs

API / Edge Functions
  -> enqueue user-triggered sync jobs
  -> enqueue push jobs after local mutations
  -> append outbox events in transaction

Workers
  -> Sync Worker
  -> Release Worker
  -> Notification Worker

Postgres / Supabase
  -> canonical tables
  -> queue tables
  -> outbox
  -> materialized read models
```

---

## Data Flow Explanation

### Library Write Path

Client sends a fast mutation request with `requestId` and `entryVersion`. The API validates ownership, updates `library_entries`, records `library_entry_history`, and returns the authoritative row. Any provider push is deferred to `sync_jobs`.

### Sync Read/Write Path

Workers pull AniList or MAL data into `provider_library_snapshots`, compare against local `library_entries`, and either auto-merge or create `sync_conflicts`. The frontend reads conflict rows directly and resolves them through a dedicated endpoint.

### Notification Path

Release detection, sync conflicts, and milestone detection emit outbox events. A notification worker fans those out into durable inbox rows, filtered by preferences and deduped by unique constraints.

### Recommendation Path

Recommendation queries read only local canonical data plus derived metrics. They never block on AniList or MAL, which keeps the queue/recommendation layer fast and stable.
