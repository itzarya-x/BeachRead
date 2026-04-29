import type { ProfilePrivacyConfig, ProfileSectionsConfig, SectionId, SnapshotCardId } from '../../../shared/types/types';
import type { PublicProfileRecord } from '../api/publicProfile';

export const DEFAULT_SECTION_ORDER: SectionId[] = [
    'now_reading',
    'snapshot',
    'starter_pack',
    'stats',
    'featured_collections',
    'favorites',
    'changelog',
    'archive',
    'characters',
];

export const DEFAULT_PROFILE_SECTIONS: ProfileSectionsConfig = {
    visible: {
        stats: true,
        snapshot: true,
        now_reading: true,
        featured_collections: true,
        favorites: true,
        starter_pack: true,
        changelog: true,
        archive: true,
        characters: true,
    },
    order: DEFAULT_SECTION_ORDER,
};

export const DEFAULT_PROFILE_PRIVACY: ProfilePrivacyConfig = {
    showScores: true,
    showProgress: true,
    showDroppedPaused: true,
    hideAdultContent: false,
};

export type ProfileTab = 'overview' | 'anime' | 'manga' | 'favorites' | 'stats' | 'social' | 'reviews' | 'notifications';

export function resolveSectionsConfig(profile: PublicProfileRecord): ProfileSectionsConfig {
    const incoming = profile.profile_sections;
    if (!incoming) return DEFAULT_PROFILE_SECTIONS;

    const visible = {
        ...DEFAULT_PROFILE_SECTIONS.visible,
        ...(incoming.visible || {}),
    };

    const normalizedOrder = Array.isArray(incoming.order)
        ? incoming.order.filter((item): item is SectionId => typeof item === 'string' && item in visible)
        : [];

    return {
        visible,
        order: normalizedOrder.length ? normalizedOrder : DEFAULT_SECTION_ORDER,
    };
}

export function resolvePrivacyConfig(profile: PublicProfileRecord): ProfilePrivacyConfig {
    if (!profile.profile_privacy) return DEFAULT_PROFILE_PRIVACY;
    return {
        ...DEFAULT_PROFILE_PRIVACY,
        ...profile.profile_privacy,
    };
}

export function formatStatus(status: string) {
    return status.replace(/_/g, ' ');
}

export function formatTime(value?: string) {
    if (!value) return 'Unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function buildSnapshotCards(profile: PublicProfileRecord, cardIds: SnapshotCardId[]) {
    const total = profile.total_entries || 0;
    const completed = profile.completed_entries || 0;
    const reading = profile.reading_entries || 0;
    const favorites = profile.favorites_count ?? (profile.recent_library?.filter((item) => item.isFavourite).length || 0);
    const completionRatio = total > 0 ? ((completed / total) * 100).toFixed(0) : '0';
    const favoritesDensity = total > 0 ? ((favorites / total) * 100).toFixed(0) : '0';
    const topGenre = profile.genre_stats?.[0]?.name || 'N/A';
    const readingDepth = reading > 0 ? Math.round((profile.total_chapters || 0) / reading) : 0;

    const map: Record<SnapshotCardId, { label: string; value: string }> = {
        archive_overview: { label: 'Collection Size', value: `${total}` },
        completion_ratio: { label: 'Completion Rate', value: `${completionRatio}%` },
        favorites_density: { label: 'Favorites %', value: `${favoritesDensity}%` },
        top_genre: { label: 'Top Genre', value: topGenre },
        reading_depth: { label: 'Avg Chapters', value: `${readingDepth}` },
    };

    return cardIds.map((id) => ({ id, ...map[id] }));
}
