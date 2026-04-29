-- Harden trigger: disable row_security inside SECURITY DEFINER so nested inserts
-- (history, outbox, sync_jobs) never fail RLS for the session role.
CREATE OR REPLACE FUNCTION public.capture_library_entry_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
    v_source text;
    v_request_id uuid;
    v_changed_fields text[];
    v_payload jsonb;
    v_has_connection boolean;
BEGIN
    v_source := coalesce(new.last_mutation_source, 'SYSTEM');

    BEGIN
        v_request_id := nullif(current_setting('app.request_id', true), '')::uuid;
    EXCEPTION WHEN others THEN
        v_request_id := null;
    END;

    v_changed_fields := array_remove(array[
        case when tg_op = 'INSERT' or old.status is distinct from new.status then 'status' end,
        case when tg_op = 'INSERT' or old.progress_chapters is distinct from new.progress_chapters then 'progress_chapters' end,
        case when tg_op = 'INSERT' or old.progress_volumes is distinct from new.progress_volumes then 'progress_volumes' end,
        case when tg_op = 'INSERT' or old.score is distinct from new.score then 'score' end,
        case when tg_op = 'INSERT' or old.completed_at is distinct from new.completed_at then 'completed_at' end,
        case when tg_op = 'INSERT' or old.last_read_at is distinct from new.last_read_at then 'last_read_at' end,
        case when tg_op = 'INSERT' or old.is_favorite is distinct from new.is_favorite then 'is_favorite' end
    ], null);

    INSERT INTO public.library_entry_history (
        library_entry_id,
        version,
        changed_fields,
        before_state,
        after_state,
        source,
        request_id
    )
    VALUES (
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

    RETURN new;
END;
$$;
