create extension if not exists citext;

create table if not exists public.profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    handle citext not null unique,
    display_name text not null default '',
    avatar_url text,
    timezone text not null default 'UTC',
    reading_speed_chapters_per_hour numeric(6,2) check (reading_speed_chapters_per_hour is null or reading_speed_chapters_per_hour > 0),
    notification_preferences jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.titles (
    id uuid primary key default gen_random_uuid(),
    canonical_slug text not null unique,
    primary_title text not null,
    title_romaji text,
    title_english text,
    title_native text,
    format text not null default 'MANGA' check (format in ('MANGA', 'NOVEL', 'ONE_SHOT')),
    publishing_status text not null default 'RELEASING' check (publishing_status in ('RELEASING', 'FINISHED', 'HIATUS', 'CANCELLED', 'NOT_YET_RELEASED')),
    description text,
    cover_image_url text,
    banner_image_url text,
    chapter_count integer check (chapter_count is null or chapter_count >= 0),
    volume_count integer check (volume_count is null or volume_count >= 0),
    metadata_version bigint not null default 1,
    source_updated_at timestamptz,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.title_provider_mappings (
    id uuid primary key default gen_random_uuid(),
    title_id uuid not null references public.titles(id) on delete cascade,
    provider text not null check (provider in ('ANILIST', 'MAL')),
    provider_title_id text not null,
    provider_payload jsonb not null default '{}'::jsonb,
    last_seen_at timestamptz not null default timezone('utc', now()),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (provider, provider_title_id),
    unique (title_id, provider)
);

create table if not exists public.library_entries (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title_id uuid not null references public.titles(id) on delete cascade,
    status text not null default 'PLANNING' check (status in ('PLANNING', 'READING', 'PAUSED', 'COMPLETED', 'DROPPED')),
    progress_chapters integer not null default 0 check (progress_chapters >= 0),
    progress_volumes integer not null default 0 check (progress_volumes >= 0),
    score numeric(4,1) check (score is null or (score >= 0 and score <= 10)),
    started_at timestamptz,
    completed_at timestamptz,
    last_read_at timestamptz,
    is_favorite boolean not null default false,
    entry_version bigint not null default 1,
    last_mutation_source text not null default 'WEB' check (last_mutation_source in ('WEB', 'MOBILE', 'SYNC_PULL', 'SYNC_PUSH', 'SYSTEM')),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (user_id, title_id),
    constraint library_entries_completed_status_check check (
        (status = 'COMPLETED' and completed_at is not null)
        or (status <> 'COMPLETED' and completed_at is null)
    )
);

create table if not exists public.collections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    description text,
    visibility text not null default 'PRIVATE' check (visibility in ('PRIVATE', 'UNLISTED', 'PUBLIC')),
    sort_mode text not null default 'MANUAL' check (sort_mode in ('MANUAL', 'ADDED_AT', 'TITLE', 'PROGRESS')),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (user_id, name)
);

create table if not exists public.collection_items (
    id uuid primary key default gen_random_uuid(),
    collection_id uuid not null references public.collections(id) on delete cascade,
    title_id uuid not null references public.titles(id) on delete cascade,
    sort_order integer not null default 0,
    added_by_user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default timezone('utc', now()),
    unique (collection_id, title_id),
    unique (collection_id, sort_order)
);

create table if not exists public.notes (
    id uuid primary key default gen_random_uuid(),
    library_entry_id uuid not null references public.library_entries(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    chapter_marker integer check (chapter_marker is null or chapter_marker >= 0),
    visibility text not null default 'PRIVATE' check (visibility in ('PRIVATE', 'PUBLIC')),
    body text not null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    type text not null check (type in ('NEW_RELEASE', 'SYNC_CONFLICT', 'MILESTONE', 'FOLLOWED_TITLE_UPDATE', 'SYSTEM')),
    actor_type text,
    reference_type text not null check (reference_type in ('RELEASE', 'SYNC_CONFLICT', 'LIBRARY_ENTRY', 'TITLE', 'SYSTEM')),
    reference_id uuid not null,
    title text not null,
    body text not null,
    payload jsonb not null default '{}'::jsonb,
    read_at timestamptz,
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sync_connections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    provider text not null check (provider in ('ANILIST', 'MAL')),
    provider_user_id text not null,
    provider_username text,
    status text not null default 'CONNECTED' check (status in ('CONNECTED', 'REQUIRES_REAUTH', 'DISCONNECTED')),
    sync_mode text not null default 'IMPORT_ONLY' check (sync_mode in ('IMPORT_ONLY', 'BIDIRECTIONAL')),
    default_conflict_policy text not null default 'ASK' check (default_conflict_policy in ('ASK', 'LOCAL_WINS', 'REMOTE_WINS', 'LATEST_WRITE_WINS')),
    access_token_encrypted text,
    refresh_token_encrypted text,
    token_expires_at timestamptz,
    cursor text,
    last_full_sync_at timestamptz,
    last_incremental_sync_at timestamptz,
    last_successful_push_at timestamptz,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (user_id, provider)
);

create table if not exists public.sync_jobs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    sync_connection_id uuid not null references public.sync_connections(id) on delete cascade,
    provider text not null check (provider in ('ANILIST', 'MAL')),
    job_type text not null check (job_type in ('INITIAL_IMPORT', 'INCREMENTAL_PULL', 'INCREMENTAL_PUSH', 'FULL_RECONCILIATION')),
    status text not null default 'PENDING' check (status in ('PENDING', 'RUNNING', 'AWAITING_CONFLICT_RESOLUTION', 'RETRYABLE_FAILURE', 'FAILED', 'COMPLETED', 'CANCELLED')),
    priority smallint not null default 100,
    requested_by text not null default 'USER' check (requested_by in ('USER', 'SYSTEM', 'SCHEDULED')),
    attempt_count integer not null default 0,
    max_attempts integer not null default 5,
    idempotency_key text not null unique,
    source_snapshot jsonb,
    result_summary jsonb,
    error_code text,
    error_message text,
    scheduled_at timestamptz not null default timezone('utc', now()),
    started_at timestamptz,
    finished_at timestamptz,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sync_conflicts (
    id uuid primary key default gen_random_uuid(),
    sync_job_id uuid not null references public.sync_jobs(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    title_id uuid not null references public.titles(id) on delete cascade,
    library_entry_id uuid not null references public.library_entries(id) on delete cascade,
    provider text not null check (provider in ('ANILIST', 'MAL')),
    conflict_type text not null check (conflict_type in ('STATUS_MISMATCH', 'PROGRESS_MISMATCH', 'SCORE_MISMATCH', 'DELETE_VS_UPDATE')),
    local_snapshot jsonb not null,
    remote_snapshot jsonb not null,
    suggested_resolution text not null check (suggested_resolution in ('LOCAL', 'REMOTE', 'MANUAL')),
    resolved_with text check (resolved_with in ('LOCAL', 'REMOTE', 'MANUAL')),
    resolved_at timestamptz,
    resolved_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.provider_library_snapshots (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    provider text not null check (provider in ('ANILIST', 'MAL')),
    title_id uuid not null references public.titles(id) on delete cascade,
    provider_entry_id text not null,
    provider_status text not null,
    provider_progress_chapters integer not null default 0 check (provider_progress_chapters >= 0),
    provider_progress_volumes integer not null default 0 check (provider_progress_volumes >= 0),
    provider_score numeric(4,1) check (provider_score is null or (provider_score >= 0 and provider_score <= 10)),
    provider_updated_at timestamptz,
    raw_payload jsonb not null default '{}'::jsonb,
    snapshot_hash text not null,
    last_pulled_at timestamptz not null default timezone('utc', now()),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (user_id, provider, title_id)
);

create table if not exists public.releases (
    id uuid primary key default gen_random_uuid(),
    title_id uuid not null references public.titles(id) on delete cascade,
    provider text not null default 'INTERNAL' check (provider in ('ANILIST', 'MAL', 'INTERNAL')),
    provider_release_id text,
    chapter_number numeric(10,2) not null,
    volume_number numeric(10,2),
    release_title text,
    released_at timestamptz not null,
    detected_at timestamptz not null default timezone('utc', now()),
    payload jsonb not null default '{}'::jsonb,
    unique (title_id, chapter_number)
);

create table if not exists public.library_entry_history (
    id uuid primary key default gen_random_uuid(),
    library_entry_id uuid not null references public.library_entries(id) on delete cascade,
    version bigint not null,
    changed_fields text[] not null default '{}'::text[],
    before_state jsonb,
    after_state jsonb not null,
    source text not null check (source in ('WEB', 'MOBILE', 'SYNC_PULL', 'SYNC_PUSH', 'SYSTEM')),
    request_id uuid,
    created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.outbox_events (
    id uuid primary key default gen_random_uuid(),
    event_type text not null,
    aggregate_type text not null,
    aggregate_id uuid not null,
    user_id uuid references auth.users(id) on delete cascade,
    payload jsonb not null default '{}'::jsonb,
    dedupe_key text not null unique,
    status text not null default 'PENDING' check (status in ('PENDING', 'PROCESSING', 'PROCESSED', 'RETRYABLE_FAILURE', 'FAILED')),
    available_at timestamptz not null default timezone('utc', now()),
    claimed_at timestamptz,
    claimed_by text,
    processed_at timestamptz,
    attempts integer not null default 0,
    max_attempts integer not null default 10,
    last_error text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.user_title_follows (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title_id uuid not null references public.titles(id) on delete cascade,
    created_at timestamptz not null default timezone('utc', now()),
    unique (user_id, title_id)
);

create table if not exists public.reading_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title_id uuid not null references public.titles(id) on delete cascade,
    library_entry_id uuid references public.library_entries(id) on delete set null,
    chapters_read numeric(10,2) not null default 0,
    minutes_spent integer not null default 0 check (minutes_spent >= 0),
    session_started_at timestamptz not null,
    session_ended_at timestamptz not null,
    created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_titles_search on public.titles using gin (
    to_tsvector(
        'simple',
        coalesce(primary_title, '') || ' ' ||
        coalesce(title_romaji, '') || ' ' ||
        coalesce(title_english, '') || ' ' ||
        coalesce(title_native, '')
    )
);
create index if not exists idx_titles_status on public.titles(publishing_status);
create index if not exists idx_library_entries_user_status_updated on public.library_entries(user_id, status, updated_at desc);
create index if not exists idx_library_entries_user_last_read on public.library_entries(user_id, last_read_at desc nulls last);
create index if not exists idx_library_entries_user_favorite on public.library_entries(user_id, is_favorite);
create index if not exists idx_collection_items_collection_sort on public.collection_items(collection_id, sort_order);
create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread on public.notifications(user_id, created_at desc) where read_at is null;
create index if not exists idx_sync_jobs_status_scheduled_priority on public.sync_jobs(status, scheduled_at, priority);
create index if not exists idx_sync_jobs_user_created on public.sync_jobs(user_id, created_at desc);
create index if not exists idx_sync_conflicts_unresolved on public.sync_conflicts(user_id, created_at desc) where resolved_at is null;
create index if not exists idx_provider_library_snapshots_lookup on public.provider_library_snapshots(user_id, provider, title_id);
create index if not exists idx_releases_title_released_at on public.releases(title_id, released_at desc);
create index if not exists idx_releases_released_at on public.releases(released_at desc);
create index if not exists idx_outbox_events_pending on public.outbox_events(status, available_at, created_at);
create index if not exists idx_outbox_events_user on public.outbox_events(user_id, created_at desc);
create unique index if not exists idx_notifications_dedupe on public.notifications(user_id, type, reference_type, reference_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := timezone('utc', now());
    return new;
end;
$$;

create or replace function public.ensure_note_owner()
returns trigger
language plpgsql
as $$
declare
    v_owner uuid;
begin
    select user_id into v_owner
    from public.library_entries
    where id = new.library_entry_id;

    if v_owner is null then
        raise exception 'library_entry not found';
    end if;

    if new.user_id <> v_owner then
        raise exception 'note owner must match library entry owner';
    end if;

    return new;
end;
$$;

create or replace function public.emit_outbox_event(
    p_event_type text,
    p_aggregate_type text,
    p_aggregate_id uuid,
    p_user_id uuid,
    p_payload jsonb,
    p_dedupe_key text
)
returns uuid
language plpgsql
as $$
declare
    v_id uuid;
begin
    insert into public.outbox_events (
        event_type,
        aggregate_type,
        aggregate_id,
        user_id,
        payload,
        dedupe_key
    )
    values (
        p_event_type,
        p_aggregate_type,
        p_aggregate_id,
        p_user_id,
        coalesce(p_payload, '{}'::jsonb),
        p_dedupe_key
    )
    on conflict (dedupe_key) do update
    set payload = excluded.payload,
        updated_at = timezone('utc', now())
    returning id into v_id;

    return v_id;
end;
$$;

create or replace function public.capture_library_entry_change()
returns trigger
language plpgsql
as $$
declare
    v_source text;
    v_request_id uuid;
    v_changed_fields text[];
    v_payload jsonb;
    v_has_connection boolean;
begin
    v_source := coalesce(new.last_mutation_source, 'SYSTEM');

    begin
        v_request_id := nullif(current_setting('app.request_id', true), '')::uuid;
    exception when others then
        v_request_id := null;
    end;

    v_changed_fields := array_remove(array[
        case when tg_op = 'INSERT' or old.status is distinct from new.status then 'status' end,
        case when tg_op = 'INSERT' or old.progress_chapters is distinct from new.progress_chapters then 'progress_chapters' end,
        case when tg_op = 'INSERT' or old.progress_volumes is distinct from new.progress_volumes then 'progress_volumes' end,
        case when tg_op = 'INSERT' or old.score is distinct from new.score then 'score' end,
        case when tg_op = 'INSERT' or old.completed_at is distinct from new.completed_at then 'completed_at' end,
        case when tg_op = 'INSERT' or old.last_read_at is distinct from new.last_read_at then 'last_read_at' end,
        case when tg_op = 'INSERT' or old.is_favorite is distinct from new.is_favorite then 'is_favorite' end
    ], null);

    insert into public.library_entry_history (
        library_entry_id,
        version,
        changed_fields,
        before_state,
        after_state,
        source,
        request_id
    )
    values (
        new.id,
        new.entry_version,
        coalesce(v_changed_fields, '{}'::text[]),
        case when tg_op = 'UPDATE' then to_jsonb(old) else null end,
        to_jsonb(new),
        v_source,
        v_request_id
    );

    v_payload := jsonb_build_object(
        'libraryEntryId', new.id,
        'titleId', new.title_id,
        'status', new.status,
        'progressChapters', new.progress_chapters,
        'progressVolumes', new.progress_volumes,
        'score', new.score,
        'entryVersion', new.entry_version,
        'source', v_source
    );

    perform public.emit_outbox_event(
        'LIBRARY_ENTRY_UPDATED',
        'LIBRARY_ENTRY',
        new.id,
        new.user_id,
        v_payload,
        'library-entry-updated:' || new.id::text || ':' || new.entry_version::text
    );

    if new.status = 'COMPLETED' and (tg_op = 'INSERT' or old.status is distinct from new.status) then
        perform public.emit_outbox_event(
            'LIBRARY_ENTRY_COMPLETED',
            'LIBRARY_ENTRY',
            new.id,
            new.user_id,
            v_payload,
            'library-entry-completed:' || new.id::text || ':' || new.entry_version::text
        );
    end if;

    if new.progress_chapters > 0
       and mod(new.progress_chapters, 25) = 0
       and (tg_op = 'INSERT' or old.progress_chapters is distinct from new.progress_chapters) then
        perform public.emit_outbox_event(
            'READING_MILESTONE',
            'LIBRARY_ENTRY',
            new.id,
            new.user_id,
            v_payload || jsonb_build_object('milestoneChapter', new.progress_chapters),
            'reading-milestone:' || new.id::text || ':' || new.progress_chapters::text
        );
    end if;

    if v_source in ('WEB', 'MOBILE') then
        select exists (
            select 1
            from public.sync_connections sc
            where sc.user_id = new.user_id
              and sc.status = 'CONNECTED'
              and sc.sync_mode = 'BIDIRECTIONAL'
        ) into v_has_connection;

        if v_has_connection then
            insert into public.sync_jobs (
                user_id,
                sync_connection_id,
                provider,
                job_type,
                status,
                priority,
                requested_by,
                idempotency_key,
                source_snapshot
            )
            select
                sc.user_id,
                sc.id,
                sc.provider,
                'INCREMENTAL_PUSH',
                'PENDING',
                80,
                'SYSTEM',
                'push:' || sc.id::text || ':' || new.id::text || ':' || new.entry_version::text,
                jsonb_build_object(
                    'libraryEntryId', new.id,
                    'titleId', new.title_id,
                    'entryVersion', new.entry_version
                )
            from public.sync_connections sc
            where sc.user_id = new.user_id
              and sc.status = 'CONNECTED'
              and sc.sync_mode = 'BIDIRECTIONAL'
            on conflict (idempotency_key) do nothing;
        end if;
    end if;

    return new;
end;
$$;

create or replace function public.capture_release_change()
returns trigger
language plpgsql
as $$
begin
    perform public.emit_outbox_event(
        'TITLE_RELEASED',
        'RELEASE',
        new.id,
        null,
        jsonb_build_object(
            'releaseId', new.id,
            'titleId', new.title_id,
            'chapterNumber', new.chapter_number,
            'releasedAt', new.released_at
        ),
        'release:' || new.title_id::text || ':' || new.chapter_number::text
    );

    return new;
end;
$$;

create or replace function public.app_enqueue_sync_job(
    p_user_id uuid,
    p_provider text,
    p_job_type text,
    p_requested_by text default 'USER',
    p_priority smallint default 100,
    p_idempotency_key text default null,
    p_source_snapshot jsonb default null
)
returns uuid
language plpgsql
as $$
declare
    v_connection public.sync_connections;
    v_job_id uuid;
    v_key text;
begin
    select *
    into v_connection
    from public.sync_connections
    where user_id = p_user_id
      and provider = p_provider
      and status = 'CONNECTED'
    limit 1;

    if v_connection.id is null then
        raise exception 'sync connection not found for provider %', p_provider;
    end if;

    v_key := coalesce(p_idempotency_key, p_provider || ':' || p_job_type || ':' || encode(gen_random_bytes(8), 'hex'));

    insert into public.sync_jobs (
        user_id,
        sync_connection_id,
        provider,
        job_type,
        status,
        priority,
        requested_by,
        idempotency_key,
        source_snapshot
    )
    values (
        p_user_id,
        v_connection.id,
        p_provider,
        p_job_type,
        'PENDING',
        p_priority,
        p_requested_by,
        v_key,
        p_source_snapshot
    )
    on conflict (idempotency_key) do update
    set updated_at = timezone('utc', now())
    returning id into v_job_id;

    return v_job_id;
end;
$$;

create or replace function public.app_claim_sync_jobs(p_worker text, p_limit integer default 10)
returns setof public.sync_jobs
language plpgsql
as $$
begin
    return query
    with candidates as (
        select j.id
        from public.sync_jobs j
        where j.status in ('PENDING', 'RETRYABLE_FAILURE')
          and j.scheduled_at <= timezone('utc', now())
        order by j.priority asc, j.scheduled_at asc, j.created_at asc
        for update skip locked
        limit p_limit
    )
    update public.sync_jobs j
    set status = 'RUNNING',
        started_at = coalesce(j.started_at, timezone('utc', now())),
        attempt_count = j.attempt_count + 1,
        updated_at = timezone('utc', now())
    from candidates c
    where j.id = c.id
    returning j.*;
end;
$$;

create or replace function public.app_claim_outbox_events(p_worker text, p_limit integer default 50)
returns setof public.outbox_events
language plpgsql
as $$
begin
    return query
    with candidates as (
        select e.id
        from public.outbox_events e
        where e.status in ('PENDING', 'RETRYABLE_FAILURE')
          and e.available_at <= timezone('utc', now())
        order by e.available_at asc, e.created_at asc
        for update skip locked
        limit p_limit
    )
    update public.outbox_events e
    set status = 'PROCESSING',
        claimed_at = timezone('utc', now()),
        claimed_by = p_worker,
        attempts = e.attempts + 1,
        updated_at = timezone('utc', now())
    from candidates c
    where e.id = c.id
    returning e.*;
end;
$$;

create or replace function public.app_complete_outbox_event(p_event_id uuid)
returns void
language sql
as $$
    update public.outbox_events
    set status = 'PROCESSED',
        processed_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    where id = p_event_id;
$$;

create or replace function public.app_fail_outbox_event(p_event_id uuid, p_error text, p_retryable boolean default true)
returns void
language sql
as $$
    update public.outbox_events
    set status = case when p_retryable and attempts < max_attempts then 'RETRYABLE_FAILURE' else 'FAILED' end,
        available_at = case when p_retryable then timezone('utc', now()) + interval '5 minutes' else available_at end,
        last_error = p_error,
        updated_at = timezone('utc', now())
    where id = p_event_id;
$$;

create or replace function public.get_next_to_read(p_user_id uuid, p_limit integer default 10)
returns table (
    library_entry_id uuid,
    title_id uuid,
    primary_title text,
    cover_image_url text,
    status text,
    progress_chapters integer,
    chapter_count integer,
    remaining_chapters integer,
    completion_time_hours numeric,
    last_read_at timestamptz,
    latest_release_at timestamptz
)
language sql
stable
as $$
    with speed as (
        select coalesce(reading_speed_chapters_per_hour, 8)::numeric as chapters_per_hour
        from public.profiles
        where user_id = p_user_id
    ),
    latest_releases as (
        select r.title_id, max(r.released_at) as latest_release_at
        from public.releases r
        group by r.title_id
    )
    select
        le.id,
        t.id,
        t.primary_title,
        t.cover_image_url,
        le.status,
        le.progress_chapters,
        t.chapter_count,
        greatest(coalesce(t.chapter_count, le.progress_chapters) - le.progress_chapters, 0) as remaining_chapters,
        round((greatest(coalesce(t.chapter_count, le.progress_chapters) - le.progress_chapters, 0)::numeric / coalesce((select chapters_per_hour from speed), 8)), 2) as completion_time_hours,
        le.last_read_at,
        lr.latest_release_at
    from public.library_entries le
    join public.titles t on t.id = le.title_id
    left join latest_releases lr on lr.title_id = t.id
    where le.user_id = p_user_id
      and le.status in ('READING', 'PAUSED')
    order by
        case when le.status = 'READING' then 0 else 1 end,
        case when lr.latest_release_at > timezone('utc', now()) - interval '14 days' then 0 else 1 end,
        le.last_read_at desc nulls last,
        greatest(coalesce(t.chapter_count, le.progress_chapters) - le.progress_chapters, 0) asc
    limit p_limit;
$$;

create or replace function public.get_finish_quickly(p_user_id uuid, p_limit integer default 10)
returns table (
    library_entry_id uuid,
    title_id uuid,
    primary_title text,
    cover_image_url text,
    progress_chapters integer,
    chapter_count integer,
    remaining_chapters integer,
    percent_complete numeric,
    completion_time_hours numeric
)
language sql
stable
as $$
    with speed as (
        select coalesce(reading_speed_chapters_per_hour, 8)::numeric as chapters_per_hour
        from public.profiles
        where user_id = p_user_id
    )
    select
        le.id,
        t.id,
        t.primary_title,
        t.cover_image_url,
        le.progress_chapters,
        t.chapter_count,
        greatest(t.chapter_count - le.progress_chapters, 0) as remaining_chapters,
        round((le.progress_chapters::numeric / nullif(t.chapter_count, 0)) * 100, 2) as percent_complete,
        round((greatest(t.chapter_count - le.progress_chapters, 0)::numeric / coalesce((select chapters_per_hour from speed), 8)), 2) as completion_time_hours
    from public.library_entries le
    join public.titles t on t.id = le.title_id
    where le.user_id = p_user_id
      and le.status = 'READING'
      and t.chapter_count is not null
      and t.chapter_count > le.progress_chapters
    order by completion_time_hours asc, percent_complete desc
    limit p_limit;
$$;

create or replace function public.get_short_reads(p_user_id uuid, p_limit integer default 10, p_max_chapters integer default 40)
returns table (
    library_entry_id uuid,
    title_id uuid,
    primary_title text,
    cover_image_url text,
    chapter_count integer,
    publishing_status text
)
language sql
stable
as $$
    select
        le.id,
        t.id,
        t.primary_title,
        t.cover_image_url,
        t.chapter_count,
        t.publishing_status
    from public.library_entries le
    join public.titles t on t.id = le.title_id
    where le.user_id = p_user_id
      and le.status in ('PLANNING', 'PAUSED')
      and t.chapter_count is not null
      and t.chapter_count <= p_max_chapters
    order by t.chapter_count asc, t.primary_title asc
    limit p_limit;
$$;

create or replace function public.get_backlog_cleanup(p_user_id uuid, p_limit integer default 10)
returns table (
    library_entry_id uuid,
    title_id uuid,
    primary_title text,
    cover_image_url text,
    status text,
    updated_at timestamptz,
    days_stale integer,
    remaining_chapters integer
)
language sql
stable
as $$
    select
        le.id,
        t.id,
        t.primary_title,
        t.cover_image_url,
        le.status,
        le.updated_at,
        greatest(extract(day from (timezone('utc', now()) - le.updated_at))::integer, 0) as days_stale,
        greatest(coalesce(t.chapter_count, le.progress_chapters) - le.progress_chapters, 0) as remaining_chapters
    from public.library_entries le
    join public.titles t on t.id = le.title_id
    where le.user_id = p_user_id
      and le.status in ('PLANNING', 'PAUSED', 'READING')
      and le.updated_at < timezone('utc', now()) - interval '21 days'
    order by days_stale desc, remaining_chapters asc
    limit p_limit;
$$;

alter table public.profiles enable row level security;
alter table public.titles enable row level security;
alter table public.title_provider_mappings enable row level security;
alter table public.library_entries enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.notes enable row level security;
alter table public.notifications enable row level security;
alter table public.sync_connections enable row level security;
alter table public.sync_jobs enable row level security;
alter table public.sync_conflicts enable row level security;
alter table public.provider_library_snapshots enable row level security;
alter table public.releases enable row level security;
alter table public.library_entry_history enable row level security;
alter table public.outbox_events enable row level security;
alter table public.user_title_follows enable row level security;
alter table public.reading_sessions enable row level security;

drop policy if exists "profiles_self_manage" on public.profiles;
create policy "profiles_self_manage" on public.profiles
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "titles_public_read" on public.titles;
create policy "titles_public_read" on public.titles
for select using (true);

drop policy if exists "title_provider_mappings_public_read" on public.title_provider_mappings;
create policy "title_provider_mappings_public_read" on public.title_provider_mappings
for select using (true);

drop policy if exists "library_entries_self_manage" on public.library_entries;
create policy "library_entries_self_manage" on public.library_entries
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "collections_self_manage" on public.collections;
create policy "collections_self_manage" on public.collections
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "collection_items_self_manage" on public.collection_items;
create policy "collection_items_self_manage" on public.collection_items
for all to authenticated
using (
    exists (
        select 1
        from public.collections c
        where c.id = collection_id
          and c.user_id = (select auth.uid())
    )
)
with check (
    exists (
        select 1
        from public.collections c
        where c.id = collection_id
          and c.user_id = (select auth.uid())
    )
);

drop policy if exists "notes_self_manage" on public.notes;
create policy "notes_self_manage" on public.notes
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "notifications_self_read" on public.notifications;
create policy "notifications_self_read" on public.notifications
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "sync_connections_self_manage" on public.sync_connections;
create policy "sync_connections_self_manage" on public.sync_connections
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "sync_jobs_self_manage" on public.sync_jobs;
create policy "sync_jobs_self_manage" on public.sync_jobs
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "sync_conflicts_self_manage" on public.sync_conflicts;
create policy "sync_conflicts_self_manage" on public.sync_conflicts
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "provider_library_snapshots_self_manage" on public.provider_library_snapshots;
create policy "provider_library_snapshots_self_manage" on public.provider_library_snapshots
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "releases_public_read" on public.releases;
create policy "releases_public_read" on public.releases
for select using (true);

drop policy if exists "library_entry_history_self_read" on public.library_entry_history;
create policy "library_entry_history_self_read" on public.library_entry_history
for select to authenticated
using (
    exists (
        select 1
        from public.library_entries le
        where le.id = library_entry_id
          and le.user_id = (select auth.uid())
    )
);

drop policy if exists "outbox_events_service_only" on public.outbox_events;
create policy "outbox_events_service_only" on public.outbox_events
for select to authenticated
using (false);

drop policy if exists "user_title_follows_self_manage" on public.user_title_follows;
create policy "user_title_follows_self_manage" on public.user_title_follows
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "reading_sessions_self_manage" on public.reading_sessions;
create policy "reading_sessions_self_manage" on public.reading_sessions
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop trigger if exists trg_profiles_touch_updated_at on public.profiles;
create trigger trg_profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists trg_titles_touch_updated_at on public.titles;
create trigger trg_titles_touch_updated_at
before update on public.titles
for each row execute function public.touch_updated_at();

drop trigger if exists trg_title_provider_mappings_touch_updated_at on public.title_provider_mappings;
create trigger trg_title_provider_mappings_touch_updated_at
before update on public.title_provider_mappings
for each row execute function public.touch_updated_at();

drop trigger if exists trg_library_entries_touch_updated_at on public.library_entries;
create trigger trg_library_entries_touch_updated_at
before update on public.library_entries
for each row execute function public.touch_updated_at();

drop trigger if exists trg_collections_touch_updated_at on public.collections;
create trigger trg_collections_touch_updated_at
before update on public.collections
for each row execute function public.touch_updated_at();

drop trigger if exists trg_notes_touch_updated_at on public.notes;
create trigger trg_notes_touch_updated_at
before update on public.notes
for each row execute function public.touch_updated_at();

drop trigger if exists trg_sync_connections_touch_updated_at on public.sync_connections;
create trigger trg_sync_connections_touch_updated_at
before update on public.sync_connections
for each row execute function public.touch_updated_at();

drop trigger if exists trg_sync_jobs_touch_updated_at on public.sync_jobs;
create trigger trg_sync_jobs_touch_updated_at
before update on public.sync_jobs
for each row execute function public.touch_updated_at();

drop trigger if exists trg_provider_library_snapshots_touch_updated_at on public.provider_library_snapshots;
create trigger trg_provider_library_snapshots_touch_updated_at
before update on public.provider_library_snapshots
for each row execute function public.touch_updated_at();

drop trigger if exists trg_outbox_events_touch_updated_at on public.outbox_events;
create trigger trg_outbox_events_touch_updated_at
before update on public.outbox_events
for each row execute function public.touch_updated_at();

drop trigger if exists trg_notes_ensure_owner on public.notes;
create trigger trg_notes_ensure_owner
before insert or update on public.notes
for each row execute function public.ensure_note_owner();

drop trigger if exists trg_library_entries_capture_change on public.library_entries;
create trigger trg_library_entries_capture_change
after insert or update on public.library_entries
for each row execute function public.capture_library_entry_change();

drop trigger if exists trg_releases_capture_change on public.releases;
create trigger trg_releases_capture_change
after insert on public.releases
for each row execute function public.capture_release_change();
