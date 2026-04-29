import type { LibraryItem } from '../../../../shared/types/types';
import { fetchProviderEntries, pushProviderEntry, searchAniListManga } from './providers';
import {
  insertActivityLogs,
  loadLocalMediaRows,
  loadMediaMappings,
  upsertLocalMediaRows,
  upsertMediaMappings,
} from './supabase';
import type {
  ConflictMode,
  LocalMediaRow,
  LocalToProviderOptions,
  ProviderMediaEntry,
  ProviderToLocalOptions,
  PushableLocalItem,
  SyncSummary,
} from './types';

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function coerceLibraryStatus(status?: string | null): LibraryItem['status'] {
  const normalized = typeof status === 'string' ? status.trim().toUpperCase() : '';
  if (normalized === 'CURRENT' || normalized === 'READING') return 'READING';
  if (normalized === 'COMPLETED') return 'COMPLETED';
  if (normalized === 'PAUSED' || normalized === 'ON_HOLD') return 'PAUSED';
  if (normalized === 'DROPPED') return 'DROPPED';
  return 'PLANNING';
}

function extractTitle(raw: Record<string, unknown> | null | undefined, fallbackSeriesId: number): string {
  if (!raw) return `Series ${fallbackSeriesId}`;

  const titleObject = raw.title;
  if (typeof titleObject === 'object' && titleObject) {
    const value = titleObject as Record<string, unknown>;
    const pick = value.english || value.romaji || value.userPreferred || value.native;
    if (typeof pick === 'string' && pick.trim()) return pick.trim();
  }

  const plain = raw.title;
  if (typeof plain === 'string' && plain.trim()) return plain.trim();
  return `Series ${fallbackSeriesId}`;
}

function rawCoverUrl(raw: Record<string, unknown> | null | undefined): string {
  if (!raw) return '/cover-fallback.svg';
  const direct = raw.coverUrl;
  if (typeof direct === 'string' && direct.trim()) return direct;
  const coverImage = raw.coverImage;
  if (coverImage && typeof coverImage === 'object') {
    const cover = coverImage as Record<string, unknown>;
    if (typeof cover.large === 'string' && cover.large.trim()) return cover.large;
    if (typeof cover.medium === 'string' && cover.medium.trim()) return cover.medium;
  }
  const picture = raw.main_picture;
  if (picture && typeof picture === 'object') {
    const mainPicture = picture as Record<string, unknown>;
    if (typeof mainPicture.large === 'string' && mainPicture.large.trim()) return mainPicture.large;
    if (typeof mainPicture.medium === 'string' && mainPicture.medium.trim()) return mainPicture.medium;
  }
  return '/cover-fallback.svg';
}

function localRowToLibraryItem(row: LocalMediaRow): LibraryItem {
  const raw = (row.raw_media && typeof row.raw_media === 'object' ? row.raw_media : {}) as Record<string, unknown>;
  const rawListEntry = (row.raw_list_entry && typeof row.raw_list_entry === 'object'
    ? row.raw_list_entry
    : {}) as Record<string, unknown>;
  const customListsRaw = Array.isArray(rawListEntry.custom_lists)
    ? rawListEntry.custom_lists
    : Array.isArray(rawListEntry.customLists)
      ? rawListEntry.customLists
      : [];
  const customLists = customListsRaw
    .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()));
  return {
    id: String(row.series_id),
    seriesId: row.series_id,
    title: extractTitle(raw, row.series_id),
    status: coerceLibraryStatus(row.status),
    progress: row.progress || 0,
    score: row.score || 0,
    coverUrl: rawCoverUrl(raw),
    genres: Array.isArray(raw.genres) ? raw.genres.filter((value): value is string => typeof value === 'string') : [],
    mediaType: 'MANGA',
    chapters: typeof raw.chapters === 'number' ? raw.chapters : null,
    isFavourite: Boolean(row.is_favourite) || Boolean(raw.isFavourite),
    comments: Array.isArray(raw.comments) ? raw.comments as Array<{ id: string; text: string; createdAt: string }> : [],
    customLists,
    updatedAt: row.updated_at || undefined,
  };
}

function chooseConflict(mode: ConflictMode, localUpdatedAt?: string | null, providerUpdatedAt?: string | null): 'local' | 'provider' {
  if (mode === 'local_wins') return 'local';
  if (mode === 'provider_wins') return 'provider';

  const localTime = localUpdatedAt ? new Date(localUpdatedAt).getTime() : 0;
  const providerTime = providerUpdatedAt ? new Date(providerUpdatedAt).getTime() : 0;
  
  // If timestamps are equal, we now favor 'provider' to ensure metadata updates 
  // (like favorites/custom lists) that might not have triggered a timestamp change on the provider are captured.
  return providerTime >= localTime ? 'provider' : 'local';
}

function buildLocalUpsertRow(userId: string, providerEntry: ProviderMediaEntry, existingRow?: LocalMediaRow) {
  const existingRaw = (existingRow?.raw_media && typeof existingRow.raw_media === 'object' ? existingRow.raw_media : {}) as Record<string, unknown>;
  const existingListEntry = (existingRow?.raw_list_entry && typeof existingRow.raw_list_entry === 'object'
    ? existingRow.raw_list_entry
    : {}) as Record<string, unknown>;
  const providerFavourite = Boolean(
    providerEntry.provider === 'anilist'
      && (providerEntry.isFavourite || (
        providerEntry.rawMedia
        && typeof providerEntry.rawMedia === 'object'
        && (providerEntry.rawMedia as Record<string, unknown>).isFavourite
      ))
  );
  return {
    user_id: userId,
    series_id: providerEntry.seriesId,
    media_type: 'MANGA',
    status: providerEntry.status,
    is_favourite: providerFavourite || Boolean(existingRow?.is_favourite) || Boolean(existingRaw.isFavourite),
    score: providerEntry.score,
    progress: providerEntry.progress,
    progress_volumes: providerEntry.progressVolumes,
    repeat: providerEntry.repeat,
    started_at: providerEntry.startedAt,
    completed_at: providerEntry.completedAt,
    raw_media: {
      ...existingRaw,
      ...providerEntry.rawMedia,
      title: providerEntry.rawMedia.title || existingRaw.title,
      genres: providerEntry.rawMedia.genres || existingRaw.genres || [],
      isFavourite: providerFavourite || Boolean(existingRaw.isFavourite),
      comments: existingRaw.comments || [],
    },
    raw_list_entry: {
      ...existingListEntry,
      provider: providerEntry.provider,
      status: providerEntry.status,
      provider_status: providerEntry.status,
      custom_lists: providerEntry.customLists,
      priority: providerEntry.priority,
      is_private: providerEntry.isPrivate,
      notes: providerEntry.notes,
      progress_volumes: providerEntry.progressVolumes,
      repeat: providerEntry.repeat,
      started_at: providerEntry.startedAt,
      completed_at: providerEntry.completedAt,
      synced_at: new Date().toISOString(),
    },
    deleted: false,
    updated_at: providerEntry.updatedAt || new Date().toISOString(),
  };
}

function pickBestAniListMatch(queryTitles: string[], matches: any[]): any | null {
  const normalizedQueries = queryTitles.map(normalizeText).filter(Boolean);
  for (const match of matches) {
    const candidates = [
      match?.title?.english,
      match?.title?.romaji,
      match?.title?.native,
    ].filter((value): value is string => typeof value === 'string' && Boolean(value.trim()));

    const normalizedCandidates = candidates.map(normalizeText);
    if (normalizedCandidates.some((candidate) => normalizedQueries.includes(candidate))) {
      return match;
    }
  }

  return matches[0] || null;
}

async function resolveSeriesIdForProviderEntry(
  providerEntry: ProviderMediaEntry,
  providerMapByMediaId: Map<string, number>,
): Promise<{ seriesId: number | null; rawMedia: Record<string, unknown>; title: string }> {
  const mappedSeriesId = providerMapByMediaId.get(providerEntry.providerMediaId);
  if (mappedSeriesId) {
    return {
      seriesId: mappedSeriesId,
      rawMedia: providerEntry.rawMedia,
      title: providerEntry.title,
    };
  }

  if (providerEntry.provider === 'anilist') {
    return {
      seriesId: Number(providerEntry.providerMediaId) || providerEntry.seriesId,
      rawMedia: providerEntry.rawMedia,
      title: providerEntry.title,
    };
  }

  for (const title of providerEntry.titles) {
    const matches = await searchAniListManga(title);
    const best = pickBestAniListMatch(providerEntry.titles, matches);
    if (best?.id) {
      return {
        seriesId: Number(best.id),
        rawMedia: {
          ...best,
          malId: providerEntry.providerMediaId,
        },
        title:
          best?.title?.english ||
          best?.title?.romaji ||
          best?.title?.native ||
          providerEntry.title,
      };
    }
  }

  return {
    seriesId: null,
    rawMedia: providerEntry.rawMedia,
    title: providerEntry.title,
  };
}

export async function syncProviderToLocal(options: ProviderToLocalOptions): Promise<SyncSummary> {
  const providerEntries = await fetchProviderEntries(options.provider, options.accessToken);
  const [localRows, mappings] = await Promise.all([
    loadLocalMediaRows(options.userId),
    loadMediaMappings(options.userId, options.provider),
  ]);

  const localBySeriesId = new Map(localRows.map((row) => [row.series_id, row]));
  const mappingByProviderId = new Map(mappings.map((row) => [row.provider_media_id, row.series_id]));
  const rowsToUpsert: Record<string, unknown>[] = [];
  const activityRows: Array<{
    user_id: string;
    series_id: number | null;
    action_type: string;
    media_type: 'MANGA';
    details: Record<string, unknown>;
  }> = [];
  const mappingRows: Array<{
    provider: typeof options.provider;
    series_id: number;
    provider_media_id: string;
    provider_media_type: 'MANGA';
    provider_title: string | null;
    provider_updated_at: string | null;
    local_title?: string | null;
  }> = [];

  let processed = 0;
  let skipped = 0;
  let conflictsResolved = 0;
  const notes: string[] = [];

  for (const entry of providerEntries) {
    const resolved = await resolveSeriesIdForProviderEntry(entry, mappingByProviderId);
    if (!resolved.seriesId) {
      skipped += 1;
      notes.push(`${entry.provider.toUpperCase()}: skipped "${entry.title}" because no stable local series mapping could be resolved.`);
      continue;
    }

    entry.seriesId = resolved.seriesId;
    entry.rawMedia = resolved.rawMedia;
    const existingRow = localBySeriesId.get(resolved.seriesId);
    const decision = existingRow
      ? chooseConflict(options.conflictMode, existingRow.updated_at, entry.updatedAt)
      : 'provider';

    mappingRows.push({
      provider: options.provider,
      series_id: resolved.seriesId,
      provider_media_id: entry.providerMediaId,
      provider_media_type: 'MANGA',
      provider_title: entry.title,
      provider_updated_at: entry.updatedAt,
      local_title: resolved.title,
    });

    if (existingRow && decision === 'local') {
      conflictsResolved += 1;
      continue;
    }

    rowsToUpsert.push(buildLocalUpsertRow(options.userId, entry, existingRow));
    activityRows.push({
      user_id: options.userId,
      series_id: resolved.seriesId,
      action_type: options.direction === 'import' ? 'SYNC_IMPORT_UPDATE' : 'SYNC_PULL_UPDATE',
      media_type: 'MANGA',
      details: {
        title: resolved.title || entry.title,
        provider: options.provider,
        direction: options.direction,
        status: entry.status,
        progress: entry.progress,
        score: entry.score,
        custom_lists: entry.customLists,
        synced_at: new Date().toISOString(),
      },
    });
    processed += 1;
  }

  await Promise.all([
    upsertLocalMediaRows(rowsToUpsert),
    upsertMediaMappings(options.userId, mappingRows),
  ]);

  try {
    await insertActivityLogs(activityRows);
  } catch (_err) {
    notes.push('Some notification logs could not be written to activity_log.');
  }

  return {
    total: providerEntries.length,
    processed,
    skipped,
    conflictsResolved,
    notes,
  };
}

function inferAniListProviderId(row: LocalMediaRow): string | null {
  if (Number.isInteger(row.series_id) && row.series_id > 0) {
    return String(row.series_id);
  }
  return null;
}

function buildPushableLocalItems(rows: LocalMediaRow[]): PushableLocalItem[] {
  return rows.map((row) => ({
    row,
    libraryItem: localRowToLibraryItem(row),
  }));
}

export async function syncLocalToProvider(options: LocalToProviderOptions): Promise<SyncSummary> {
  const [providerEntries, localRows, mappings] = await Promise.all([
    fetchProviderEntries(options.provider, options.accessToken),
    loadLocalMediaRows(options.userId),
    loadMediaMappings(options.userId, options.provider),
  ]);

  const providerByMediaId = new Map(providerEntries.map((entry) => [entry.providerMediaId, entry]));
  const mappingBySeriesId = new Map(mappings.map((row) => [row.series_id, row]));
  const activityRows: Array<{
    user_id: string;
    series_id: number | null;
    action_type: string;
    media_type: 'MANGA';
    details: Record<string, unknown>;
  }> = [];
  const mappingRows: Array<{
    provider: typeof options.provider;
    series_id: number;
    provider_media_id: string;
    provider_media_type: 'MANGA';
    provider_title: string | null;
    provider_updated_at: string | null;
    local_title?: string | null;
  }> = [];

  let processed = 0;
  let skipped = 0;
  let conflictsResolved = 0;
  const notes: string[] = [];

  for (const item of buildPushableLocalItems(localRows)) {
    let providerMediaId = mappingBySeriesId.get(item.row.series_id)?.provider_media_id || null;

    if (!providerMediaId && options.provider === 'anilist') {
      providerMediaId = inferAniListProviderId(item.row);
    }

    if (!providerMediaId) {
      skipped += 1;
      notes.push(`${options.provider.toUpperCase()}: skipped "${item.libraryItem.title}" because no provider ID mapping is stored.`);
      continue;
    }

    const providerEntry = providerByMediaId.get(providerMediaId);
    const decision = providerEntry
      ? chooseConflict(options.conflictMode, item.row.updated_at, providerEntry.updatedAt)
      : 'local';

    if (providerEntry && decision === 'provider') {
      conflictsResolved += 1;
      continue;
    }

    await pushProviderEntry(options.provider, options.accessToken, providerMediaId, item.libraryItem);
    processed += 1;
    activityRows.push({
      user_id: options.userId,
      series_id: item.row.series_id,
      action_type: options.direction === 'push' ? 'SYNC_PUSH_UPDATE' : 'SYNC_EXPORT_UPDATE',
      media_type: 'MANGA',
      details: {
        title: item.libraryItem.title,
        provider: options.provider,
        direction: options.direction,
        status: item.libraryItem.status,
        progress: item.libraryItem.progress || 0,
        score: item.libraryItem.score || 0,
        custom_lists: item.libraryItem.customLists || [],
        pushed_at: new Date().toISOString(),
      },
    });

    mappingRows.push({
      provider: options.provider,
      series_id: item.row.series_id,
      provider_media_id: providerMediaId,
      provider_media_type: 'MANGA',
      provider_title: item.libraryItem.title,
      provider_updated_at: new Date().toISOString(),
      local_title: item.libraryItem.title,
    });
  }

  await upsertMediaMappings(options.userId, mappingRows);
  try {
    await insertActivityLogs(activityRows);
  } catch (_err) {
    notes.push('Some notification logs could not be written to activity_log.');
  }

  return {
    total: localRows.length,
    processed,
    skipped,
    conflictsResolved,
    notes,
  };
}
