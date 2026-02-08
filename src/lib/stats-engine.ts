import { STATUS_LABELS, STATUS_ORDER } from "@/lib/constants";
import type { DisplayMedia, MediaStatus, MediaType, ScoreFormat, OriginType } from "@/types/display";

/**
 * YURA STATS ENGINE
 *
 * All statistics are calculated from the current Yura database,
 * NOT from GDPR numbers. This ensures accuracy and real-time updates.
 *
 * Every number is reproducible and traceable back to source items.
 * 
 * PHASE 4: TRACEABILITY SYSTEM
 * Every metric returns { value, items } for full traceability.
 */

/**
 * Contribution mapping: every metric must be traceable to source items
 */
export interface MetricWithItems<T = number> {
    value: T;
    items: DisplayMedia[];
    formula?: string; // Human-readable formula explanation
}

export interface MediaStatsPanelData {
    count: MetricWithItems;
    episodesWatched: MetricWithItems;
    chaptersRead: MetricWithItems;
    volumesRead: MetricWithItems;
    daysWatched: MetricWithItems;
    meanScore: MetricWithItems;
    standardDeviation: MetricWithItems;
    completedCount: MetricWithItems;
    currentCount: MetricWithItems;
    planningCount: MetricWithItems;
    pausedCount: MetricWithItems;
    droppedCount: MetricWithItems;
    repeatingCount: MetricWithItems;
}

export interface StatusDistributionItem {
    status: MediaStatus;
    label: string;
    count: number;
    percentage: number;
    items: DisplayMedia[];
}

export interface ScoreDistributionItem {
    label: string;
    range: string;
    count: number;
    percentage: number;
    items: DisplayMedia[];
}

export interface GlobalStatsData {
    anime: MediaStatsPanelData;
    manga: MediaStatsPanelData;
    combined: {
        totalCount: MetricWithItems;
        totalEpisodesWatched: MetricWithItems;
        totalChaptersRead: MetricWithItems;
        totalVolumesRead: MetricWithItems;
        totalDaysWatched: MetricWithItems;
        globalMeanScore: MetricWithItems;
    };
}

/**
 * Calculate all stats for a media list
 * PHASE 4: Returns contribution mappings for full traceability
 */
export function calculateMediaStats(items: DisplayMedia[]): MediaStatsPanelData {
    const scored = items.filter(i => i.score > 0);
    const completed = items.filter(i => i.status === "COMPLETED");
    const current = items.filter(i => i.status === "CURRENT");
    const planning = items.filter(i => i.status === "PLANNING");
    const paused = items.filter(i => i.status === "PAUSED");
    const dropped = items.filter(i => i.status === "DROPPED");
    const repeating = items.filter(i => i.status === "REPEATING");

    // Calculate totals with items
    const episodesWatchedItems = items.filter(i => i.progress > 0);
    const episodesWatched = items.reduce((sum, item) => sum + item.progress, 0);
    
    const chaptersReadItems = items.filter(i => i.progress > 0);
    const chaptersRead = items.reduce((sum, item) => sum + item.progress, 0);
    
    const volumesReadItems = items.filter(i => i.progressVolumes > 0);
    const volumesRead = items.reduce((sum, item) => sum + item.progressVolumes, 0);

    // Days watched (estimate: 24 min per episode average)
    const minutesWatched = episodesWatched * 24;
    const daysWatched = Math.round((minutesWatched / (24 * 60)) * 10) / 10;

    // Mean score
    const totalScore = scored.reduce((sum, item) => sum + item.score, 0);
    const meanScore = scored.length > 0 ? totalScore / scored.length : 0;

    // Standard deviation
    let sumSquaredDifferences = 0;
    for (const item of scored) {
        sumSquaredDifferences += Math.pow(item.score - meanScore, 2);
    }
    const standardDeviation = scored.length > 1 ? Math.sqrt(sumSquaredDifferences / (scored.length - 1)) : 0;

    return {
        count: {
            value: items.length,
            items: items,
            formula: "Total items in list"
        },
        episodesWatched: {
            value: episodesWatched,
            items: episodesWatchedItems,
            formula: "Sum of all progress values"
        },
        chaptersRead: {
            value: chaptersRead,
            items: chaptersReadItems,
            formula: "Sum of all progress values"
        },
        volumesRead: {
            value: volumesRead,
            items: volumesReadItems,
            formula: "Sum of all progressVolumes values"
        },
        daysWatched: {
            value: daysWatched,
            items: episodesWatchedItems,
            formula: "episodesWatched × 24 minutes / 1440 minutes per day"
        },
        meanScore: {
            value: Math.round(meanScore * 100) / 100,
            items: scored,
            formula: "Sum(scores) / count(rated items)"
        },
        standardDeviation: {
            value: Math.round(standardDeviation * 100) / 100,
            items: scored,
            formula: "√(Σ((score - mean)²) / (n-1))"
        },
        completedCount: {
            value: completed.length,
            items: completed,
            formula: "Items with status = COMPLETED"
        },
        currentCount: {
            value: current.length,
            items: current,
            formula: "Items with status = CURRENT"
        },
        planningCount: {
            value: planning.length,
            items: planning,
            formula: "Items with status = PLANNING"
        },
        pausedCount: {
            value: paused.length,
            items: paused,
            formula: "Items with status = PAUSED"
        },
        droppedCount: {
            value: dropped.length,
            items: dropped,
            formula: "Items with status = DROPPED"
        },
        repeatingCount: {
            value: repeating.length,
            items: repeating,
            formula: "Items with status = REPEATING"
        },
    };
}

/**
 * Calculate status distribution
 * PHASE 4: Includes items array for each status
 */
export function calculateStatusDistribution(items: DisplayMedia[], mediaType: MediaType): StatusDistributionItem[] {
    const byStatus: Record<MediaStatus, DisplayMedia[]> = {
        CURRENT: [],
        PLANNING: [],
        COMPLETED: [],
        DROPPED: [],
        PAUSED: [],
        REPEATING: [],
    };

    for (const item of items) {
        byStatus[item.status].push(item);
    }

    const total = items.length;

    return STATUS_ORDER.map(status => ({
        status,
        label: STATUS_LABELS[status][mediaType],
        count: byStatus[status].length,
        percentage: total > 0 ? (byStatus[status].length / total) * 100 : 0,
        items: byStatus[status],
    })).filter(item => item.count > 0);
}

/**
 * Calculate score distribution with proper binning
 */
export function calculateScoreDistribution(items: DisplayMedia[], scoreFormat: ScoreFormat): ScoreDistributionItem[] {
    const scored = items.filter(i => i.score > 0);
    const total = scored.length;

    if (scoreFormat === "POINT_100") {
        const buckets: ScoreDistributionItem[] = Array.from({ length: 10 }, (_, i) => ({
            label: `${(i + 1) * 10}`,
            range: `${i * 10 + 1}-${(i + 1) * 10}`,
            count: 0,
            percentage: 0,
            items: [],
        }));

        for (const item of scored) {
            const idx = Math.min(Math.floor((item.score - 1) / 10), 9);
            buckets[idx].count++;
            buckets[idx].items.push(item);
        }

        return buckets
            .map(b => ({ ...b, percentage: total > 0 ? (b.count / total) * 100 : 0 }))
            .filter(b => b.count > 0);
    }

    if (scoreFormat === "POINT_10" || scoreFormat === "POINT_10_DECIMAL") {
        const buckets: ScoreDistributionItem[] = Array.from({ length: 10 }, (_, i) => ({
            label: String(i + 1),
            range: `${i + 1}/10`,
            count: 0,
            percentage: 0,
            items: [],
        }));

        for (const item of scored) {
            const val = Math.min(Math.round(item.score / 10), 10);
            const idx = Math.max(val - 1, 0);
            buckets[idx].count++;
            buckets[idx].items.push(item);
        }

        return buckets
            .map(b => ({ ...b, percentage: total > 0 ? (b.count / total) * 100 : 0 }))
            .filter(b => b.count > 0);
    }

    if (scoreFormat === "POINT_5") {
        const buckets: ScoreDistributionItem[] = Array.from({ length: 5 }, (_, i) => ({
            label: "★".repeat(i + 1),
            range: `${i + 1} star${i > 0 ? "s" : ""}`,
            count: 0,
            percentage: 0,
            items: [],
        }));

        for (const item of scored) {
            const stars = Math.min(Math.round(item.score / 20), 5);
            const idx = Math.max(stars - 1, 0);
            buckets[idx].count++;
            buckets[idx].items.push(item);
        }

        return buckets
            .map(b => ({ ...b, percentage: total > 0 ? (b.count / total) * 100 : 0 }))
            .filter(b => b.count > 0);
    }

    if (scoreFormat === "POINT_3") {
        const buckets: ScoreDistributionItem[] = [
            { label: "😐", range: "Neutral", count: 0, percentage: 0, items: [] },
            { label: "😊", range: "Good", count: 0, percentage: 0, items: [] },
            { label: "🤩", range: "Great", count: 0, percentage: 0, items: [] },
        ];

        for (const item of scored) {
            const idx = Math.min(Math.round(item.score / 33.33) - 1, 2);
            buckets[idx].count++;
            buckets[idx].items.push(item);
        }

        return buckets
            .map(b => ({ ...b, percentage: total > 0 ? (b.count / total) * 100 : 0 }))
            .filter(b => b.count > 0);
    }

    return [];
}

/**
 * Calculate combined global statistics
 * PHASE 4: Returns contribution mappings
 */
export function calculateGlobalStats(animeList: DisplayMedia[], mangaList: DisplayMedia[]): GlobalStatsData {
    const anime = calculateMediaStats(animeList);
    const manga = calculateMediaStats(mangaList);

    // For combined mean score, weight by count
    const allScored = [...animeList, ...mangaList].filter(i => i.score > 0);
    const globalMeanScore =
        allScored.length > 0
            ? Math.round((allScored.reduce((sum, i) => sum + i.score, 0) / allScored.length) * 100) / 100
            : 0;

    const allItems = [...animeList, ...mangaList];

    return {
        anime,
        manga,
        combined: {
            totalCount: {
                value: anime.count.value + manga.count.value,
                items: allItems,
                formula: "anime.count + manga.count"
            },
            totalEpisodesWatched: {
                value: anime.episodesWatched.value,
                items: anime.episodesWatched.items,
                formula: "Sum of anime progress"
            },
            totalChaptersRead: {
                value: manga.chaptersRead.value,
                items: manga.chaptersRead.items,
                formula: "Sum of manga progress"
            },
            totalVolumesRead: {
                value: manga.volumesRead.value,
                items: manga.volumesRead.items,
                formula: "Sum of manga progressVolumes"
            },
            totalDaysWatched: {
                value: anime.daysWatched.value,
                items: anime.daysWatched.items,
                formula: "Anime days watched"
            },
            globalMeanScore: {
                value: globalMeanScore,
                items: allScored,
                formula: "Sum(all scores) / count(all rated items)"
            },
        },
    };
}

/**
 * Get items from score distribution that match a specific score bucket
 */
export function getItemsInScoreBucket(
    items: DisplayMedia[],
    scoreFormat: ScoreFormat,
    bucketLabel: string,
): DisplayMedia[] {
    const distribution = calculateScoreDistribution(items, scoreFormat);
    const bucket = distribution.find(b => b.label === bucketLabel);
    return bucket?.items || [];
}

/**
 * Format distribution analysis
 */
export interface FormatDistributionItem {
    format: string;
    count: number;
    percentage: number;
    items: DisplayMedia[];
}

export function calculateFormatDistribution(items: DisplayMedia[]): FormatDistributionItem[] {
    const formats = new Map<string, DisplayMedia[]>();

    for (const item of items) {
        const format = item.format || "Unknown";
        if (!formats.has(format)) {
            formats.set(format, []);
        }
        formats.get(format)!.push(item);
    }

    const total = items.length;

    return Array.from(formats.entries())
        .map(([format, formatItems]) => ({
            format,
            count: formatItems.length,
            percentage: total > 0 ? (formatItems.length / total) * 100 : 0,
            items: formatItems,
        }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Origin type distribution (TASK 1: Manga/Manhua/Manhwa classification)
 */
export interface OriginTypeDistributionItem {
    originType: OriginType;
    count: number;
    percentage: number;
    items: DisplayMedia[];
}

export function calculateOriginTypeDistribution(items: DisplayMedia[]): OriginTypeDistributionItem[] {
    const originTypes = new Map<OriginType, DisplayMedia[]>();

    for (const item of items) {
        // Only calculate for manga entries
        if (item.mediaType === "MANGA" && item.originType) {
            if (!originTypes.has(item.originType)) {
                originTypes.set(item.originType, []);
            }
            originTypes.get(item.originType)!.push(item);
        }
    }

    const mangaItems = items.filter(i => i.mediaType === "MANGA");
    const total = mangaItems.length;

    return Array.from(originTypes.entries())
        .map(([originType, originItems]) => ({
            originType,
            count: originItems.length,
            percentage: total > 0 ? (originItems.length / total) * 100 : 0,
            items: originItems,
        }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Genre distribution analysis
 */
export interface GenreDistributionItem {
    genre: string;
    count: number;
    percentage: number;
    totalTime: number; // episodes/chapters
    averageScore: number;
    items: DisplayMedia[];
}

export function calculateGenreDistribution(items: DisplayMedia[]): GenreDistributionItem[] {
    const genres = new Map<string, DisplayMedia[]>();

    for (const item of items) {
        if (item.genres && item.genres.length > 0) {
            for (const genre of item.genres) {
                if (!genres.has(genre)) {
                    genres.set(genre, []);
                }
                genres.get(genre)!.push(item);
            }
        }
    }

    const total = items.length;

    return Array.from(genres.entries())
        .map(([genre, genreItems]) => {
            const scored = genreItems.filter(i => i.score > 0);
            const avgScore = scored.length > 0 ? genreItems.reduce((s, i) => s + i.score, 0) / genreItems.length : 0;
            const totalTime = genreItems.reduce((s, i) => s + i.progress, 0);

            return {
                genre,
                count: genreItems.length,
                percentage: total > 0 ? (genreItems.length / total) * 100 : 0,
                totalTime,
                averageScore: Math.round(avgScore * 100) / 100,
                items: genreItems,
            };
        })
        .sort((a, b) => b.count - a.count);
}

/**
 * Tag analysis
 */
export interface TagAnalysisItem {
    tag: string;
    count: number;
    percentage: number;
    averageScore: number;
    items: DisplayMedia[];
}

export interface TagAnalysisData {
    mostFrequent: TagAnalysisItem[];
    highestRated: TagAnalysisItem[];
    lowestRated: TagAnalysisItem[];
}

export function calculateTagAnalysis(items: DisplayMedia[]): TagAnalysisData {
    // For now, we'll use genres as tags since DisplayMedia doesn't have a tags field
    // This can be extended if tags are added to the data model
    const genres = calculateGenreDistribution(items);

    // Convert genres to tag analysis format
    const tagItems: TagAnalysisItem[] = genres.map(g => ({
        tag: g.genre,
        count: g.count,
        percentage: g.percentage,
        averageScore: g.averageScore,
        items: g.items,
    }));

    const total = items.length;

    return {
        mostFrequent: tagItems.sort((a, b) => b.count - a.count).slice(0, 10),
        highestRated: tagItems
            .filter(t => t.averageScore > 0)
            .sort((a, b) => b.averageScore - a.averageScore)
            .slice(0, 10),
        lowestRated: tagItems
            .filter(t => t.averageScore > 0)
            .sort((a, b) => a.averageScore - b.averageScore)
            .slice(0, 10),
    };
}

/**
 * PANEL G: Year/Season Distribution
 */
export interface SeasonDistributionItem {
    year: number;
    season: string;
    label: string;
    count: number;
    percentage: number;
    items: DisplayMedia[];
}

export function calculateSeasonDistribution(items: DisplayMedia[]): SeasonDistributionItem[] {
    const seasons = new Map<string, DisplayMedia[]>();
    const total = items.length;

    for (const item of items) {
        if (item.seasonYear && item.season) {
            const key = `${item.seasonYear}-${item.season}`;
            if (!seasons.has(key)) {
                seasons.set(key, []);
            }
            seasons.get(key)!.push(item);
        }
    }

    return Array.from(seasons.entries())
        .map(([key, items]) => {
            const [year, season] = key.split("-");
            return {
                year: parseInt(year),
                season,
                label: `${season} ${year}`,
                count: items.length,
                percentage: total > 0 ? (items.length / total) * 100 : 0,
                items,
            };
        })
        .sort((a, b) => b.year - a.year || (a.season > b.season ? -1 : 1));
}

/**
 * PANEL H: Studio & Staff Analysis
 */
export interface StudioAnalysisItem {
    studio: string;
    count: number;
    percentage: number;
    averageScore: number;
    items: DisplayMedia[];
}

export function calculateStudioAnalysis(items: DisplayMedia[]): StudioAnalysisItem[] {
    // Note: This requires studio data in DisplayMedia
    // For now, returns empty as studios are not in current schema
    // Can be extended when studio data is added
    return [];
}

/**
 * PANEL I: Activity Timeline
 */
export interface ActivityTimelineItem {
    period: string;
    count: number;
    items: DisplayMedia[];
}

export interface ActivityTimeline {
    byDay: ActivityTimelineItem[];
    byMonth: ActivityTimelineItem[];
    byYear: ActivityTimelineItem[];
}

function getDateKey(dateStr: string | null, format: "day" | "month" | "year"): string | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;

    if (format === "day") {
        return date.toISOString().split("T")[0];
    } else if (format === "month") {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        return `${year}-${month}`;
    } else {
        return date.getFullYear().toString();
    }
}

export function calculateActivityTimeline(items: DisplayMedia[]): ActivityTimeline {
    const byDay = new Map<string, DisplayMedia[]>();
    const byMonth = new Map<string, DisplayMedia[]>();
    const byYear = new Map<string, DisplayMedia[]>();

    for (const item of items) {
        const dateStr = item.completedAt || item.updatedAt;
        if (!dateStr) continue;

        const dayKey = getDateKey(dateStr, "day");
        if (dayKey) {
            if (!byDay.has(dayKey)) byDay.set(dayKey, []);
            byDay.get(dayKey)!.push(item);
        }

        const monthKey = getDateKey(dateStr, "month");
        if (monthKey) {
            if (!byMonth.has(monthKey)) byMonth.set(monthKey, []);
            byMonth.get(monthKey)!.push(item);
        }

        const yearKey = getDateKey(dateStr, "year");
        if (yearKey) {
            if (!byYear.has(yearKey)) byYear.set(yearKey, []);
            byYear.get(yearKey)!.push(item);
        }
    }

    const toItems = (map: Map<string, DisplayMedia[]>) =>
        Array.from(map.entries())
            .map(([period, items]) => ({ period, count: items.length, items }))
            .sort((a, b) => b.period.localeCompare(a.period));

    return {
        byDay: toItems(byDay),
        byMonth: toItems(byMonth),
        byYear: toItems(byYear),
    };
}

/**
 * PANEL J: Rewatch/Reread Analysis
 */
export interface RewatchAnalysisItem {
    title: string;
    repeats: number;
    items: DisplayMedia[];
}

export interface RewatchAnalysisData {
    totalRepeats: number;
    itemsWithRepeats: number;
    mostRepeated: RewatchAnalysisItem[];
}

export function calculateRewatchAnalysis(items: DisplayMedia[]): RewatchAnalysisData {
    const rewatches = new Map<string, { repeats: number; item: DisplayMedia }>();
    let totalRepeats = 0;

    for (const item of items) {
        if (item.repeat > 0) {
            const key = item.title.romaji || item.title.english || "Unknown";
            totalRepeats += item.repeat;

            if (!rewatches.has(key)) {
                rewatches.set(key, { repeats: item.repeat, item });
            } else {
                rewatches.get(key)!.repeats += item.repeat;
            }
        }
    }

    const mostRepeated: RewatchAnalysisItem[] = Array.from(rewatches.entries())
        .map(([title, data]) => ({
            title,
            repeats: data.repeats,
            items: [data.item],
        }))
        .sort((a, b) => b.repeats - a.repeats)
        .slice(0, 10);

    return {
        totalRepeats,
        itemsWithRepeats: rewatches.size,
        mostRepeated,
    };
}

/**
 * PANEL K: Priority Distribution
 */
export interface PriorityDistributionItem {
    priority: number;
    count: number;
    percentage: number;
    label: string;
    items: DisplayMedia[];
}

export function calculatePriorityDistribution(items: DisplayMedia[]): PriorityDistributionItem[] {
    const priorities = new Map<number, DisplayMedia[]>();

    for (const item of items) {
        const priority = item.priority;
        if (!priorities.has(priority)) {
            priorities.set(priority, []);
        }
        priorities.get(priority)!.push(item);
    }

    const total = items.length;
    const labels: Record<number, string> = {
        0: "None",
        1: "Low",
        2: "Medium",
        3: "High",
    };

    return Array.from(priorities.entries())
        .map(([priority, items]) => ({
            priority,
            count: items.length,
            percentage: total > 0 ? (items.length / total) * 100 : 0,
            label: labels[priority] || `Priority ${priority}`,
            items,
        }))
        .sort((a, b) => b.priority - a.priority);
}

/**
 * PANEL L: Custom List Usage
 */
export interface CustomListItem {
    listName: string;
    count: number;
    percentage: number;
    items: DisplayMedia[];
}

export function calculateCustomListUsage(items: DisplayMedia[]): CustomListItem[] {
    const lists = new Map<string, DisplayMedia[]>();

    for (const item of items) {
        if (item.customLists && item.customLists.length > 0) {
            for (const listName of item.customLists) {
                if (!lists.has(listName)) {
                    lists.set(listName, []);
                }
                lists.get(listName)!.push(item);
            }
        }
    }

    const total = items.length;

    return Array.from(lists.entries())
        .map(([listName, items]) => ({
            listName,
            count: items.length,
            percentage: total > 0 ? (items.length / total) * 100 : 0,
            items,
        }))
        .sort((a, b) => b.count - a.count);
}

/**
 * PANEL M: Favourites Breakdown
 * GDPR Field: favourites array
 */
export interface FavouritesBreakdownData {
    anime: MetricWithItems;
    manga: MetricWithItems;
    characters: MetricWithItems;
    staff: MetricWithItems;
    studios: MetricWithItems;
    total: MetricWithItems;
}

export function calculateFavouritesBreakdown(
    user: { favourites?: { anime: number[]; manga: number[]; characters: number[]; staff: number[]; studios: number[] } },
    animeList: DisplayMedia[],
    mangaList: DisplayMedia[]
): FavouritesBreakdownData {
    const favs = user.favourites || { anime: [], manga: [], characters: [], staff: [], studios: [] };
    
    // Find media items that match favourite IDs
    const favouriteAnime = animeList.filter(item => favs.anime.includes(item._seriesId));
    const favouriteManga = mangaList.filter(item => favs.manga.includes(item._seriesId));
    
    const totalFavourites = favs.anime.length + favs.manga.length + favs.characters.length + favs.staff.length + favs.studios.length;

    return {
        anime: {
            value: favs.anime.length,
            items: favouriteAnime,
            formula: "Count of favourite anime IDs"
        },
        manga: {
            value: favs.manga.length,
            items: favouriteManga,
            formula: "Count of favourite manga IDs"
        },
        characters: {
            value: favs.characters.length,
            items: [], // Characters not in media list
            formula: "Count of favourite character IDs"
        },
        staff: {
            value: favs.staff.length,
            items: [], // Staff not in media list
            formula: "Count of favourite staff IDs"
        },
        studios: {
            value: favs.studios.length,
            items: [], // Studios not in media list
            formula: "Count of favourite studio IDs"
        },
        total: {
            value: totalFavourites,
            items: [...favouriteAnime, ...favouriteManga],
            formula: "Sum of all favourite counts"
        },
    };
}

/**
 * PANEL N: Completion Rate
 */
export interface CompletionRateData {
    completed: MetricWithItems;
    started: MetricWithItems;
    completionPercentage: number;
    notStarted: MetricWithItems;
}

export function calculateCompletionRate(items: DisplayMedia[]): CompletionRateData {
    const completedItems = items.filter(i => i.status === "COMPLETED");
    const startedItems = items.filter(i => ["CURRENT", "COMPLETED", "PAUSED", "DROPPED"].includes(i.status));
    const notStartedItems = items.filter(i => i.status === "PLANNING");

    return {
        completed: {
            value: completedItems.length,
            items: completedItems,
            formula: "Items with status = COMPLETED"
        },
        started: {
            value: startedItems.length,
            items: startedItems,
            formula: "Items with status in [CURRENT, COMPLETED, PAUSED, DROPPED]"
        },
        completionPercentage: startedItems.length > 0 ? (completedItems.length / startedItems.length) * 100 : 0,
        notStarted: {
            value: notStartedItems.length,
            items: notStartedItems,
            formula: "Items with status = PLANNING"
        },
    };
}

/**
 * PANEL O: Length Analysis
 */
export interface LengthAnalysisData {
    longestSeries: { title: string; length: number; items: DisplayMedia[] }[];
    averageLength: MetricWithItems;
    totalLength: MetricWithItems;
}

export function calculateLengthAnalysis(items: DisplayMedia[]): LengthAnalysisData {
    const lengths = items
        .map(item => ({
            title: item.title.romaji || item.title.english || "Unknown",
            length: item.episodes || item.chapters || 0,
            item,
        }))
        .filter(i => i.length > 0)
        .sort((a, b) => b.length - a.length);

    const totalLength = lengths.reduce((sum, i) => sum + i.length, 0);
    const averageLength = lengths.length > 0 ? totalLength / lengths.length : 0;
    const itemsWithLength = lengths.map(l => l.item);

    return {
        longestSeries: lengths.slice(0, 10).map(i => ({ 
            title: i.title, 
            length: i.length,
            items: [i.item]
        })),
        averageLength: {
            value: Math.round(averageLength * 100) / 100,
            items: itemsWithLength,
            formula: "Sum(all lengths) / count(items with length > 0)"
        },
        totalLength: {
            value: totalLength,
            items: itemsWithLength,
            formula: "Sum of all episodes/chapters"
        },
    };
}

/**
 * PANEL P: Time Investment Analysis
 */
export interface TimeInvestmentBreakdown {
    format: string;
    totalTime: number;
    percentage: number;
    count: number;
    items: DisplayMedia[];
}

export function calculateTimeInvestment(items: DisplayMedia[]): TimeInvestmentBreakdown[] {
    const byFormat = new Map<string, { time: number; count: number; items: DisplayMedia[] }>();

    for (const item of items) {
        const format = item.format || "Unknown";
        const time = item.episodes || item.chapters || 0;

        if (!byFormat.has(format)) {
            byFormat.set(format, { time: 0, count: 0, items: [] });
        }

        const data = byFormat.get(format)!;
        data.time += time;
        data.count += 1;
        data.items.push(item);
    }

    const totalTime = Array.from(byFormat.values()).reduce((sum, d) => sum + d.time, 0);

    return Array.from(byFormat.entries())
        .map(([format, data]) => ({
            format,
            totalTime: data.time,
            percentage: totalTime > 0 ? (data.time / totalTime) * 100 : 0,
            count: data.count,
            items: data.items,
        }))
        .sort((a, b) => b.totalTime - a.totalTime);
}

/**
 * PANEL Q: Hidden/Private Visibility Statistics
 */
export interface VisibilityStatsData {
    public: MetricWithItems;
    private: MetricWithItems;
    publicPercentage: number;
    privatePercentage: number;
}

export function calculateVisibilityStats(items: DisplayMedia[]): VisibilityStatsData {
    const privateItems = items.filter(i => i.isPrivate);
    const publicItems = items.filter(i => !i.isPrivate);
    const total = items.length;

    return {
        public: {
            value: publicItems.length,
            items: publicItems,
            formula: "Items where isPrivate = false"
        },
        private: {
            value: privateItems.length,
            items: privateItems,
            formula: "Items where isPrivate = true"
        },
        publicPercentage: total > 0 ? (publicItems.length / total) * 100 : 0,
        privatePercentage: total > 0 ? (privateItems.length / total) * 100 : 0,
    };
}

/**
 * PANEL R: Notes Analysis
 * GDPR Field: entry.notes
 */
export interface NotesAnalysisData {
    itemsWithNotes: MetricWithItems;
    itemsWithoutNotes: MetricWithItems;
    averageNoteLength: MetricWithItems<number>;
    longestNotes: Array<{ title: string; noteLength: number; items: DisplayMedia[] }>;
}

export function calculateNotesAnalysis(items: DisplayMedia[]): NotesAnalysisData {
    const itemsWithNotes = items.filter(i => i.notes && i.notes.trim().length > 0);
    const itemsWithoutNotes = items.filter(i => !i.notes || i.notes.trim().length === 0);
    
    const totalNoteLength = itemsWithNotes.reduce((sum, item) => sum + (item.notes?.length || 0), 0);
    const averageNoteLength = itemsWithNotes.length > 0 ? totalNoteLength / itemsWithNotes.length : 0;

    const longestNotes = itemsWithNotes
        .map(item => ({
            title: item.title.romaji || item.title.english || "Unknown",
            noteLength: item.notes?.length || 0,
            items: [item],
        }))
        .sort((a, b) => b.noteLength - a.noteLength)
        .slice(0, 10);

    return {
        itemsWithNotes: {
            value: itemsWithNotes.length,
            items: itemsWithNotes,
            formula: "Items with non-empty notes"
        },
        itemsWithoutNotes: {
            value: itemsWithoutNotes.length,
            items: itemsWithoutNotes,
            formula: "Items without notes or with empty notes"
        },
        averageNoteLength: {
            value: Math.round(averageNoteLength),
            items: itemsWithNotes,
            formula: "Sum(note lengths) / count(items with notes)"
        },
        longestNotes,
    };
}

/**
 * PANEL S: Advanced Scores Analysis
 * GDPR Field: entry.advanced_scores
 */
export interface AdvancedScoresData {
    itemsWithAdvancedScores: MetricWithItems;
    averageAdvancedScores: Record<string, MetricWithItems>;
    scoreBreakdown: Array<{
        scoreName: string;
        average: number;
        items: DisplayMedia[];
    }>;
}

export function calculateAdvancedScoresAnalysis(items: DisplayMedia[]): AdvancedScoresData {
    const itemsWithAdvancedScores = items.filter(i => i.advancedScores && i.advancedScores.length > 0);
    
    // Group by score index (assuming standard order: Overall, Story, Animation, etc.)
    const scoreIndexMap = new Map<number, DisplayMedia[]>();
    const scoreAverages: Record<string, { sum: number; count: number; items: DisplayMedia[] }> = {};
    
    for (const item of itemsWithAdvancedScores) {
        if (item.advancedScores && item.advancedScores.length > 0) {
            for (let i = 0; i < item.advancedScores.length; i++) {
                const scoreName = `Score ${i + 1}`;
                if (!scoreAverages[scoreName]) {
                    scoreAverages[scoreName] = { sum: 0, count: 0, items: [] };
                }
                scoreAverages[scoreName].sum += item.advancedScores[i];
                scoreAverages[scoreName].count++;
                scoreAverages[scoreName].items.push(item);
            }
        }
    }

    const averageAdvancedScores: Record<string, MetricWithItems> = {};
    for (const [scoreName, data] of Object.entries(scoreAverages)) {
        averageAdvancedScores[scoreName] = {
            value: Math.round((data.sum / data.count) * 100) / 100,
            items: data.items,
            formula: `Average ${scoreName} across all items`
        };
    }

    const scoreBreakdown = Object.entries(scoreAverages).map(([scoreName, data]) => ({
        scoreName,
        average: Math.round((data.sum / data.count) * 100) / 100,
        items: data.items,
    }));

    return {
        itemsWithAdvancedScores: {
            value: itemsWithAdvancedScores.length,
            items: itemsWithAdvancedScores,
            formula: "Items with advanced scores configured"
        },
        averageAdvancedScores,
        scoreBreakdown,
    };
}

/**
 * PANEL T: Hidden Items Analysis
 * GDPR Field: entry.hidden_default
 */
export interface HiddenItemsData {
    hidden: MetricWithItems;
    visible: MetricWithItems;
    hiddenPercentage: number;
    visiblePercentage: number;
}

export function calculateHiddenItemsAnalysis(items: DisplayMedia[]): HiddenItemsData {
    const hiddenItems = items.filter(i => i.hiddenDefault);
    const visibleItems = items.filter(i => !i.hiddenDefault);
    const total = items.length;

    return {
        hidden: {
            value: hiddenItems.length,
            items: hiddenItems,
            formula: "Items where hiddenDefault = true"
        },
        visible: {
            value: visibleItems.length,
            items: visibleItems,
            formula: "Items where hiddenDefault = false"
        },
        hiddenPercentage: total > 0 ? (hiddenItems.length / total) * 100 : 0,
        visiblePercentage: total > 0 ? (visibleItems.length / total) * 100 : 0,
    };
}
