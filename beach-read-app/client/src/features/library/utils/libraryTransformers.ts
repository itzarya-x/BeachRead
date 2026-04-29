import type { LibraryItem, MediaType } from '../../../shared/types/types';

type NormalizableLibraryItem = Partial<LibraryItem> & { id: string; type?: MediaType };
type TitleProviderMapping = {
    provider?: string | null;
    provider_title_id?: string | null;
};

type TitleData = {
    id?: string | number;
    external_id?: string | null;
    title_romaji?: string | null;
    title_english?: string | null;
    cover_url?: string | null;
    cover_image_url?: string | null;
    total_chapters?: number | null;
    total_episodes?: number | null;
    total_volumes?: number | null;
    chapter_count?: number | null;
    volume_count?: number | null;
    format?: string | null;
    genres?: string[] | null;
    media_type?: MediaType | null;
    mappings?: TitleProviderMapping[] | null;
};

type LibraryRow = {
    id?: string;
    titles?: TitleData;
    title?: TitleData | string;
    media_type?: string | null;
    progress?: number | null;
    progress_chapters?: number | null;
    series_id?: number;
    anilist_media_id?: number;
    score?: number | string | null;
    is_favourite?: boolean | null;
    is_favorite?: boolean | null;
    status?: string;
    reader_url?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
    updated_at?: string | null;
};

export const FALLBACK_COVER_URL = '/cover-fallback.svg';

export function asNonEmptyString(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

export function normalizeTitle(value: unknown, fallbackId: string | number): string {
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

export function deriveStatus(status: string | undefined, progress?: number | null, total?: number | null): LibraryItem['status'] {
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

export function normalizeLibraryItem(item: NormalizableLibraryItem): LibraryItem {
    const mediaType = (item.mediaType || item.type || 'MANGA') as MediaType;
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
        countryOfOrigin: item.countryOfOrigin ?? null,
        format: item.format || undefined,
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

export function extractCoverUrl(raw: Record<string, unknown>): string {
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

export function needsHydration(item: LibraryItem): boolean {
    const likelyMissingTitle = !item.title || item.title.startsWith('Series ');
    const likelyMissingCover = !item.coverUrl || item.coverUrl === FALLBACK_COVER_URL;
    return likelyMissingTitle || likelyMissingCover;
}

export function normalizeStatusValue(status?: string | null): string {
    return typeof status === 'string' ? status.trim().toUpperCase() : '';
}

export function coerceStatus(status?: string): LibraryItem['status'] {
    const normalized = normalizeStatusValue(status);
    if (normalized === 'CURRENT' || normalized === 'READING') return 'READING';
    if (normalized === 'COMPLETED') return 'COMPLETED';
    if (normalized === 'DROPPED') return 'DROPPED';
    if (normalized === 'PAUSED' || normalized === 'ON_HOLD') return 'PAUSED';
    return 'PLANNING';
}

export function toDbStatus(status?: string): string {
    const normalized = normalizeStatusValue(status);
    if (normalized === 'READING' || normalized === 'CURRENT') return 'READING';
    if (normalized === 'COMPLETED') return 'COMPLETED';
    if (normalized === 'DROPPED') return 'DROPPED';
    if (normalized === 'PAUSED' || normalized === 'ON_HOLD') return 'PAUSED';
    return 'PLANNING';
}

export function toDbScore(score?: number | string | null): number {
    const numeric = typeof score === 'number'
        ? score
        : typeof score === 'string'
            ? Number(score)
            : 0;

    if (!Number.isFinite(numeric) || numeric <= 0) return 0;

    const normalized = numeric > 10 ? numeric / 10 : numeric;
    const clamped = Math.max(0, Math.min(normalized, 10));
    return Math.round(clamped * 10) / 10;
}

export function parseSeriesId(id: string): number {
    const numeric = Number(id);
    if (Number.isInteger(numeric) && numeric > 0) return numeric;
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
        hash = (hash * 31 + id.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) || Date.now();
}

export function getFallbackRowStatus(row: Record<string, unknown>): string | undefined {
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

export function mapRowToLibraryItem(row: LibraryRow): LibraryItem {
    const title = row.titles || (typeof row.title === 'object' && row.title !== null ? (row.title as TitleData) : {});
    const mappings = (Array.isArray(title.mappings) ? title.mappings : []) as TitleProviderMapping[];
    const anilistMapping = mappings.find((mapping) => mapping?.provider === 'ANILIST');
    const providerTitleId = typeof anilistMapping?.provider_title_id === 'string' ? anilistMapping.provider_title_id : null;
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
    const totalUnits = mediaType === 'ANIME' ? episodes : chapters;
    const resolvedId = providerTitleId || title.external_id || row.series_id || row.anilist_media_id || row.id;
    const resolvedSeriesId = providerTitleId
        ? parseInt(providerTitleId, 10)
        : title.external_id
            ? parseInt(title.external_id, 10)
            : (row.series_id || row.anilist_media_id);

    return {
        id: String(resolvedId),
        dbId: row.id,
        seriesId: Number.isFinite(resolvedSeriesId) ? (resolvedSeriesId as number) : undefined,
        title: title.title_romaji || title.title_english || (typeof row.title === 'string' ? row.title : null) || 'Unknown Series',
        status: deriveStatus(row.status, progress, totalUnits),
        progress,
        progressVolumes: 0,
        repeat: 0,
        score: Number(row.score) || 0,
        coverUrl: title.cover_url || title.cover_image_url || FALLBACK_COVER_URL,
        genres: Array.isArray(title.genres) ? title.genres : [],
        mediaType,
        chapters,
        episodes,
        volumes: typeof title.total_volumes === 'number'
            ? title.total_volumes
            : typeof title.volume_count === 'number'
                ? title.volume_count
                : null,
        countryOfOrigin: (title as any).countryOfOrigin || (title as any).country_of_origin || null,
        format: title.format || undefined,
        isFavourite: !!(row.is_favourite ?? row.is_favorite),
        readerUrl: row.reader_url,
        comments: [],
        customLists: [],
        startedAt: row.started_at || null,
        completedAt: row.completed_at || null,
        updatedAt: row.updated_at || undefined,
    };
}

export function mapLegacyRowToLibraryItem(row: Record<string, unknown>): LibraryItem {
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
