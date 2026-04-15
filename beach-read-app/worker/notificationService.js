const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

function nowIso() {
  return new Date().toISOString();
}

function normalizePayload(payload) {
  return payload && typeof payload === 'object' ? payload : {};
}

async function createNotificationsForRelease(event) {
  const payload = normalizePayload(event.payload);
  const titleId = payload.titleId;
  const releaseId = payload.releaseId;
  const chapterNumber = payload.chapterNumber;
  if (!titleId || !releaseId) return;

  const [{ data: entryReaders, error: entryError }, { data: followers, error: followError }, { data: title }] = await Promise.all([
    supabase
      .from('library_entries')
      .select('user_id')
      .eq('title_id', titleId)
      .in('status', ['READING', 'PAUSED']),
    supabase
      .from('user_title_follows')
      .select('user_id')
      .eq('title_id', titleId),
    supabase
      .from('titles')
      .select('primary_title')
      .eq('id', titleId)
      .maybeSingle(),
  ]);

  if (entryError) throw entryError;
  if (followError) throw followError;

  const userIds = [...new Set([...(entryReaders || []).map((row) => row.user_id), ...(followers || []).map((row) => row.user_id)])];
  if (!userIds.length) return;

  const rows = userIds.map((userId) => ({
    user_id: userId,
    type: 'NEW_RELEASE',
    reference_type: 'RELEASE',
    reference_id: releaseId,
    title: 'New chapter released',
    body: `Chapter ${chapterNumber} is available for ${title?.primary_title || 'a followed title'}.`,
    payload,
  }));

  const { error } = await supabase
    .from('notifications')
    .upsert(rows, { onConflict: 'user_id,type,reference_type,reference_id' });

  if (error) throw error;
}

async function createNotificationFromConflict(event) {
  const payload = normalizePayload(event.payload);
  if (!event.user_id || !payload.conflictId) return;

  const { error } = await supabase
    .from('notifications')
    .upsert({
      user_id: event.user_id,
      type: 'SYNC_CONFLICT',
      reference_type: 'SYNC_CONFLICT',
      reference_id: payload.conflictId,
      title: 'Sync conflict detected',
      body: `Resolve the conflict for ${payload.title?.primaryTitle || 'your library entry'} before the next sync.`,
      payload,
    }, { onConflict: 'user_id,type,reference_type,reference_id' });

  if (error) throw error;
}

async function createMilestoneNotification(event) {
  const payload = normalizePayload(event.payload);
  if (!event.user_id || !payload.libraryEntryId) return;

  const title = payload.milestoneChapter
    ? 'Reading milestone reached'
    : 'Title completed';
  const body = payload.milestoneChapter
    ? `You reached chapter ${payload.milestoneChapter}.`
    : 'You finished a title in your library.';

  const { error } = await supabase
    .from('notifications')
    .upsert({
      user_id: event.user_id,
      type: 'MILESTONE',
      reference_type: 'LIBRARY_ENTRY',
      reference_id: payload.libraryEntryId,
      title,
      body,
      payload,
    }, { onConflict: 'user_id,type,reference_type,reference_id' });

  if (error) throw error;
}

async function processEvent(event) {
  if (event.event_type === 'TITLE_RELEASED') {
    await createNotificationsForRelease(event);
    return;
  }

  if (event.event_type === 'SYNC_CONFLICT_CREATED') {
    await createNotificationFromConflict(event);
    return;
  }

  if (event.event_type === 'LIBRARY_ENTRY_COMPLETED' || event.event_type === 'READING_MILESTONE') {
    await createMilestoneNotification(event);
  }
}

async function processPendingEvents(workerId = `notification-worker:${process.pid}`) {
  const { data: events, error } = await supabase.rpc('app_claim_outbox_events', {
    p_worker: workerId,
    p_limit: 50,
  });

  if (error) throw error;
  if (!events?.length) return 0;

  for (const event of events) {
    try {
      await processEvent(event);
      await supabase.rpc('app_complete_outbox_event', { p_event_id: event.id });
    } catch (eventError) {
      await supabase.rpc('app_fail_outbox_event', {
        p_event_id: event.id,
        p_error: eventError.message || 'Notification processing failed',
        p_retryable: true,
      });
    }
  }

  return events.length;
}

module.exports = {
  processPendingEvents,
  nowIso,
};
