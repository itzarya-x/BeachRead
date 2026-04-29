const crypto = require('crypto');
const { supabaseAdmin } = require('../lib/supabase');

function nowIso() {
  return new Date().toISOString();
}

function makeIdempotencyKey(parts) {
  return parts.filter(Boolean).join(':');
}

function randomId() {
  return crypto.randomUUID();
}

async function getLibraryEntryById(userId, entryId) {
  const { data, error } = await supabaseAdmin
    .from('library_entries')
    .select(`
      *,
      title:titles (
        id,
        canonical_slug,
        primary_title,
        title_romaji,
        title_english,
        cover_image_url,
        banner_image_url,
        chapter_count,
        volume_count,
        total_episodes,
        publishing_status,
        media_type,
        genres
      )
    `)
    .eq('user_id', userId)
    .eq('id', entryId)
    .single();

  if (error) throw error;
  return data;
}

async function listLibrary(userId, options = {}) {
  const limit = Math.min(Math.max(Number(options.limit) || 50, 1), 100);
  const cursor = options.cursor ? new Date(options.cursor).toISOString() : null;

  let query = supabaseAdmin
    .from('library_entries')
    .select(`
      *,
      title:titles (
        id,
        canonical_slug,
        primary_title,
        title_romaji,
        title_english,
        cover_image_url,
        banner_image_url,
        chapter_count,
        volume_count,
        total_episodes,
        publishing_status,
        media_type,
        genres
      )
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (options.status) query = query.eq('status', options.status);
  if (cursor) query = query.lt('updated_at', cursor);

  const { data, error } = await query;
  if (error) throw error;

  return {
    items: data || [],
    nextCursor: data && data.length === limit ? data[data.length - 1].updated_at : null,
  };
}

async function createLibraryEntry(userId, payload = {}) {
  const requestId = payload.requestId || randomId();
  const now = nowIso();
  const status = payload.status || 'PLANNING';
  const insertPayload = {
    user_id: userId,
    title_id: payload.titleId,
    status,
    progress_chapters: Number(payload.progressChapters) || 0,
    progress_volumes: Number(payload.progressVolumes) || 0,
    score: payload.score ?? null,
    started_at: payload.startedAt || null,
    completed_at: status === 'COMPLETED' ? (payload.completedAt || now) : null,
    last_read_at: payload.lastReadAt || null,
    is_favorite: Boolean(payload.isFavorite),
    last_mutation_source: payload.source || 'WEB',
    updated_at: now,
  };

  const { data, error } = await supabaseAdmin
    .from('library_entries')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) throw error;

  return {
    requestId,
    entity: await getLibraryEntryById(userId, data.id),
  };
}

async function patchLibraryEntry(userId, entryId, payload = {}) {
  const existing = await getLibraryEntryById(userId, entryId);
  const requestId = payload.requestId || randomId();
  const expectedVersion = payload.entryVersion == null ? null : Number(payload.entryVersion);

  if (expectedVersion != null && Number(existing.entry_version) !== expectedVersion) {
    const error = new Error('Version conflict');
    error.status = 409;
    throw error;
  }

  const nextProgress = payload.progressChapters ?? existing.progress_chapters;
  const nextStatus = payload.status ?? existing.status;

  const updates = {
    status: nextStatus,
    progress_chapters: nextProgress,
    progress_volumes: payload.progressVolumes ?? existing.progress_volumes,
    score: payload.score ?? existing.score,
    started_at: payload.startedAt ?? existing.started_at,
    completed_at: nextStatus === 'COMPLETED' ? (payload.completedAt || existing.completed_at || nowIso()) : null,
    last_read_at: payload.lastReadAt ?? existing.last_read_at,
    is_favorite: payload.isFavorite ?? existing.is_favorite,
    last_mutation_source: payload.source || 'WEB',
    entry_version: Number(existing.entry_version) + 1,
    updated_at: nowIso(),
  };

  const { error } = await supabaseAdmin
    .from('library_entries')
    .update(updates)
    .eq('id', entryId)
    .eq('user_id', userId);

  if (error) throw error;

  const entity = await getLibraryEntryById(userId, entryId);
  return {
    requestId,
    entity,
  };
}

async function recordProgress(userId, entryId, payload = {}) {
  const existing = await getLibraryEntryById(userId, entryId);
  const requestId = payload.requestId || randomId();
  const expectedVersion = payload.entryVersion == null ? null : Number(payload.entryVersion);

  if (expectedVersion != null && Number(existing.entry_version) !== expectedVersion) {
    const error = new Error('Version conflict');
    error.status = 409;
    throw error;
  }

  const delta = payload.deltaChapters == null ? 0 : Number(payload.deltaChapters);
  const absolute = payload.absoluteProgressChapters == null ? null : Number(payload.absoluteProgressChapters);
  const nextProgress = absolute == null ? Math.max(Number(existing.progress_chapters) + delta, 0) : Math.max(absolute, 0);
  const nextStatus = payload.status || (nextProgress > 0 && existing.status === 'PLANNING' ? 'READING' : existing.status);
  const completedAt = payload.completedAt || (nextStatus === 'COMPLETED' ? nowIso() : null);

  const { error } = await supabaseAdmin
    .from('library_entries')
    .update({
      progress_chapters: nextProgress,
      status: nextStatus,
      completed_at: completedAt,
      last_read_at: payload.lastReadAt || nowIso(),
      last_mutation_source: payload.source || 'WEB',
      entry_version: Number(existing.entry_version) + 1,
      updated_at: nowIso(),
    })
    .eq('id', entryId)
    .eq('user_id', userId);

  if (error) throw error;

  const entity = await getLibraryEntryById(userId, entryId);
  return {
    requestId,
    entity,
  };
}

async function deleteLibraryEntry(userId, entryId) {
  const { error } = await supabaseAdmin
    .from('library_entries')
    .delete()
    .eq('user_id', userId)
    .eq('id', entryId);

  if (error) throw error;
  return { success: true };
}

async function listCollections(userId) {
  const { data, error } = await supabaseAdmin
    .from('collections')
    .select(`
      *,
      items:collection_items (
        id,
        title_id,
        sort_order,
        created_at
      )
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function createCollection(userId, payload = {}) {
  const { data, error } = await supabaseAdmin
    .from('collections')
    .insert({
      user_id: userId,
      name: payload.name,
      description: payload.description || null,
      visibility: payload.visibility || 'PRIVATE',
      sort_mode: payload.sortMode || 'MANUAL',
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function patchCollection(userId, collectionId, payload = {}) {
  const { data, error } = await supabaseAdmin
    .from('collections')
    .update({
      name: payload.name,
      description: payload.description,
      visibility: payload.visibility,
      sort_mode: payload.sortMode,
      updated_at: nowIso(),
    })
    .eq('id', collectionId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function deleteCollection(userId, collectionId) {
  const { error } = await supabaseAdmin
    .from('collections')
    .delete()
    .eq('id', collectionId)
    .eq('user_id', userId);

  if (error) throw error;
  return { success: true };
}

async function addCollectionItem(userId, collectionId, payload = {}) {
  const { data: collection, error: collectionError } = await supabaseAdmin
    .from('collections')
    .select('id')
    .eq('id', collectionId)
    .eq('user_id', userId)
    .single();

  if (collectionError || !collection) throw collectionError || new Error('Collection not found');

  const { data, error } = await supabaseAdmin
    .from('collection_items')
    .insert({
      collection_id: collectionId,
      title_id: payload.titleId,
      sort_order: payload.sortOrder ?? 0,
      added_by_user_id: userId,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function deleteCollectionItem(userId, collectionId, titleId) {
  const { data: collection, error: collectionError } = await supabaseAdmin
    .from('collections')
    .select('id')
    .eq('id', collectionId)
    .eq('user_id', userId)
    .single();

  if (collectionError || !collection) throw collectionError || new Error('Collection not found');

  const { error } = await supabaseAdmin
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('title_id', titleId);

  if (error) throw error;
  return { success: true };
}

async function reorderCollectionItems(userId, collectionId, items = []) {
  const { data: collection, error: collectionError } = await supabaseAdmin
    .from('collections')
    .select('id')
    .eq('id', collectionId)
    .eq('user_id', userId)
    .single();

  if (collectionError || !collection) throw collectionError || new Error('Collection not found');

  for (const item of items) {
    const { error } = await supabaseAdmin
      .from('collection_items')
      .update({ sort_order: item.sortOrder })
      .eq('collection_id', collectionId)
      .eq('title_id', item.titleId);

    if (error) throw error;
  }

  return { success: true };
}

async function listNotes(userId, entryId) {
  const { data: entry, error: entryError } = await supabaseAdmin
    .from('library_entries')
    .select('id')
    .eq('id', entryId)
    .eq('user_id', userId)
    .single();

  if (entryError || !entry) throw entryError || new Error('Library entry not found');

  const { data, error } = await supabaseAdmin
    .from('notes')
    .select('*')
    .eq('library_entry_id', entryId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function createNote(userId, entryId, payload = {}) {
  const { data, error } = await supabaseAdmin
    .from('notes')
    .insert({
      library_entry_id: entryId,
      user_id: userId,
      chapter_marker: payload.chapterMarker ?? null,
      visibility: payload.visibility || 'PRIVATE',
      body: payload.body,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function patchNote(userId, noteId, payload = {}) {
  const { data, error } = await supabaseAdmin
    .from('notes')
    .update({
      chapter_marker: payload.chapterMarker,
      visibility: payload.visibility,
      body: payload.body,
      updated_at: nowIso(),
    })
    .eq('id', noteId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function deleteNote(userId, noteId) {
  const { error } = await supabaseAdmin
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId);

  if (error) throw error;
  return { success: true };
}

async function listNotifications(userId) {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
}

async function markNotificationRead(userId, notificationId) {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .update({ read_at: nowIso() })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function markAllNotificationsRead(userId) {
  const { error } = await supabaseAdmin
    .from('notifications')
    .update({ read_at: nowIso() })
    .eq('user_id', userId)
    .is('read_at', null);

  if (error) throw error;
  return { success: true };
}

async function listSyncConnections(userId) {
  const { data, error } = await supabaseAdmin
    .from('sync_connections')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function upsertSyncConnection(userId, provider, payload = {}) {
  const providerName = String(provider || '').toUpperCase();
  const row = {
    user_id: userId,
    provider: providerName,
    provider_user_id: payload.providerUserId,
    provider_username: payload.providerUsername || null,
    status: payload.status || 'CONNECTED',
    sync_mode: payload.syncMode || 'IMPORT_ONLY',
    default_conflict_policy: payload.defaultConflictPolicy || 'ASK',
    access_token_encrypted: payload.accessToken || null,
    refresh_token_encrypted: payload.refreshToken || null,
    token_expires_at: payload.tokenExpiresAt || null,
  };

  const { data, error } = await supabaseAdmin
    .from('sync_connections')
    .upsert(row, { onConflict: 'user_id,provider' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function triggerSyncJob(userId, provider, payload = {}) {
  const normalizedProvider = String(provider || '').toUpperCase();
  const jobType = payload.jobType || 'INCREMENTAL_PULL';
  const requestId = payload.requestId || randomId();

  const activeStatuses = ['PENDING', 'RUNNING', 'RETRYABLE_FAILURE', 'AWAITING_CONFLICT_RESOLUTION'];
  const { data: existingJob, error: existingJobError } = await supabaseAdmin
    .from('sync_jobs')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', normalizedProvider)
    .eq('job_type', jobType)
    .in('status', activeStatuses)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingJobError) throw existingJobError;
  if (existingJob) {
    return {
      requestId,
      job: existingJob,
      reused: true,
    };
  }

  const idempotencyKey = payload.idempotencyKey || makeIdempotencyKey([
    normalizedProvider,
    jobType,
    userId,
    requestId,
  ]);

  const { data, error } = await supabaseAdmin.rpc('app_enqueue_sync_job', {
    p_user_id: userId,
    p_provider: normalizedProvider,
    p_job_type: jobType,
    p_requested_by: payload.requestedBy || 'USER',
    p_priority: payload.priority ?? 100,
    p_idempotency_key: idempotencyKey,
    p_source_snapshot: payload.sourceSnapshot || {},
  });

  if (error) throw error;

  const jobId = data;
  const { data: job, error: jobError } = await supabaseAdmin
    .from('sync_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (jobError) throw jobError;

  return {
    requestId,
    job,
  };
}

async function listSyncJobs(userId) {
  const { data, error } = await supabaseAdmin
    .from('sync_jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

async function getSyncJob(userId, jobId) {
  const { data, error } = await supabaseAdmin
    .from('sync_jobs')
    .select(`
      *,
      conflicts:sync_conflicts (*)
    `)
    .eq('user_id', userId)
    .eq('id', jobId)
    .single();

  if (error) throw error;
  return data;
}

async function listSyncConflicts(userId) {
  const { data, error } = await supabaseAdmin
    .from('sync_conflicts')
    .select(`
      *,
      title:titles (
        id,
        primary_title,
        cover_image_url,
        media_type
      )
    `)
    .eq('user_id', userId)
    .is('resolved_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function resolveSyncConflict(userId, conflictId, payload = {}) {
  const { data: conflict, error: conflictError } = await supabaseAdmin
    .from('sync_conflicts')
    .select('*')
    .eq('id', conflictId)
    .eq('user_id', userId)
    .single();

  if (conflictError) throw conflictError;

  const resolution = payload.resolution || 'MANUAL';
  let merged = payload.manual || null;

  if (resolution === 'LOCAL') merged = conflict.local_snapshot;
  if (resolution === 'REMOTE') merged = conflict.remote_snapshot;
  if (!merged) {
    const error = new Error('Resolution payload required');
    error.status = 400;
    throw error;
  }

  const nextVersion = Number(merged.entryVersion || 0) || undefined;

  const { error: updateEntryError } = await supabaseAdmin
    .from('library_entries')
    .update({
      status: merged.status,
      progress_chapters: merged.progressChapters ?? 0,
      progress_volumes: merged.progressVolumes ?? 0,
      score: merged.score ?? null,
      completed_at: merged.status === 'COMPLETED' ? (merged.completedAt || nowIso()) : null,
      last_mutation_source: 'SYSTEM',
      entry_version: nextVersion ? nextVersion + 1 : undefined,
      updated_at: nowIso(),
    })
    .eq('id', conflict.library_entry_id)
    .eq('user_id', userId);

  if (updateEntryError) throw updateEntryError;

  const { data, error } = await supabaseAdmin
    .from('sync_conflicts')
    .update({
      resolved_with: resolution,
      resolved_at: nowIso(),
      resolved_by: userId,
    })
    .eq('id', conflictId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

async function getRecommendations(userId, kind) {
  const rpcMap = {
    nextToRead: 'get_next_to_read',
    finishQuickly: 'get_finish_quickly',
    shortReads: 'get_short_reads',
    backlogCleanup: 'get_backlog_cleanup',
  };

  const fn = rpcMap[kind];
  if (!fn) {
    const error = new Error('Unknown recommendation kind');
    error.status = 400;
    throw error;
  }

  const { data, error } = await supabaseAdmin.rpc(fn, { p_user_id: userId });
  if (error) throw error;
  return data || [];
}

async function cancelSyncJob(userId, jobId) {
  const { data, error } = await supabaseAdmin
    .from('sync_jobs')
    .update({
      status: 'FAILED',
      error_message: 'Cancelled by user',
      finished_at: nowIso(),
    })
    .eq('id', jobId)
    .eq('user_id', userId)
    .in('status', ['PENDING', 'RUNNING'])
    .select('*')
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    const notFoundError = new Error('Job not found or cannot be cancelled');
    notFoundError.status = 404;
    throw notFoundError;
  }
  return data;
}

module.exports = {
  createCollection,
  createLibraryEntry,
  createNote,
  cancelSyncJob,
  deleteCollection,
  deleteCollectionItem,
  deleteLibraryEntry,
  deleteNote,
  getLibraryEntryById,
  getRecommendations,
  getSyncJob,
  listCollections,
  listLibrary,
  listNotes,
  listNotifications,
  listSyncConnections,
  listSyncConflicts,
  listSyncJobs,
  markAllNotificationsRead,
  markNotificationRead,
  patchCollection,
  patchLibraryEntry,
  patchNote,
  recordProgress,
  reorderCollectionItems,
  resolveSyncConflict,
  triggerSyncJob,
  upsertSyncConnection,
  addCollectionItem,
};
