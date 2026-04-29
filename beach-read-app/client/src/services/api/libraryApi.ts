import { supabase, isSupabaseConfigured } from '../../shared/api/supabaseClient';
import { isMissingColumnError, isMissingTableError } from '../../shared/api/supabaseSchema';
import {
    mapRowToLibraryItem,
    mapLegacyRowToLibraryItem,
    toDbStatus,
    toDbScore,
    parseSeriesId
} from '../../features/library/utils/libraryTransformers';
import type { LibraryItem } from '../../shared/types/types';

export const GUEST_LIBRARY_KEY = 'beachread_guest_library';

export function readGuestLibrary(): LibraryItem[] {
    const raw = localStorage.getItem(GUEST_LIBRARY_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed;
    } catch {
        return [];
    }
}

export function writeGuestLibrary(library: LibraryItem[]) {
    localStorage.setItem(GUEST_LIBRARY_KEY, JSON.stringify(library));
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

async function loadModernLibrary(userId: string): Promise<LibraryItem[]> {
    const modernQuery = async () => supabase!
        .from('library_entries')
        .select(`
        id,
        status,
        score,
        progress:progress_chapters,
        started_at,
        completed_at,
        updated_at,
        is_favorite,
        title:titles!inner (
          id,
          title_romaji,
          title_english,
          cover_image_url,
          chapter_count,
          volume_count,
          format,
          media_type,
          mappings:title_provider_mappings (
            provider,
            provider_title_id
          )
        )
      `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    const legacyQuery = async () => supabase!
        .from('library_entries')
        .select(`
        id,
        status,
        score,
        progress,
        started_at,
        completed_at,
        updated_at,
        is_favorite,
        title:titles!inner (
          id,
          external_id,
          title_romaji,
          title_english,
          cover_url:cover_image_url,
          total_chapters:chapter_count,
          total_episodes:total_episodes,
          genres,
          media_type
        )
      `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    const { data, error } = await modernQuery();
    if (error) {
        const shouldFallback =
            isMissingColumnError(error, 'progress_chapters') ||
            isMissingColumnError(error, 'is_favorite') ||
            isMissingColumnError(error, 'cover_image_url') ||
            isMissingTableError(error, 'title_provider_mappings');

        if (!shouldFallback) {
            throw error;
        }

        const { data: legacyData, error: legacyError } = await legacyQuery();
        if (legacyError) throw legacyError;
        return (legacyData || []).map((row: any) => mapRowToLibraryItem(row as any));
    }

    return (data || []).map((row: any) => mapRowToLibraryItem(row as any));
}

async function ensureModernTitle(userId: string, item: LibraryItem): Promise<string> {
    const seriesId = String(parseSeriesId(item.id));

    const { data: existingMapping, error: mappingError } = await supabase!
        .from('title_provider_mappings')
        .select('title_id')
        .eq('provider', 'ANILIST')
        .eq('provider_title_id', seriesId)
        .maybeSingle();

    if (mappingError && !isMissingTableError(mappingError, 'title_provider_mappings')) {
        throw mappingError;
    }

    if (existingMapping?.title_id) {
        return existingMapping.title_id;
    }

    const primaryTitle = item.title?.trim() || `Series ${seriesId}`;
    const canonicalSlug = `anilist-${seriesId}`;

    const { data: titleData, error: titleError } = await supabase!
        .from('titles')
        .upsert({
            canonical_slug: canonicalSlug,
            primary_title: primaryTitle,
            title_romaji: primaryTitle,
            title_english: primaryTitle,
            cover_image_url: item.coverUrl,
            chapter_count: item.chapters,
            volume_count: item.volumes,
            format: item.format || 'MANGA',
            updated_at: new Date().toISOString(),
        }, { onConflict: 'canonical_slug' })
        .select('id')
        .single();

    if (titleError) throw titleError;

    const { error: providerMappingError } = await supabase!
        .from('title_provider_mappings')
        .upsert({
            title_id: titleData.id,
            provider: 'ANILIST',
            provider_title_id: seriesId,
            updated_at: new Date().toISOString(),
        }, { onConflict: 'provider,provider_title_id' });

    if (providerMappingError) throw providerMappingError;

    const { error: identityError } = await supabase!
        .from('sync_identities')
        .upsert({
            user_id: userId,
            provider: 'ANILIST',
            provider_account_id: seriesId,
        }, { onConflict: 'user_id,provider' });

    if (identityError && !isMissingTableError(identityError, 'sync_identities')) {
        throw identityError;
    }

    return titleData.id;
}

export async function fetchLibraryItems(userId?: string): Promise<LibraryItem[]> {
    if (!userId || !isSupabaseConfigured()) {
        return readGuestLibrary();
    }

    try {
        // Fetch from both legacy and modern tables to ensure full coverage during migration
        const legacyPromise = loadLegacyLibrary(userId).catch(err => {
            if (!isMissingTableError(err, 'user_media')) console.error('Legacy library load error:', err);
            return [] as LibraryItem[];
        });

        const modernPromise = loadModernLibrary(userId).catch(err => {
            if (!isMissingTableError(err, 'library_entries')) console.error('Modern library load error:', err);
            return [] as LibraryItem[];
        });

        const [legacyItems, modernItems] = await Promise.all([legacyPromise, modernPromise]);

        // Merge items by ID, modern items take precedence in case of duplicates
        const mergedMap = new Map<string, LibraryItem>();
        legacyItems.forEach(item => mergedMap.set(item.id, item));
        modernItems.forEach(item => mergedMap.set(item.id, item));

        return Array.from(mergedMap.values()).sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA;
        });
    } catch (error) {
        console.error('Failed to fetch library items:', error);
        return [];
    }
}

export async function addLibraryEntry(userId: string, item: LibraryItem): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const seriesId = parseSeriesId(item.id);

    let titleId: string;
    try {
        titleId = await ensureModernTitle(userId, item);
    } catch (modernError) {
        const canFallback =
            isMissingColumnError(modernError, 'canonical_slug') ||
            isMissingColumnError(modernError, 'primary_title') ||
            isMissingTableError(modernError, 'title_provider_mappings');

        if (!canFallback) {
            throw modernError;
        }

        const { data: titleData, error: titleError } = await supabase!
            .from('titles')
            .upsert({
                external_provider: 'ANILIST',
                external_id: String(seriesId),
                title_romaji: item.title,
                cover_url: item.coverUrl,
                genres: item.genres,
                media_type: item.mediaType,
                total_chapters: item.chapters,
                chapter_count: item.chapters,
                total_episodes: item.episodes,
                total_volumes: item.volumes,
                volume_count: item.volumes,
                format: item.format,
            }, { onConflict: 'external_provider,external_id' })
            .select('id')
            .single();

        if (titleError) throw titleError;
        titleId = titleData.id;
    }

    // Insert library entry
    const dbStatus = toDbStatus(item.status);
    const { error: upsertError } = await supabase!.from('library_entries').upsert(
        [
            {
                user_id: userId,
                title_id: titleId,
                status: dbStatus,
                score: toDbScore(item.score),
                progress_chapters: item.progress,
                is_favorite: !!item.isFavourite,
                started_at: item.startedAt || null,
                completed_at: dbStatus === 'COMPLETED' ? (item.completedAt || new Date().toISOString()) : null,
                reader_url: item.readerUrl,
            },
        ],
        { onConflict: 'user_id,title_id' }
    );

    if (upsertError) throw upsertError;
}

export async function updateLibraryEntry(userId: string, dbId: string | number, item: LibraryItem): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const dbStatus = toDbStatus(item.status);
    const { error: updateError } = await supabase!
        .from('library_entries')
        .update({
            status: dbStatus,
            score: toDbScore(item.score),
            progress_chapters: item.progress ?? 0,
            started_at: item.startedAt ?? null,
            completed_at: dbStatus === 'COMPLETED' ? (item.completedAt || new Date().toISOString()) : null,
            updated_at: new Date().toISOString(),
            is_favorite: item.isFavourite,
            reader_url: item.readerUrl
        })
        .eq('id', dbId)
        .eq('user_id', userId);

    if (updateError) throw updateError;
}

export async function updateLibraryEntriesBatch(userId: string, ids: (string | number)[], patch: Partial<LibraryItem>): Promise<void> {
    if (!isSupabaseConfigured() || ids.length === 0) return;

    const updates: Record<string, string | number | boolean | null> = {
        updated_at: new Date().toISOString()
    };

    if (patch.status) {
        const dbStatus = toDbStatus(patch.status);
        updates.status = dbStatus;
        // If status is being updated, we MUST also update completed_at to satisfy the DB constraint
        if (dbStatus === 'COMPLETED') {
            updates.completed_at = patch.completedAt || new Date().toISOString();
        } else {
            updates.completed_at = null;
        }
    }
    if (patch.score !== undefined) updates.score = toDbScore(patch.score);
    if (patch.isFavourite !== undefined) updates.is_favorite = patch.isFavourite;

    const { error } = await supabase!
        .from('library_entries')
        .update(updates)
        .in('id', ids)
        .eq('user_id', userId);

    if (error) throw error;
}

export async function removeLibraryEntry(userId: string, dbId: string | number): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { error: deleteError } = await supabase!
        .from('library_entries')
        .delete()
        .eq('id', dbId)
        .eq('user_id', userId);

    if (deleteError) throw deleteError;
}
