import type {
  AuthContextUser,
  LibraryItem,
  MediaStats,
  ProfilePrivacyConfig,
  ProfileSectionsConfig,
  SnapshotCardId,
  UserStats,
} from '../../../shared/types/types';
import { normalizeUsername } from '../utils/profileUsername';
import {
  isMissingColumnError,
  isMissingTableError,
  MissingSupabaseFeatureError,
  isColumnKnownMissing,
  recordMissingColumn
} from '../../../shared/api/supabaseSchema';
import { isSupabaseConfigured, supabase } from '../../../shared/api/supabaseClient';

const PUBLIC_PROFILES_MIGRATION = '20260326_public_profiles_and_avatars.sql';
const SUPPORTED_PUBLIC_PROFILE_COLUMNS = new Set([
  'user_id',
  'username',
  'display_name',
  'avatar_url',
  'banner_url',
  'bio',
  'location',
  'website',
  'twitter_handle',
  'is_private',
  'show_stats',
  'custom_colors',
  'favorite_characters',
  'profile_sections',
  'profile_privacy',
  'featured_collections',
  'snapshot_cards',
  'now_reading',
  'public_changelog',
  'total_entries',
  'completed_entries',
  'reading_entries',
  'favorites_count',
  'favorite_manga_order',
  'pinned_manga_ids',
  'total_chapters',
  'mean_score',
  'genre_stats',
  'anime_stats',
  'manga_stats',
  'recent_library',
]);

const lastSyncedProfilePayloadByUser = new Map<string, string>();
const inFlightProfileUpserts = new Map<string, Promise<void>>();

function stableStringify(value: unknown): string {
  if (typeof value === 'undefined') {
    return 'undefined';
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

function getErrorMessage(error: unknown): string {
  return error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
    ? error.message
    : '';
}

function deletePayloadKey(payload: Partial<PublicProfileRecord>, key: string) {
  delete payload[key as keyof PublicProfileRecord];
}

export interface PublicProfileRecord {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  twitter_handle: string | null;
  is_private: boolean;
  show_stats: boolean;
  custom_colors: { primary: string; background: string };
  favorite_manga_order?: string[];
  pinned_manga_ids?: string[];
  profile_sections?: ProfileSectionsConfig;
  profile_privacy?: ProfilePrivacyConfig;
  featured_collections?: Array<{
    name: string;
    description?: string;
    count: number;
    covers: string[];
    itemGenres?: string[][];
  }>;
  snapshot_cards?: SnapshotCardId[];
  now_reading?: {
    id: string;
    title: string;
    coverUrl: string;
    progress: number;
    chapters?: number | null;
    score?: number;
    publicNote?: string | null;
    genres?: string[];
  } | null;
  public_changelog?: Array<{
    id: string;
    title: string;
    status: string;
    progress: number;
    updatedAt?: string;
    publicNote?: string | null;
    genres?: string[];
  }>;
  total_entries: number;
  completed_entries: number;
  reading_entries: number;
  favorites_count?: number;
  total_chapters: number;
  mean_score: number;
  genre_stats: Array<{ name: string; count: number }>;
  anime_stats?: MediaStats;
  manga_stats?: MediaStats;
  favorite_characters?: Array<{ id: string; name: string; image: string }>;
  recent_library: Array<{
    id: string;
    seriesId?: number;
    title: string;
    coverUrl: string;
    progress: number;
    chapters?: number | null;
    episodes?: number | null;
    score?: number;
    status: string;
    mediaType: string;
    publicNote?: string | null;
    updatedAt?: string;
    isFavourite?: boolean;
    genres?: string[];
  }>;
  created_at: string;
  updated_at: string;
}

function mapRecentLibrary(library: LibraryItem[]) {
  // Sort library by last updated first
  const sorted = [...library].sort((a, b) => {
    const aTs = Date.parse(a.updatedAt || '') || 0;
    const bTs = Date.parse(b.updatedAt || '') || 0;
    return bTs - aTs;
  });

  // Always include all favorites, then pad with recent items up to a reasonable limit (e.g., 100)
  const favorites = sorted.filter(item => item.isFavourite);
  const nonFavorites = sorted.filter(item => !item.isFavourite);

  const combined = [...favorites, ...nonFavorites].slice(0, 100);

  return combined.map((item) => ({
    id: item.id,
    dbId: item.dbId || item.id,
    seriesId: item.seriesId,
    title: item.title,
    coverUrl: item.coverUrl,
    progress: item.progress || 0,
    chapters: item.chapters ?? null,
    episodes: item.episodes ?? null,
    score: item.score ?? 0,
    status: item.status,
    mediaType: item.mediaType,
    publicNote: (item.comments || [])[0]?.text || null,
    updatedAt: item.updatedAt,
    isFavourite: item.isFavourite,
    genres: item.genres,
  }));
}

function mapFeaturedCollections(library: LibraryItem[], featuredNames: string[]) {
  return featuredNames.slice(0, 6).map((name) => {
    const items = library.filter((item) => (item.customLists || []).includes(name));
    return {
      name,
      description: 'Curated by the archive owner',
      count: items.length,
      covers: items.slice(0, 4).map((item) => item.coverUrl),
      itemGenres: items.slice(0, 4).map((item) => item.genres || []),
    };
  });
}

function mapPublicChangelog(library: LibraryItem[]) {
  return [...library]
    .sort((a, b) => {
      const aTs = Date.parse(a.updatedAt || '') || 0;
      const bTs = Date.parse(b.updatedAt || '') || 0;
      return bTs - aTs;
    })
    .slice(0, 12)
    .map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      progress: item.progress || 0,
      updatedAt: item.updatedAt,
      publicNote: (item.comments || [])[0]?.text || null,
      genres: item.genres,
    }));
}

async function upsertPublicProfile(
  payload: Partial<PublicProfileRecord> & { user_id: string; username: string; display_name: string }
) {
  if (!isSupabaseConfigured()) return;

  const { data: existing, error: lookupError } = await supabase!
    .from('public_profiles')
    .select('user_id')
    .eq('user_id', payload.user_id)
    .maybeSingle();

  if (lookupError) {
    if (isMissingTableError(lookupError, 'public_profiles')) {
      throw new MissingSupabaseFeatureError('public_profiles', 'Public profiles', PUBLIC_PROFILES_MIGRATION);
    }
    throw lookupError;
  }

  const finalPayload = Object.fromEntries(
    Object.entries(payload).filter(([key]) => SUPPORTED_PUBLIC_PROFILE_COLUMNS.has(key))
  ) as Partial<PublicProfileRecord> & { user_id: string; username: string; display_name: string };

  // Proactively remove known missing columns
  Object.keys(finalPayload).forEach(key => {
    if (isColumnKnownMissing(key)) {
      deletePayloadKey(finalPayload, key);
    }
  });

  const payloadKey = stableStringify(finalPayload);
  if (lastSyncedProfilePayloadByUser.get(payload.user_id) === payloadKey) {
    return;
  }

  const inFlightKey = `${payload.user_id}:${payloadKey}`;
  const existingInFlight = inFlightProfileUpserts.get(inFlightKey);
  if (existingInFlight) {
    return existingInFlight;
  }

  const request = performPublicProfileUpsert(existing, finalPayload, payload.user_id, payloadKey);
  inFlightProfileUpserts.set(inFlightKey, request);

  try {
    await request;
  } finally {
    inFlightProfileUpserts.delete(inFlightKey);
  }
}

async function performPublicProfileUpsert(
  existing: { user_id: string } | null,
  finalPayload: Partial<PublicProfileRecord> & { user_id: string; username: string; display_name: string },
  userId: string,
  originalPayloadKey: string
) {
  let attempts = 0;
  const maxAttempts = 10;
  while (attempts < maxAttempts) {
    const { error } = existing
      ? await supabase!.from('public_profiles').update(finalPayload).eq('user_id', userId)
      : await supabase!.from('public_profiles').insert(finalPayload);

    if (!error) {
      lastSyncedProfilePayloadByUser.set(userId, originalPayloadKey);
      return;
    }

    // Check for missing column error (PGRST204)
    if (isMissingColumnError(error)) {
      const message = error.message || '';
      const match = message.match(/column\s+['"]?([^"'\s]+)['"]?/i);
      let column = match ? match[1] : null;

      if (column) {
        if (column.includes('.')) {
          const parts = column.split('.');
          column = parts[parts.length - 1];
        }

        if (column in finalPayload) {
          console.warn(`[publicProfile] Column "${column}" not found in schema, removing from payload and retrying`);
          recordMissingColumn(column);
          deletePayloadKey(finalPayload, column);
          attempts++;
          continue;
        }
      }
    }

    if (isMissingTableError(error, 'public_profiles')) {
      throw new MissingSupabaseFeatureError('public_profiles', 'Public profiles', PUBLIC_PROFILES_MIGRATION);
    }

    throw error;
  }
}

export async function syncPublicProfileIdentity(user: AuthContextUser) {
  await upsertPublicProfile({
    user_id: user.id,
    username: normalizeUsername(user.username || '', user.email),
    display_name: user.displayName || 'Beach Explorer',
    avatar_url: user.avatarUrl || null,
    banner_url: user.bannerUrl || null,
    bio: user.bio || null,
    location: user.location || null,
    website: user.website || null,
    twitter_handle: user.twitterHandle || null,
    is_private: user.isPrivate ?? false,
    show_stats: user.showStats ?? true,
    custom_colors: user.customColors || { primary: '#F77F00', background: '#000000' },
    favorite_characters: user.favoriteCharacters || [],
    favorite_manga_order: user.favoriteMangaOrder || [],
    pinned_manga_ids: user.pinnedMangaIds || [],
    profile_sections: user.profileSections,
    profile_privacy: user.profilePrivacy,
    snapshot_cards: user.snapshotCards || ['archive_overview', 'completion_ratio', 'top_genre'],
  });
}

export async function syncPublicProfileSnapshot(input: {
  user: AuthContextUser;
  stats: UserStats;
  library: LibraryItem[];
}) {
  const { user, stats, library } = input;
  const featuredNames = user.featuredCollections || [];
  const nowReadingId = user.nowReadingId;
  const nowReadingSource = nowReadingId ? library.find((item) => item.id === nowReadingId) : null;

  await upsertPublicProfile({
    user_id: user.id,
    username: normalizeUsername(user.username || '', user.email),
    display_name: user.displayName || 'Beach Explorer',
    avatar_url: user.avatarUrl || null,
    banner_url: user.bannerUrl || null,
    bio: user.bio || null,
    location: user.location || null,
    website: user.website || null,
    twitter_handle: user.twitterHandle || null,
    is_private: user.isPrivate ?? false,
    show_stats: user.showStats ?? true,
    custom_colors: user.customColors || { primary: '#F77F00', background: '#000000' },
    favorite_characters: user.favoriteCharacters || [],
    favorite_manga_order: user.favoriteMangaOrder || [],
    pinned_manga_ids: user.pinnedMangaIds || [],
    profile_sections: user.profileSections,
    profile_privacy: user.profilePrivacy,
    featured_collections: mapFeaturedCollections(library, featuredNames),
    snapshot_cards: user.snapshotCards || ['archive_overview', 'completion_ratio', 'top_genre'],
    now_reading: nowReadingSource
      ? {
        id: nowReadingSource.id,
        title: nowReadingSource.title,
        coverUrl: nowReadingSource.coverUrl,
        progress: nowReadingSource.progress || 0,
        chapters: nowReadingSource.chapters ?? null,
        score: nowReadingSource.score || 0,
        publicNote: (nowReadingSource.comments || [])[0]?.text || null,
        genres: nowReadingSource.genres || [],
      }
      : null,
    public_changelog: mapPublicChangelog(library),
    total_entries: library.length,
    completed_entries: stats.completed || 0,
    reading_entries: stats.reading || 0,
    favorites_count: stats.favorites || 0,
    total_chapters: stats.totalChaptersRead || 0,
    mean_score: stats.meanScore || 0,
    genre_stats: stats.genreStats || [],
    anime_stats: stats.animeStats,
    manga_stats: stats.mangaStats,
    recent_library: mapRecentLibrary(library),
  });
}

export async function fetchPublicProfile(username: string, retryCount = 0): Promise<PublicProfileRecord | null> {
  if (!isSupabaseConfigured()) return null;

  const columns = Array.from(SUPPORTED_PUBLIC_PROFILE_COLUMNS)
    .filter(col => !isColumnKnownMissing(col))
    .join(', ');

  const { data, error } = await supabase!
    .from('public_profiles')
    .select(`${columns}, created_at, updated_at`)
    .eq('username', normalizeUsername(username))
    .maybeSingle();

  if (error) {
    // If we get a missing column error here, record it and retry
    if (isMissingColumnError(error) && retryCount < 10) {
      const message = getErrorMessage(error);
      // Improved regex to handle various formats
      const match = message.match(/column\s+([^"'\s]+|['"][^"']+['"])/i);
      const columnPath = match ? match[1] : null;
      
      if (columnPath) {
        // Strip quotes if present
        let column = columnPath.replace(/['"]/g, '');
        // If it's a dotted path (table.column), take the last part
        if (column.includes('.')) {
          const parts = column.split('.');
          column = parts[parts.length - 1];
        }
        
        console.warn(`[publicProfile] Detected missing column: "${column}" (path: ${columnPath}), retrying (${retryCount + 1}/10)`);
        recordMissingColumn(column);
        return fetchPublicProfile(username, retryCount + 1);
      }
    }

    if (isMissingTableError(error, 'public_profiles')) {
      throw new MissingSupabaseFeatureError('public_profiles', 'Public profiles', PUBLIC_PROFILES_MIGRATION);
    }
    throw error;
  }
  return data as PublicProfileRecord | null;
}
