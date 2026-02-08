/**
 * PHASE 1 — GDPR STRUCTURE REFERENCE
 *
 * This file documents the complete GDPR schema that defines
 * what information is available in the Yura database.
 */

/**
 * GDPR USER SCHEMA
 */
export interface GdprUserReference {
    // Identity
    id: number;
    user_name: string;
    display_name: string;
    email: string;

    // Profile
    about: string;
    avatar_url: string | null;
    banner_url: string | null;
    profile_color: string;

    // Preferences
    title_language: number; // 0=ROMAJI, 1=ENGLISH, 2=NATIVE
    score_type: number; // 0=100, 1=10_DECIMAL, 2=10, 3=5, 4=3
    list_order: number;
    forum_homepage: number;
    adult_content: number;
    legacy_lists: number;

    // Account Status
    donator: number;
    donator_badge: string | null;
    mod_roles: number;
    ip: string;

    // Notifications
    notifications: number;
    airing_notifications: number;
    notification_options: string;

    // Privacy
    privacy: number; // 0=PUBLIC, 1=PRIVATE

    // Timestamps
    created_at: string; // ISO8601
    updated_at: string; // ISO8601

    // Statistics (Historical - NOT used for calculations)
    anime_watched: number;
    chapters_read: number;
    statistics: string; // JSON string of GdprStats

    // Lists
    custom_lists: {
        anime: string[]; // ["Favorites", "Watching Soon"]
        manga: string[]; // ["Completed", "Dropped"]
    };

    // Scoring
    advanced_scores: {
        active: boolean;
        names: string[]; // ["Overall", "Story", "Animation"]
    };

    // Hidden categories
    hidden_categories: unknown;
}

/**
 * GDPR LIST ENTRY SCHEMA
 *
 * Each entry represents one item in a user's list
 * (Anime or Manga - determined by series_type)
 */
export interface GdprListEntryReference {
    // Identifiers
    id: number;
    user_id: number;
    series_id: number;
    series_type: number; // 0=ANIME, 1=MANGA

    // Status & Progress
    status: number; // 0=WATCHING, 1=COMPLETED, 2=DROPPED, 3=PLANNING, 4=PAUSED, 5=REPEATING
    progress: number; // Episodes watched or chapters read
    progress_volume: number; // Volumes read (manga only)
    repeat: number; // Times repeated

    // Scoring
    score: number; // 0-100 scale (normalized in Yura)
    advanced_scores: string; // JSON array of scores

    // Metadata
    priority: number; // 0=LOW, 1=MEDIUM, 2=HIGH
    private: number; // 0=PUBLIC, 1=PRIVATE
    notes: string | null; // User notes

    // Lists
    custom_lists: string; // JSON: "[true, false, true]" - which custom lists this belongs to

    // Visibility
    hidden_default: number;

    // Dates
    started_on: number; // YYYYMMDD format (0 if unknown)
    finished_on: number; // YYYYMMDD format (0 if unknown)

    // Timestamps
    created_at: string; // ISO8601
    updated_at: string; // ISO8601
}

/**
 * GDPR STATISTICS SCHEMA
 *
 * Historical stats snapshots from AniList
 * Reference only - Yura calculates live stats
 */
export interface GdprStatsReference {
    status_distribution: {
        anime: Record<string, number>[] | unknown[];
        // Example: [
        //   { status: 1, count: 42 },  // COMPLETED: 42
        //   { status: 0, count: 5 },   // WATCHING: 5
        //   ...
        // ]
        manga: Record<string, number>[] | unknown[];
    };

    score_distribution: {
        anime: Record<string, number>[] | unknown[];
        // Example: [
        //   { score: 90, count: 2 },
        //   { score: 85, count: 5 },
        //   ...
        // ]
        manga: Record<string, number>[] | unknown[];
    };

    activity_history: Record<string, { count: number; color: string }>;
    // Example: {
    //   "2024-01-01": { count: 3, color: "red" },
    //   "2024-01-02": { count: 0, color: "gray" },
    //   ...
    // }

    activity_history_total: number;
}

/**
 * ============================================================
 * PHASE 2 — YURA DATA STRUCTURE
 * ============================================================
 *
 * How GDPR data is transformed and stored in Yura
 */

export interface YuraDisplayMediaReference {
    // From GDPR (immutable source)
    _seriesId: number; // Original AniList ID
    _entryId: number; // GDPR entry ID
    _enriched: boolean; // Whether API data was fetched

    // Status & Progress (user-editable in Yura)
    status: "CURRENT" | "COMPLETED" | "DROPPED" | "PLANNING" | "PAUSED" | "REPEATING";
    score: number; // 0-100 scale
    progress: number; // Episodes/chapters
    progressVolumes: number; // Volumes only
    repeat: number;
    priority: number;
    isPrivate: boolean;
    notes: string | null;
    customLists: string[];

    // Dates
    startedAt: string | null; // ISO8601 or null
    completedAt: string | null; // ISO8601 or null

    // API Data (enriched from AniList)
    title: {
        romaji: string;
        english: string | null;
        native: string | null;
    };
    coverImage: string | null; // Large image URL
    bannerImage: string | null;
    format: string | null; // "TV", "Movie", "OVA", etc.
    episodes: number | null;
    chapters: number | null;
    volumes: number | null;
    genres: string[];
    season: string | null; // "FALL"
    seasonYear: number | null; // 2024
    description: string | null;

    // Type
    mediaType: "ANIME" | "MANGA";
}

/**
 * ============================================================
 * PHASE 3 — STATS CALCULATION REFERENCE
 * ============================================================
 */

/**
 * All stats must be calculated from current Yura data,
 * not from GDPR historical snapshots.
 */

export interface YuraStatsCalculation {
    /**
     * PANEL A: GLOBAL TOTALS
     */
    globalTotals: {
        // Anime
        totalAnime: number; // Count of animeList
        animeCompleted: number; // Count with status=COMPLETED
        episodesWatched: number; // Sum of progress (anime only)
        daysWatched: number; // episodesWatched * 24 / 1440

        // Manga
        totalManga: number; // Count of mangaList
        mangaCompleted: number; // Count with status=COMPLETED
        chaptersRead: number; // Sum of progress (manga only)
        volumesRead: number; // Sum of progressVolumes

        // Combined
        totalItems: number; // totalAnime + totalManga
        globalMeanScore: number; // Average of all scored items

        // Spread
        standardDeviation: number; // Statistical spread
    };

    /**
     * PANEL B: STATUS DISTRIBUTION
     */
    statusDistribution: {
        anime: {
            CURRENT: number;
            COMPLETED: number;
            PLANNING: number;
            PAUSED: number;
            DROPPED: number;
            REPEATING: number;
        };
        manga: {
            CURRENT: number;
            COMPLETED: number;
            PLANNING: number;
            PAUSED: number;
            DROPPED: number;
            REPEATING: number;
        };
    };

    /**
     * PANEL C: SCORE HISTOGRAM
     *
     * Supports all score formats:
     * - POINT_100: [1-10, 11-20, ..., 91-100]
     * - POINT_10: [1, 2, ..., 10]
     * - POINT_5: [1★, 2★, 3★, 4★, 5★]
     * - POINT_3: [Neutral, Good, Great]
     */
    scoreHistogram: {
        anime: ScoreBucketReference[];
        manga: ScoreBucketReference[];
    };
}

export interface ScoreBucketReference {
    label: string; // "90" or "★★★★★" or "Great"
    count: number; // How many items in this bucket
    percentage: number; // Percentage of scored items
    items: YuraDisplayMediaReference[]; // All items in bucket (clickable)
}

/**
 * ============================================================
 * IMPLEMENTATION CHECKLIST
 * ============================================================
 */

/*
✅ TASK 1: Parse GDPR JSON completely
  - [x] User profile (display_name, avatar, etc.)
  - [x] List entries (status, progress, score)
  - [x] Custom lists (anime/manga categories)
  - [x] Statistics (historical, for reference only)
  - [x] Dates (created_at, finished_on, etc.)
  - [x] Advanced fields (repeat, priority, private)

✅ TASK 2: Build stats engine from Yura store
  - [x] calculateMediaStats() for anime/manga
  - [x] calculateStatusDistribution() by status
  - [x] calculateScoreDistribution() by score bucket
  - [x] calculateGlobalStats() for combined view
  - [x] Integration with DataContext
  - [x] Real-time update on data changes

✅ TASK 3: Implement AniList-grade panels
  - [x] PANEL A: Global totals with all metrics
  - [x] PANEL B: Status distribution breakdown
  - [x] PANEL C: Score histogram with items
  - [x] Stat cards for quick overview
  - [x] Charts (pie charts, bar charts)
  - [x] Status breakdown visualizations

🎯 NEXT PHASES
  - [ ] Year-over-year comparisons
  - [ ] Genre statistics
  - [ ] Studio breakdown
  - [ ] Time-series (days watched over time)
  - [ ] Export functionality (PDF, CSV)
  - [ ] Seasonal analysis
  - [ ] Personal vs community averages
*/
