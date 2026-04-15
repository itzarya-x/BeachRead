import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextUser, LibraryItem, UserStats, MediaType } from '../lib/types';
import { syncPublicProfileSnapshot } from '../lib/publicProfile';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { isMissingTableError } from '../lib/supabaseSchema';
import { useAuth } from './auth-context';

interface DataContextValue {
  library: LibraryItem[];
  loading: boolean;
  error: string | null;
  refreshLibrary: () => Promise<void>;
  addToLibrary: (item: Partial<LibraryItem> & { id: string; title: string }) => Promise<void>;
  updateLibraryItem: (id: string, updates: Partial<LibraryItem>) => Promise<void>;
  removeFromLibrary: (id: string) => Promise<void>;
  toggleFavourite: (id: string) => Promise<void>;
  stats: UserStats;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

const GUEST_LIBRARY_KEY = 'beachread_guest_library';
const FALLBACK_COVER_URL = '/cover-fallback.svg';

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeTitle(value: unknown, fallbackId: string | number): string {
  const direct = asNonEmptyString(value);
  if (direct) return direct;

  if (value && typeof value === 'object') {
    const titleObj = value as Record<string, unknown>;
    const preferred =
      asNonEmptyString(titleObj.english) ||
      asNonEmptyString(titleObj.romaji) ||
      asNonEmptyString(titleObj.userPreferred) ||
      asNonEmptyString(titleObj.native) ||
      asNonEmptyString(titleObj.title);

    if (preferred) return preferred;
  }

  return `Series ${fallbackId}`;
}

function deriveStatus(status: string | undefined, progress?: number | null, total?: number | null): LibraryItem['status'] {
  const coerced = coerceStatus(status);
  const safeProgress = typeof progress === 'number' ? progress : 0;
  const safeTotal = typeof total === 'number' && total > 0 ? total : null;

  if (coerced === 'PLANNING' && safeProgress > 0) {
    if (safeTotal !== null && safeProgress >= safeTotal) return 'COMPLETED';
    return 'READING';
  }

  if (coerced === 'READING' && safeTotal !== null && safeProgress >= safeTotal) {
    return 'COMPLETED';
  }

  return coerced;
}

function normalizeLibraryItem(item: Partial<LibraryItem> & { id: string }): LibraryItem {
  const mediaType = (item.mediaType || (item as any).type || 'MANGA') as MediaType;
  const chapters = item.chapters ?? null;
  const episodes = item.episodes ?? null;
  const volumes = item.volumes ?? null;
  const progress = item.progress || 0;
  
  const totalUnits = mediaType === 'ANIME' ? episodes : chapters;

  return {
    id: String(item.id),
    dbId: item.dbId,
    seriesId: item.seriesId,
    title: normalizeTitle(item.title, item.seriesId ?? item.id),
    status: deriveStatus(item.status, progress, totalUnits),
    progress,
    progressVolumes: item.progressVolumes || 0,
    repeat: item.repeat || 0,
    score: item.score || 0,
    coverUrl: asNonEmptyString(item.coverUrl) || '/cover-fallback.svg',
    genres: Array.isArray(item.genres) ? item.genres.filter((g): g is string => typeof g === 'string') : [],
    mediaType,
    chapters,
    episodes,
    volumes,
    format: item.format,
    isFavourite: !!item.isFavourite,
    comments: Array.isArray(item.comments) ? item.comments : [],
    customLists: Array.isArray(item.customLists)
      ? item.customLists.filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
      : [],
    startedAt: item.startedAt || null,
    completedAt: item.completedAt || null,
    updatedAt: item.updatedAt || new Date().toISOString(),
  };
}

function extractCoverUrl(raw: Record<string, unknown>): string {
  const coverDirect = asNonEmptyString(raw.coverUrl) || asNonEmptyString(raw.cover_image) || asNonEmptyString(raw.image);
  if (coverDirect) return coverDirect;

  const coverImage = raw.coverImage;
  if (typeof coverImage === 'string') return coverImage;
  if (coverImage && typeof coverImage === 'object') {
    const coverObject = coverImage as Record<string, unknown>;
    const nested =
      asNonEmptyString(coverObject.extraLarge) ||
      asNonEmptyString(coverObject.large) ||
      asNonEmptyString(coverObject.medium) ||
      asNonEmptyString(coverObject.small);
    if (nested) return nested;
  }

  const banner = asNonEmptyString(raw.bannerImage) || asNonEmptyString(raw.banner_image);
  return banner || FALLBACK_COVER_URL;
}

function needsHydration(item: LibraryItem): boolean {
  const likelyMissingTitle = !item.title || item.title.startsWith('Series ');
  const likelyMissingCover = !item.coverUrl || item.coverUrl === FALLBACK_COVER_URL;
  return likelyMissingTitle || likelyMissingCover;
}

function normalizeStatusValue(status?: string | null): string {
  return typeof status === 'string' ? status.trim().toUpperCase() : '';
}

function coerceStatus(status?: string): LibraryItem['status'] {
  const normalized = normalizeStatusValue(status);
  if (normalized === 'CURRENT' || normalized === 'READING') return 'READING';
  if (normalized === 'COMPLETED') return 'COMPLETED';
  if (normalized === 'DROPPED') return 'DROPPED';
  if (normalized === 'PAUSED' || normalized === 'ON_HOLD') return 'PAUSED';
  return 'PLANNING';
}

function toDbStatus(status?: string): string {
  const normalized = normalizeStatusValue(status);
  if (normalized === 'READING' || normalized === 'CURRENT') return 'CURRENT';
  if (normalized === 'COMPLETED') return 'COMPLETED';
  if (normalized === 'DROPPED') return 'DROPPED';
  if (normalized === 'PAUSED' || normalized === 'ON_HOLD') return 'PAUSED';
  return 'PLANNING';
}

function parseSeriesId(id: string): number {
  const numeric = Number(id);
  if (Number.isInteger(numeric) && numeric > 0) return numeric;
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || Date.now();
}

function getFallbackRowStatus(row: Record<string, unknown>): string | undefined {
  const direct = asNonEmptyString(row.status);
  if (direct) return direct;

  const rawListEntry = row.raw_list_entry;
  if (rawListEntry && typeof rawListEntry === 'object') {
    const rawListEntryObj = rawListEntry as Record<string, unknown>;
    const nested =
      asNonEmptyString(rawListEntryObj.status) ||
      asNonEmptyString(rawListEntryObj.provider_status) ||
      asNonEmptyString(rawListEntryObj.list_status);
    if (nested) return nested;

    if (rawListEntryObj.completed_at) return 'COMPLETED';
    if (rawListEntryObj.started_at) return 'READING';
  }

  if (row.completed_at) return 'COMPLETED';
  if (row.started_at) return 'READING';
  return undefined;
}
function mapRowToLibraryItem(row: any): LibraryItem {
  const title = row.titles || row.title || {};
  const mediaType = (title.media_type || row.media_type || 'MANGA') as MediaType;
  const chapters = typeof title.total_chapters === 'number' 
    ? title.total_chapters 
    : typeof title.chapter_count === 'number'
      ? title.chapter_count
      : null;
  const episodes = typeof title.total_episodes === 'number' ? title.total_episodes : null;
  const progress = typeof row.progress === 'number' 
    ? row.progress 
    : typeof row.progress_chapters === 'number'
      ? row.progress_chapters
      : 0;
  return {
    id: String(title.external_id || row.series_id || row.anilist_media_id || row.id),
    dbId: row.id,
    seriesId: title.external_id ? parseInt(title.external_id) : (row.series_id || row.anilist_media_id),
    title: title.title_romaji || title.title_english || row.title || 'Unknown Series',
    status: row.status,
    progress,
    progressVolumes: 0,
    repeat: 0,
    score: Number(row.score) || 0,
    coverUrl: title.cover_url || FALLBACK_COVER_URL,
    genres: Array.isArray(title.genres) ? title.genres : [],
    mediaType,
    chapters,
    episodes,
    volumes: typeof title.total_volumes === 'number' ? title.total_volumes : null,
    format: title.format,
    isFavourite: !!row.is_favourite,
    comments: [],
    customLists: [],
    startedAt: row.started_at,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  };
}

function mapLegacyRowToLibraryItem(row: Record<string, unknown>): LibraryItem {
  const rawMedia = row.raw_media && typeof row.raw_media === 'object'
    ? row.raw_media as Record<string, unknown>
    : {};
  const rawListEntry = row.raw_list_entry && typeof row.raw_list_entry === 'object'
    ? row.raw_list_entry as Record<string, unknown>
    : {};
  const seriesId =
    typeof row.series_id === 'number'
      ? row.series_id
      : typeof row.anilist_media_id === 'number'
        ? row.anilist_media_id
        : parseSeriesId(String(row.id || '0'));
  const customListsRaw = Array.isArray(rawListEntry.custom_lists)
    ? rawListEntry.custom_lists
    : Array.isArray(rawListEntry.customLists)
      ? rawListEntry.customLists
      : [];
  const commentsRaw = Array.isArray(rawMedia.comments) ? rawMedia.comments : [];
  
  // Prefer AniList raw data for type as it's more reliable for legacy entries
  const mediaType = (rawMedia.type || row.media_type || 'MANGA') as MediaType;

  const chapters =
    typeof rawMedia.chapters === 'number'
      ? rawMedia.chapters
      : typeof row.progress_total === 'number' && mediaType === 'MANGA'
        ? row.progress_total
        : null;
        
  const episodes = 
    typeof rawMedia.episodes === 'number' 
      ? rawMedia.episodes 
      : typeof row.progress_total === 'number' && mediaType === 'ANIME'
        ? row.progress_total
        : null;

  return normalizeLibraryItem({
    id: String(seriesId),
    dbId: typeof row.id === 'string' ? row.id : undefined,
    seriesId,
    title: normalizeTitle(
      row.title || rawMedia.title,
      seriesId
    ),
    status: coerceStatus(getFallbackRowStatus(row)),
    progress: typeof row.progress === 'number' ? row.progress : 0,
    score: typeof row.score === 'number' ? row.score : 0,
    coverUrl: extractCoverUrl(rawMedia),
    genres: Array.isArray(row.genres)
      ? row.genres.filter((value): value is string => typeof value === 'string')
      : Array.isArray(rawMedia.genres)
        ? rawMedia.genres.filter((value): value is string => typeof value === 'string')
        : [],
    mediaType,
    chapters,
    episodes,
    volumes: typeof rawMedia.volumes === 'number' ? rawMedia.volumes : null,
    format: (row.format || rawMedia.format) as string | undefined,
    isFavourite: Boolean(row.is_favourite) || Boolean(rawMedia.isFavourite),
    comments: commentsRaw.filter((value): value is { id: string; text: string; createdAt: string } => (
      Boolean(value)
      && typeof value === 'object'
      && typeof (value as { text?: unknown }).text === 'string'
    )),
    customLists: customListsRaw.filter((value): value is string => typeof value === 'string' && Boolean(value.trim())),
    startedAt: typeof row.started_at === 'string' ? row.started_at : null,
    completedAt: typeof row.completed_at === 'string' ? row.completed_at : null,
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : undefined,
  });
}

async function loadLegacyLibrary(userId: string): Promise<LibraryItem[]> {
  const { data, error } = await supabase!
    .from('user_media')
    .select(`
      id,
      series_id,
      anilist_media_id,
      title,
      status,
      score,
      progress,
      progress_total,
      started_at,
      completed_at,
      updated_at,
      genres,
      media_type,
      raw_media,
      raw_list_entry,
      is_favourite,
      deleted
    `)
    .eq('user_id', userId)
    .eq('deleted', false)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((row) => mapLegacyRowToLibraryItem(row as Record<string, unknown>));
}

function computeStats(library: LibraryItem[]): UserStats {
  const completed = library.filter((x) => x.status === 'COMPLETED').length;
  const reading = library.filter((x) => x.status === 'READING' || x.status === 'CURRENT').length;
  const planning = library.filter((x) => x.status === 'PLANNING').length;
  const dropped = library.filter((x) => x.status === 'DROPPED').length;
  const paused = library.filter((x) => x.status === 'PAUSED').length;
  const totalUnits = library.reduce((sum, x) => sum + (x.progress || 0), 0);
  const totalChaptersRead = library
    .filter((x) => x.mediaType !== 'ANIME')
    .reduce((sum, x) => sum + (x.progress || 0), 0);
  const totalEpisodesWatched = library
    .filter((x) => x.mediaType === 'ANIME')
    .reduce((sum, x) => sum + (x.progress || 0), 0);
  const withScore = library.filter((x) => (x.score || 0) > 0);
  const meanScore = withScore.length ? withScore.reduce((sum, x) => sum + (x.score || 0), 0) / withScore.length : 0;

  const genreCounter = new Map<string, number>();
  library.forEach((item) => {
    (item.genres || []).forEach((genre) => {
      genreCounter.set(genre, (genreCounter.get(genre) || 0) + 1);
    });
  });

  const totalItems = library.length || 1;
  const genreStats = Array.from(genreCounter.entries())
    .map(([name, count]) => ({ name, count, percentage: (count / totalItems) * 100 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const scoreDistribution = Array.from({ length: 10 }, (_, i) => ({ bucket: (i + 1) * 10, count: 0 }));
  withScore.forEach((item) => {
    const bucketIdx = Math.min(Math.floor((item.score - 1) / 10), 9);
    scoreDistribution[bucketIdx].count += 1;
  });

  // Profile Type Logic
  const totalWithStatus = completed + reading + dropped + paused;
  const completionRate = (completed / (totalWithStatus || 1)) * 100;
  const dropRate = (dropped / (totalWithStatus || 1)) * 100;
  
  let profileType: UserStats['profileType'] = 'STRATEGIST';
  if (completionRate > 70) profileType = 'COMPLETIONIST';
  else if (dropRate > 30) profileType = 'CRITIC';
  else if (totalItems < 20) profileType = 'CASUAL';

  const favorites = library.filter(x => x.isFavourite).length;
  const formats = {
    manga: library.filter(x => x.mediaType === 'MANGA').length,
    anime: library.filter(x => x.mediaType === 'ANIME').length,
    novel: library.filter(x => x.mediaType === 'NOVEL').length,
    oneShot: library.filter(x => {
        const total = x.mediaType === 'ANIME' ? x.episodes : x.chapters;
        return (total || 0) <= 1 && x.status === 'COMPLETED';
    }).length
  };

  // 1. Genre Affinity (Highest Mean Score per Genre)
  const genreScores = new Map<string, { total: number; count: number }>();
  withScore.forEach((item) => {
    (item.genres || []).forEach((genre) => {
      const current = genreScores.get(genre) || { total: 0, count: 0 };
      genreScores.set(genre, { total: current.total + item.score, count: current.count + 1 });
    });
  });

  let highestRatedGenre = { name: 'N/A', score: 0 };
  genreScores.forEach((val, key) => {
    const mean = val.total / val.count;
    if (val.count >= 3 && mean > highestRatedGenre.score) {
      highestRatedGenre = { name: key, score: Number(mean.toFixed(1)) };
    }
  });

  // 2. Reading Archetype (Length Distribution)
  const lengths = {
    marathons: library.filter(x => {
        const total = x.mediaType === 'ANIME' ? x.episodes : x.chapters;
        return (total || 0) >= 100;
    }).length,
    sprints: library.filter(x => {
        const total = x.mediaType === 'ANIME' ? x.episodes : x.chapters;
        return (total || 0) > 0 && (total || 0) < 30;
    }).length
  };

  // 3. Hoarding Ratio (Planning vs. Completed)
  const hoardingRatio = Number((planning / (completed || 1)).toFixed(2));

  // 4. Archive Maturity (Days since oldest entry)
  const dates = library.map(x => x.startedAt || x.updatedAt).filter(Boolean) as string[];
  let archiveMaturity = 'New Archive';
  if (dates.length > 0) {
    const oldest = new Date(Math.min(...dates.map(d => new Date(d).getTime())));
    const diffDays = Math.floor((new Date().getTime() - oldest.getTime()) / (1000 * 3600 * 24));
    archiveMaturity = diffDays > 365 ? `${(diffDays / 365).toFixed(1)}y` : `${diffDays}d`;
  }

  return {
    completed,
    reading,
    planning,
    dropped,
    paused,
    totalUnits,
    totalChaptersRead,
    totalEpisodesWatched,
    meanScore: Number(meanScore.toFixed(1)),
    genreStats,
    scoreDistribution,
    profileType,
    readingVelocity: [],
    favorites,
    formatStats: formats,
    highestRatedGenre,
    hoardingRatio,
    lengthStats: lengths,
    archiveMaturity
  };
}

function readGuestLibrary(): LibraryItem[] {
  const raw = localStorage.getItem(GUEST_LIBRARY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Partial<LibraryItem> & { id: string } => Boolean(item && typeof item === 'object' && 'id' in item))
      .map((item) => normalizeLibraryItem(item));
  } catch {
    return [];
  }
}

function writeGuestLibrary(library: LibraryItem[]) {
  localStorage.setItem(GUEST_LIBRARY_KEY, JSON.stringify(library));
}

async function syncSnapshotIfNeeded(user: AuthContextUser | null, library: LibraryItem[]) {
  if (!user || !isSupabaseConfigured()) return;

  try {
    await syncPublicProfileSnapshot({
      user,
      stats: computeStats(library),
      library,
    });
  } catch (error) {
    console.error('Failed to sync public profile snapshot:', error);
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshLibrary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!user || !isSupabaseConfigured()) {
        setLibrary(readGuestLibrary());
        return;
      }

      let mapped: LibraryItem[];

      try {
        mapped = await loadLegacyLibrary(user.id);
      } catch (legacyError) {
        if (!isMissingTableError(legacyError, 'user_media')) {
          throw legacyError;
        }

        const { data, error: fetchError } = await supabase!
          .from('library_entries')
          .select(`
            id,
            status,
            score,
            progress,
            started_at,
            completed_at,
            updated_at,
            titles (
              id,
              external_id,
              title_romaji,
              title_english,
              cover_url,
              total_chapters,
              total_episodes,
              genres,
              media_type
            )
          `)
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        mapped = (data || []).map(mapRowToLibraryItem);
      }

      setLibrary(mapped);
      void syncSnapshotIfNeeded(user, mapped);

      // Simple hydration pass if needed
      const staleItems = mapped.filter(needsHydration).slice(0, 10);
      if (staleItems.length > 0) {
        // ... hydration logic would need to update titles table now
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load library');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  useEffect(() => {
    void syncSnapshotIfNeeded(user, library);
  }, [user, library]);

  const addToLibrary = useCallback(
    async (item: Partial<LibraryItem> & { id: string; title: string }) => {
      setError(null);

      const seriesId = parseSeriesId(item.id);
      const optimistic: LibraryItem = normalizeLibraryItem({
        ...item,
        id: item.id,
        seriesId,
        updatedAt: item.updatedAt || new Date().toISOString(),
      });

      setLibrary((prev) => [optimistic, ...prev.filter((x) => x.id !== optimistic.id)]);

      try {
        if (!user || !isSupabaseConfigured()) {
          const next = [optimistic, ...readGuestLibrary().filter((x) => x.id !== optimistic.id)];
          writeGuestLibrary(next);
          setLibrary(next);
          return;
        }

        // 1. Ensure title exists
        const { data: titleData, error: titleError } = await supabase!
          .from('titles')
          .upsert({
            external_provider: 'ANILIST',
            external_id: String(seriesId),
            title_romaji: optimistic.title,
            cover_url: optimistic.coverUrl,
            genres: optimistic.genres,
            media_type: optimistic.mediaType,
            total_chapters: optimistic.chapters,
            chapter_count: optimistic.chapters,
            total_episodes: optimistic.episodes,
            total_volumes: optimistic.volumes,
            volume_count: optimistic.volumes,
            format: optimistic.format,
          }, { onConflict: 'external_provider,external_id' })
          .select('id')
          .single();

        if (titleError) throw titleError;

        // 2. Insert library entry
        const { error: upsertError } = await supabase!.from('library_entries').upsert(
          [
            {
              user_id: user.id,
              title_id: titleData.id,
              status: toDbStatus(optimistic.status),
              score: optimistic.score,
              progress: optimistic.progress,
              progress_chapters: optimistic.progress,
              started_at: optimistic.startedAt || null,
              completed_at: optimistic.completedAt || null,
            },
          ],
          { onConflict: 'user_id,title_id' }
        );
        if (upsertError) throw upsertError;
        void syncSnapshotIfNeeded(user, [optimistic, ...library.filter((x) => x.id !== optimistic.id)]);
      } catch (e: any) {
        setError(e?.message || 'Failed to add library item');
        await refreshLibrary();
      }
    },
    [refreshLibrary, user, library]
  );

  const updateLibraryItem = useCallback(
    async (id: string, updates: Partial<LibraryItem>) => {
      setError(null);
      const previous = library;

      setLibrary((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const merged = { ...item, ...updates };
          const totalUnits = merged.mediaType === 'ANIME' ? merged.episodes : merged.chapters;
          return {
            ...merged,
            status: deriveStatus(merged.status, merged.progress, totalUnits),
            updatedAt: new Date().toISOString(),
          };
        })
      );

      try {
        if (!user || !isSupabaseConfigured()) {
          const next = previous.map((item) => {
            if (item.id !== id) return item;
            const merged = { ...item, ...updates };
            const totalUnits = merged.mediaType === 'ANIME' ? merged.episodes : merged.chapters;
            return {
              ...merged,
              status: deriveStatus(merged.status, merged.progress, totalUnits),
              updatedAt: new Date().toISOString(),
            };
          });
          writeGuestLibrary(next);
          setLibrary(next);
          return;
        }

        const target = previous.find((x) => x.id === id);
        const merged = { ...target, ...updates };
        const totalUnits = merged.mediaType === 'ANIME' ? merged.episodes : merged.chapters;
        const derivedStatus = deriveStatus(merged.status, merged.progress, totalUnits);

        if (!target?.dbId) {
            // Fallback: refresh library to get dbId if it was missing (e.g. newly added)
            await refreshLibrary();
            return;
        }

        const { error: updateError } = await supabase!
          .from('library_entries')
          .update({
            status: toDbStatus(derivedStatus) as any, // Cast to any to avoid enum type issues in TS
            score: merged.score ?? 0,
            progress: merged.progress ?? 0,
            progress_chapters: merged.progress ?? 0,
            started_at: merged.startedAt ?? null,
            completed_at: merged.completedAt ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', target.dbId)
          .eq('user_id', user.id);

        if (updateError) throw updateError;
        const nextLibrary = previous.map((item) => {
          if (item.id !== id) return item;
          const nextItem = { ...item, ...updates };
          const totalUnits = nextItem.mediaType === 'ANIME' ? nextItem.episodes : nextItem.chapters;
          return {
            ...nextItem,
            status: deriveStatus(nextItem.status, nextItem.progress, totalUnits),
            updatedAt: new Date().toISOString(),
          };
        });
        void syncSnapshotIfNeeded(user, nextLibrary);
      } catch (e: any) {
        setError(e?.message || 'Failed to update library item');
        setLibrary(previous);
      }
    },
    [library, user, refreshLibrary]
  );

  const removeFromLibrary = useCallback(
    async (id: string) => {
      setError(null);
      const previous = library;
      setLibrary((prev) => prev.filter((item) => item.id !== id));

      try {
        if (!user || !isSupabaseConfigured()) {
          writeGuestLibrary(previous.filter((x) => x.id !== id));
          return;
        }

        const target = previous.find((x) => x.id === id);
        if (!target?.dbId) {
            await refreshLibrary();
            return;
        }

        const { error: deleteError } = await supabase!
          .from('library_entries')
          .delete() // Actually delete in new schema, or we could add a deleted column.
          .eq('id', target.dbId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
        void syncSnapshotIfNeeded(user, previous.filter((x) => x.id !== id));
      } catch (e: any) {
        setError(e?.message || 'Failed to remove library item');
        setLibrary(previous);
      }
    },
    [library, user, refreshLibrary]
  );

  const toggleFavourite = useCallback(
    async (id: string) => {
      const item = library.find((x) => x.id === id);
      if (!item) return;
      await updateLibraryItem(id, { isFavourite: !item.isFavourite });
    },
    [library, updateLibraryItem]
  );

  const value = useMemo<DataContextValue>(
    () => ({
      library,
      loading,
      error,
      refreshLibrary,
      addToLibrary,
      updateLibraryItem,
      removeFromLibrary,
      toggleFavourite,
      stats: computeStats(library),
    }),
    [library, loading, error, refreshLibrary, addToLibrary, updateLibraryItem, removeFromLibrary, toggleFavourite]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
