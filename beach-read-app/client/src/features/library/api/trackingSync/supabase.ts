import { supabase } from '../../../../shared/api/supabaseClient';
import { publicApiClient } from '../../../../shared/api/apiClient';
import { isMissingTableError, MissingSupabaseFeatureError } from '../../../../shared/api/supabaseSchema';
import type {
  ExternalMediaMappingRow,
  IntegrationRow,
  ProviderId,
  SyncDirection,
  SyncDraft,
  SyncMode,
  ConflictMode,
  SyncState,
  LocalMediaRow,
} from './types';
import { DEFAULT_CONFLICT_MODE, DEFAULT_SYNC_MODE, PROVIDERS } from './constants';
import { toDbScore, toDbStatus } from '../../utils/libraryTransformers';

const SYNC_IDENTITIES_TABLE = 'sync_connections';
const SYNC_JOBS_TABLE = 'sync_jobs';
const TITLES_TABLE = 'titles';
const LIBRARY_ENTRIES_TABLE = 'library_entries';
const EXTERNAL_MEDIA_MAPPINGS_TABLE = 'external_media_mappings';
const DOMAIN_MIGRATION = '20260414_domain_migration.sql';

type ActivityLogInsertRow = {
  user_id: string;
  series_id: number | null;
  action_type: string;
  media_type?: string | null;
  details?: Record<string, unknown> | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function timestampScore(value: unknown) {
  if (typeof value !== 'string' || !value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function dedupeLocalMediaRows(rows: Record<string, unknown>[]) {
  const deduped = new Map<string, Record<string, unknown>>();

  for (const row of rows) {
    const record = asRecord(row);
    if (!record) continue;
    const key = `${String(record.user_id || '')}::${String(record.series_id || '')}`;
    const current = deduped.get(key);
    if (!current) {
      deduped.set(key, record);
      continue;
    }

    const incomingScore = timestampScore(record.updated_at);
    const currentScore = timestampScore(current.updated_at);
    deduped.set(key, incomingScore >= currentScore ? record : current);
  }

  return Array.from(deduped.values());
}

function dedupeMediaMappings(rows: Array<ExternalMediaMappingRow & { local_title?: string | null }>) {
  // Respect both unique constraints:
  // 1) (user_id, provider, provider_media_id)
  // 2) (user_id, provider, series_id)
  const byProviderMediaId = new Map<string, ExternalMediaMappingRow & { local_title?: string | null }>();

  for (const row of rows) {
    const key = `${row.provider}::${row.provider_media_id}`;
    const current = byProviderMediaId.get(key);
    if (!current) {
      byProviderMediaId.set(key, row);
      continue;
    }

    const incomingScore = timestampScore(row.provider_updated_at);
    const currentScore = timestampScore(current.provider_updated_at);
    byProviderMediaId.set(key, incomingScore >= currentScore ? row : current);
  }

  const bySeriesId = new Map<string, ExternalMediaMappingRow & { local_title?: string | null }>();
  for (const row of byProviderMediaId.values()) {
    const key = `${row.provider}::${row.series_id}`;
    const current = bySeriesId.get(key);
    if (!current) {
      bySeriesId.set(key, row);
      continue;
    }

    const incomingScore = timestampScore(row.provider_updated_at);
    const currentScore = timestampScore(current.provider_updated_at);
    bySeriesId.set(key, incomingScore >= currentScore ? row : current);
  }

  return Array.from(bySeriesId.values());
}

function ensureClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  return supabase;
}

function rethrowSchemaError(error: unknown): never {
  if (isMissingTableError(error, SYNC_IDENTITIES_TABLE)) {
    throw new MissingSupabaseFeatureError(SYNC_IDENTITIES_TABLE, 'Tracking sync', DOMAIN_MIGRATION);
  }

  if (isMissingTableError(error, SYNC_JOBS_TABLE)) {
    throw new MissingSupabaseFeatureError(SYNC_JOBS_TABLE, 'Tracking sync', DOMAIN_MIGRATION);
  }

  if (isMissingTableError(error, LIBRARY_ENTRIES_TABLE)) {
    throw new MissingSupabaseFeatureError(LIBRARY_ENTRIES_TABLE, 'Tracking sync', DOMAIN_MIGRATION);
  }

  throw error;
}

function defaultIntegration(provider: ProviderId): IntegrationRow {
  return {
    provider,
    status: 'disconnected',
    username: '',
    access_token: null,
    refresh_token: null,
    token_expires_at: null,
    sync_mode: DEFAULT_SYNC_MODE,
    conflict_mode: DEFAULT_CONFLICT_MODE,
    last_sync_at: null,
    last_pull_at: null,
    last_push_at: null,
    last_error: null,
  };
}

export async function loadSyncState(userId: string): Promise<SyncState> {
  const client = ensureClient();
  const [{ data: integrationsData, error: integrationsError }, { data: jobsData, error: jobsError }] = await Promise.all([
    client
      .from(SYNC_IDENTITIES_TABLE)
      .select('provider,provider_username,access_token_encrypted,refresh_token_encrypted,token_expires_at,last_incremental_sync_at,sync_mode,default_conflict_policy')
      .eq('user_id', userId),
    client
      .from(SYNC_JOBS_TABLE)
      .select('id,provider,job_type,status,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  if (integrationsError) rethrowSchemaError(integrationsError);
  if (jobsError) rethrowSchemaError(jobsError);

  const integrationMap = new Map<ProviderId, IntegrationRow>();
  (integrationsData || []).forEach((row: any) => {
    const providerId = row.provider.toLowerCase() as ProviderId;
    integrationMap.set(providerId, {
      provider: providerId,
      status: 'connected',
      username: row.provider_username || '',
      access_token: row.access_token_encrypted,
      refresh_token: row.refresh_token_encrypted,
      token_expires_at: row.token_expires_at,
      last_sync_at: row.last_incremental_sync_at,
      sync_mode: (row.sync_mode || 'manual').toLowerCase().replace('_', '-') as SyncMode,
      conflict_mode: (
        row.default_conflict_policy === 'LOCAL_WINS' ? 'local_wins' :
          row.default_conflict_policy === 'REMOTE_WINS' ? 'provider_wins' : 'newest_wins'
      ) as ConflictMode,
    } as any);
  });

  return {
    integrations: PROVIDERS.map((provider) => integrationMap.get(provider.id as any) || defaultIntegration(provider.id)),
    jobs: (jobsData || []).map(j => ({
      id: j.id,
      provider: j.provider.toLowerCase(),
      direction:
        j.job_type === 'INITIAL_IMPORT' ? 'import' :
          (j.job_type || '').toLowerCase().includes('push') ? 'push' : 'pull',
      status: (j.status || '').toLowerCase(),
      created_at: j.created_at
    })) as any,
  };
}

export async function saveIntegration(_userId: string, provider: ProviderId, draft: SyncDraft & { id: string }) {
  if (!draft.id) {
    throw new Error(`Cannot connect to ${provider}: Provider user ID is missing.`);
  }
  // Save via backend to ensure sync_connections table is populated correctly
  await publicApiClient.post(`/sync/${provider}/connect`, {
    providerUserId: String(draft.id).trim(),
    providerUsername: draft.username.trim(),
    accessToken: draft.accessToken.trim(),
    refreshToken: draft.refreshToken,
    tokenExpiresAt: draft.tokenExpiresAt,
    syncMode: draft.syncMode === 'bidirectional' ? 'BIDIRECTIONAL' : 'IMPORT_ONLY',
    defaultConflictPolicy: draft.conflictMode === 'local_wins' ? 'LOCAL_WINS' :
      draft.conflictMode === 'provider_wins' ? 'REMOTE_WINS' : 'ASK'
  });
}

export async function updateConnectionPolicy(userId: string, provider: ProviderId, draft: Partial<SyncDraft>) {
  const client = ensureClient();
  const patch: any = {
    updated_at: new Date().toISOString()
  };

  if (draft.syncMode) {
    patch.sync_mode = draft.syncMode === 'bidirectional' ? 'BIDIRECTIONAL' : 
                     draft.syncMode === 'import-only' ? 'IMPORT_ONLY' : 'MANUAL';
  }

  if (draft.conflictMode) {
    patch.default_conflict_policy = draft.conflictMode === 'local_wins' ? 'LOCAL_WINS' :
                                   draft.conflictMode === 'provider_wins' ? 'REMOTE_WINS' : 'ASK';
  }

  const { error } = await client
    .from(SYNC_IDENTITIES_TABLE)
    .update(patch)
    .eq('user_id', userId)
    .eq('provider', provider.toUpperCase());

  if (error) rethrowSchemaError(error);
}

export async function disconnectIntegration(userId: string, provider: ProviderId) {
  const client = ensureClient();
  const { error } = await client
    .from(SYNC_IDENTITIES_TABLE)
    .delete()
    .eq('user_id', userId)
    .eq('provider', provider.toUpperCase());

  if (error) rethrowSchemaError(error);
}

export async function createSyncJob(userId: string, provider: ProviderId, direction: SyncDirection, _syncMode: SyncMode) {
  const client = ensureClient();
  const { data, error } = await client
    .from(SYNC_JOBS_TABLE)
    .insert({
      user_id: userId,
      provider: provider.toUpperCase() as any,
      job_type: direction === 'pull' ? 'INCREMENTAL_PULL' : 'INCREMENTAL_PUSH',
      status: 'PENDING',
    })
    .select('id,provider,job_type,status,created_at')
    .single();

  if (error) rethrowSchemaError(error);
  if (!data) throw new Error('Failed to create sync job');

  return {
    id: data.id,
    provider: data.provider.toLowerCase(),
    direction: (data.job_type || '').toLowerCase().includes('push') ? 'push' : 'pull',
    status: data.status.toLowerCase(),
    created_at: data.created_at
  } as any;
}

export async function finalizeSyncJob(jobId: string, patch: Record<string, unknown>) {
  const client = ensureClient();
  const { error } = await client
    .from(SYNC_JOBS_TABLE)
    .update({
      status: patch.status === 'completed' ? 'completed' : 'failed',
      error_message: patch.error_message as string || null
    })
    .eq('id', jobId);

  if (error) rethrowSchemaError(error);
}

export async function cancelSyncJob(jobId: string) {
  await publicApiClient.patch(`/sync/jobs/${jobId}/cancel`);
}

export async function touchIntegration(userId: string, provider: ProviderId, patch: Partial<IntegrationRow>) {
  const client = ensureClient();
  const { error } = await client
    .from(SYNC_IDENTITIES_TABLE)
    .update({
      last_incremental_sync_at: patch.last_sync_at || new Date().toISOString(),
      last_successful_push_at: patch.last_push_at,
    })
    .eq('user_id', userId)
    .eq('provider', provider.toUpperCase());

  if (error) rethrowSchemaError(error);
}

export async function loadLocalMediaRows(userId: string): Promise<LocalMediaRow[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from(LIBRARY_ENTRIES_TABLE)
    .select(`
        user_id,
        status,
        score,
        progress,
        started_at,
        completed_at,
        updated_at,
        titles (
            id,
            title_romaji,
            cover_url,
            total_chapters,
            mappings:sync_identities (
                provider,
                provider_account_id
            )
        )
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    // Fallback for different schema versions
    const { data: fallbackData, error: fallbackError } = await client
      .from(LIBRARY_ENTRIES_TABLE)
      .select(`
            user_id,
            status,
            score,
            progress:progress_chapters,
            started_at,
            completed_at,
            updated_at,
            titles (
                id,
                title_romaji,
                cover_image_url,
                chapter_count,
                mappings:title_provider_mappings (
                    provider,
                    provider_title_id
                )
            )
        `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (fallbackError) throw fallbackError;
    return processRows(fallbackData);
  }

  return processRows(data);
}

function processRows(data: any[] | null): LocalMediaRow[] {
  return (data || []).map(row => {
    const titles = row.titles as any;
    const mappings = titles?.mappings || [];
    const anilistMapping = mappings.find((m: any) => m.provider === 'ANILIST');

    return {
      user_id: row.user_id,
      series_id: anilistMapping ? parseInt(anilistMapping.provider_title_id || anilistMapping.provider_account_id) : 0,
      status: row.status,
      score: row.score,
      progress: row.progress,
      updated_at: row.updated_at,
      raw_media: {
        title: titles?.title_romaji,
        coverUrl: titles?.cover_url || titles?.cover_image_url,
        genres: [], // Omit to avoid schema errors
        chapters: titles?.total_chapters || titles?.chapter_count
      }
    };
  }) as any;
}

export async function upsertLocalMediaRows(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const client = ensureClient();
  const dedupedRows = dedupeLocalMediaRows(rows);
  if (dedupedRows.length === 0) return;

  for (const row of dedupedRows) {
    const { data: title } = await client
      .from(TITLES_TABLE)
      .upsert({
        canonical_slug: String(row.series_id), // Fallback slug
        primary_title: (row.raw_media as any)?.title || 'Unknown Title',
        title_romaji: (row.raw_media as any)?.title
      }, { onConflict: 'canonical_slug' })
      .select('id')
      .single();

    if (title) {
      // Create mapping first
      await client.from('title_provider_mappings').upsert({
        title_id: title.id,
        provider: 'ANILIST',
        provider_title_id: String(row.series_id)
      }, { onConflict: 'provider,provider_title_id' });

      const dbStatus = toDbStatus(row.status as string);
      await client.from(LIBRARY_ENTRIES_TABLE).upsert({
        user_id: row.user_id,
        title_id: title.id,
        status: dbStatus,
        progress_chapters: row.progress,
        score: toDbScore(row.score as number | string | null | undefined),
        completed_at: dbStatus === 'COMPLETED' ? ((row.completed_at as string) || new Date().toISOString()) : null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,title_id' });
    }
  }
}

export async function loadMediaMappings(userId: string, provider: ProviderId): Promise<ExternalMediaMappingRow[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from(EXTERNAL_MEDIA_MAPPINGS_TABLE)
    .select('provider,series_id,provider_media_id,provider_media_type,provider_title,provider_updated_at')
    .eq('user_id', userId)
    .eq('provider', provider);

  if (error) rethrowSchemaError(error);
  return (data || []) as ExternalMediaMappingRow[];
}

export async function upsertMediaMappings(userId: string, rows: Array<ExternalMediaMappingRow & { local_title?: string | null }>) {
  if (rows.length === 0) return;
  const client = ensureClient();
  const now = new Date().toISOString();
  const dedupedRows = dedupeMediaMappings(rows);
  if (dedupedRows.length === 0) return;
  const { error } = await client
    .from(EXTERNAL_MEDIA_MAPPINGS_TABLE)
    .upsert(
      dedupedRows.map((row) => ({
        user_id: userId,
        provider: row.provider,
        series_id: row.series_id,
        provider_media_id: row.provider_media_id,
        provider_media_type: row.provider_media_type,
        provider_title: row.provider_title,
        local_title: row.local_title || null,
        provider_updated_at: row.provider_updated_at,
        last_seen_at: now,
      })),
      { onConflict: 'user_id,provider,provider_media_id' }
    );

  if (error) rethrowSchemaError(error);
}

export async function insertActivityLogs(rows: ActivityLogInsertRow[]) {
  if (rows.length === 0) return;
  const client = ensureClient();
  const { error } = await client.from('notifications').insert(
    rows.map((row) => ({
      user_id: row.user_id,
      type: 'SYSTEM',
      title: 'Sync Activity',
      message: `${row.action_type} for series ${row.series_id}`,
      reference_id: null,
    }))
  );

  if (error) throw error;
}
