export type User = {
    id: string;
    email: string;
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    bannerUrl?: string;
    bio?: string;
    location?: string;
    website?: string;
    twitterHandle?: string;
    isPrivate?: boolean;
    showStats?: boolean;
    customColors?: {
        primary: string;
        background: string;
    };
    favoriteCharacters?: Character[];
    favoriteMangaOrder?: string[];
    pinnedMangaIds?: string[];
    profileSections?: ProfileSectionsConfig;
    profilePrivacy?: ProfilePrivacyConfig;
    featuredCollections?: string[];
    snapshotCards?: SnapshotCardId[];
    nowReadingId?: string | null;
    createdAt?: string;
    hasOnboarded?: boolean;
    preferences?: UserPreferences;
}

export type SnapshotCardId =
    | 'archive_overview'
    | 'completion_ratio'
    | 'favorites_density'
    | 'top_genre'
    | 'reading_depth';

export type SectionId =
    | 'stats'
    | 'snapshot'
    | 'now_reading'
    | 'featured_collections'
    | 'favorites'
    | 'starter_pack'
    | 'changelog'
    | 'archive'
    | 'characters';

export type ProfileSectionsConfig = {
    visible: Record<SectionId, boolean>;
    order: SectionId[];
};

export type ProfilePrivacyConfig = {
    showScores: boolean;
    showProgress: boolean;
    showDroppedPaused: boolean;
    hideAdultContent: boolean;
};

export type Character = {
    id: string;
    name: string;
    image: string;
    role?: string;
}

export type UserPreferences = {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: boolean;
    titleLanguage?: 'ROMAJI' | 'ENGLISH' | 'NATIVE';
    scoreFormat?: 'POINT_100' | 'POINT_10_DECIMAL' | 'POINT_10' | 'POINT_5' | 'POINT_3';
    adultContent?: boolean;
}

export type AuthResponse = {
    user: User;
    token: string;
}

export type AuthContextUser = User;

export type MediaType = 'ANIME' | 'MANGA' | 'NOVEL';

export type MediaDetail = {
    id: string;
    type: MediaType;
    title: string;
    titleJp: string;
    description: string;
    coverUrl: string;
    bannerUrl?: string;
    genres: string[];
    chapters?: number | null;
    episodes?: number | null;
    volumes?: number | null;
    format?: string;
    isFavourite?: boolean;
    characters?: Character[];
    stats: {
        score: number;
        popularity: string;
        status: string;
    };
}

export type Note = {
    id: string;
    libraryEntryId: string;
    content: string;
    chapterMarker?: number;
    isPublic: boolean;
    emotionTags?: string[];
    quotes?: string[];
    isEndingReflection?: boolean;
    createdAt: string;
    updatedAt: string;
};

export type LibraryItem = {
    id: string; // Frontend identifier (AniList ID)
    dbId?: string; // Internal database UUID (library_entries.id)
    seriesId?: number;
    title: string;
    status: 'READING' | 'CURRENT' | 'COMPLETED' | 'PLANNING' | 'DROPPED' | 'PAUSED';
    progress: number;
    progressVolumes?: number;
    repeat?: number;
    score: number;
    coverUrl: string;
    genres: string[];
    mediaType: MediaType;
    chapters?: number | null;
    episodes?: number | null;
    volumes?: number | null;
    format?: string;
    isFavourite?: boolean;
    comments?: Array<{ id: string; text: string; createdAt: string }>;
    notes?: Note[];
    customLists?: string[];
    startedAt?: string | null;
    completedAt?: string | null;
    updatedAt?: string;
}

export type RecommendedAction = {
    id: string;
    type: 'FINISH_QUICKLY' | 'STALLED_FAVORITE' | 'SHORT_READ' | 'CATCH_UP';
    title: string;
    description: string;
    mediaId: string;
    mediaType: MediaType;
    coverUrl?: string;
    priority: number;
};

export type UserStats = {
    completed: number;
    reading: number;
    planning: number;
    dropped: number;
    paused: number;
    totalUnits: number; // generalized from totalChapters
    totalChaptersRead: number;
    totalEpisodesWatched: number;
    meanScore: number;
    genreStats: { name: string; count: number; percentage: number }[];
    scoreDistribution: { bucket: number; count: number }[];
    profileType: 'COMPLETIONIST' | 'CRITIC' | 'CASUAL' | 'STRATEGIST';
    readingVelocity: { day: string; count: number }[];
    favorites?: number;
    recommendedActions?: RecommendedAction[];
    activeConflicts?: any[];
    formatStats?: { manga: number; anime: number; novel: number; oneShot: number };
    highestRatedGenre?: { name: string; score: number };
    hoardingRatio?: number;
    lengthStats?: { marathons: number; sprints: number };
    archiveMaturity?: string;
}

export type Notification = {
    id: string;
    type: 'NEW_CHAPTER' | 'SYSTEM' | 'RECOMMENDATION' | 'SYNC_CONFLICT' | 'MILESTONE';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    mediaId?: string;
    mediaType?: MediaType;
}

export type CollectionItem = {
    id: string;
    collectionId: string;
    titleId: string;
    sortOrder: number;
    addedAt: string;
    title?: string;
    coverUrl?: string;
    externalId?: string;
};

export type Collection = {
    id: string;
    name: string;
    description?: string;
    isPrivate: boolean;
    colorTheme?: any;
    items?: CollectionItem[];
    createdAt: string;
    updatedAt: string;
};
