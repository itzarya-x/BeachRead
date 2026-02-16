import { STATUS_LABELS, STATUS_ORDER } from "@/lib/constants";
import type { ActivityLog } from "@/lib/storage/types";
import type { DisplayMedia, MediaStatus, MediaType, OriginType, ScoreFormat } from "@/types/display";
import { safeArray } from "@/utils/safeArray";

/**
 * YURA STATS ENGINE
 */

export interface MetricWithItems<T = number> {
    value: T;
    items: DisplayMedia[];
    formula?: string;
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

export interface ActivityHeatmapData {
    date: string;
    count: number;
    actions: ActivityLog[];
}

export interface BingeSession {
    seriesId: number;
    title: string;
    startTime: string;
    endTime: string;
    episodes: number;
    durationMinutes: number;
}

export interface BingeAnalytics {
    sessions: BingeSession[];
    longestSession: BingeSession | null;
    averageSessionLength: number;
    totalBingeTime: number;
}

export interface HabitsAnalytics {
    hourly: Record<number, number>;
    weekday: Record<number, number>;
    monthly: Record<number, number>;
}

export interface BehavioralStatsData {
    heatmap: ActivityHeatmapData[];
    binge: BingeAnalytics;
    habits: HabitsAnalytics;
}

export interface Archetype {
    name: string;
    label: string;
    description: string;
    value: number;
    items: DisplayMedia[];
}

export interface Milestone {
    id: string;
    title: string;
    description: string;
    achieved: boolean;
    date?: string;
    progress?: number;
    target?: number;
}

export interface Outlier {
    type: "positive" | "negative" | "weird";
    title: string;
    description: string;
    item: DisplayMedia;
}

export interface EvolutionPoint {
    period: string;
    meanScore: number;
    count: number;
}

export interface IntelligenceData {
    archetypes: Archetype[];
    milestones: Milestone[];
    outliers: Outlier[];
    evolution: EvolutionPoint[];
    loyalty: {
        studios: Array<{ name: string, count: number, items: DisplayMedia[] }>;
        authors: Array<{ name: string, count: number, items: DisplayMedia[] }>;
    };
    timeline: Array<{ era: string, count: number, items: DisplayMedia[] }>;
    metrics: {
        harshness: number;
        diversity: number;
        bingeFactor: number;
        completionVelocity: number;
        nightWatcherFactor: number;
        dropSpeed: number;
        avgCompletionTime: number;
        watchingPlanningRatio: number;
        volatility: number;
    };
    tasteDna: {
        vibe: Record<string, number>;
        weighted: Array<{ genre: string, score: number }>;
        diversity: number;
    };
}

export function calculateMediaStats(items: DisplayMedia[]): MediaStatsPanelData {
    const scored = items.filter(i => i.score > 0);
    const completed = items.filter(i => i.status === "COMPLETED");
    const current = items.filter(i => i.status === "CURRENT");
    const planning = items.filter(i => i.status === "PLANNING");
    const paused = items.filter(i => i.status === "PAUSED");
    const dropped = items.filter(i => i.status === "DROPPED");
    const repeating = items.filter(i => i.status === "REPEATING");

    const episodesWatched = items.reduce((sum, item) => sum + (item.mediaType === "ANIME" ? item.progress : 0), 0);
    const chaptersRead = items.reduce((sum, item) => sum + (item.mediaType === "MANGA" ? item.progress : 0), 0);
    const volumesRead = items.reduce((sum, item) => sum + (item.mediaType === "MANGA" ? item.progressVolumes : 0), 0);

    const minutesWatched = episodesWatched * 24;
    const daysWatched = Math.round((minutesWatched / 1440) * 10) / 10;

    const totalScore = scored.reduce((sum, item) => sum + item.score, 0);
    const meanScore = scored.length > 0 ? totalScore / scored.length : 0;

    let sumSquaredDifferences = 0;
    for (const item of scored) {
        sumSquaredDifferences += Math.pow(item.score - meanScore, 2);
    }
    const standardDeviation = scored.length > 1 ? Math.sqrt(sumSquaredDifferences / (scored.length - 1)) : 0;

    return {
        count: { value: items.length, items },
        episodesWatched: { value: episodesWatched, items: items.filter(i => i.mediaType === "ANIME" && i.progress > 0) },
        chaptersRead: { value: chaptersRead, items: items.filter(i => i.mediaType === "MANGA" && i.progress > 0) },
        volumesRead: { value: volumesRead, items: items.filter(i => i.mediaType === "MANGA" && i.progressVolumes > 0) },
        daysWatched: { value: daysWatched, items: items.filter(i => i.mediaType === "ANIME" && i.progress > 0) },
        meanScore: { value: Math.round(meanScore * 100) / 100, items: scored },
        standardDeviation: { value: Math.round(standardDeviation * 100) / 100, items: scored },
        completedCount: { value: completed.length, items: completed },
        currentCount: { value: current.length, items: current },
        planningCount: { value: planning.length, items: planning },
        pausedCount: { value: paused.length, items: paused },
        droppedCount: { value: dropped.length, items: dropped },
        repeatingCount: { value: repeating.length, items: repeating },
    };
}

export function calculateStatusDistribution(items: DisplayMedia[], mediaType: MediaType): StatusDistributionItem[] {
    const byStatus: Record<MediaStatus, DisplayMedia[]> = {
        CURRENT: [], PLANNING: [], COMPLETED: [], DROPPED: [], PAUSED: [], REPEATING: [],
    };
    items.forEach(item => byStatus[item.status].push(item));
    const total = items.length;
    return STATUS_ORDER.map(status => ({
        status, label: STATUS_LABELS[status][mediaType],
        count: byStatus[status].length,
        percentage: total > 0 ? (byStatus[status].length / total) * 100 : 0,
        items: byStatus[status],
    })).filter(item => item.count > 0);
}

export function calculateScoreDistribution(items: DisplayMedia[], scoreFormat: ScoreFormat): ScoreDistributionItem[] {
    const scored = items.filter(i => i.score > 0);
    const total = scored.length;
    const buckets: ScoreDistributionItem[] = Array.from({ length: 10 }, (_, i) => ({
        label: `${(i + 1) * 10}`,
        range: `${i * 10 + 1}-${(i + 1) * 10}`,
        count: 0, percentage: 0, items: [],
    }));
    scored.forEach(item => {
        const idx = Math.min(Math.floor((item.score - 1) / 10), 9);
        buckets[idx].count++;
        buckets[idx].items.push(item);
    });
    return buckets.map(b => ({ ...b, percentage: total > 0 ? (b.count / total) * 100 : 0 })).filter(b => b.count > 0);
}

export function calculateGenreDistribution(items: DisplayMedia[]): GenreDistributionItem[] {
    const genres = new Map<string, DisplayMedia[]>();
    items.forEach(item => {
        safeArray(item.genres).forEach(genre => {
            if (!genres.has(genre)) genres.set(genre, []);
            genres.get(genre)!.push(item);
        });
    });
    const total = items.length;
    return Array.from(genres.entries()).map(([genre, genreItems]) => {
        const scored = genreItems.filter(i => i.score > 0);
        const avgScore = scored.length > 0 ? scored.reduce((s, i) => s + i.score, 0) / scored.length : 0;
        return {
            genre, count: genreItems.length,
            percentage: total > 0 ? (genreItems.length / total) * 100 : 0,
            totalTime: genreItems.reduce((s, i) => s + i.progress, 0),
            averageScore: Math.round(avgScore * 100) / 100,
            items: genreItems,
        };
    }).sort((a, b) => b.count - a.count);
}

export interface GenreDistributionItem {
    genre: string;
    count: number;
    percentage: number;
    totalTime: number;
    averageScore: number;
    items: DisplayMedia[];
}

export function calculateOriginTypeDistribution(items: DisplayMedia[]): OriginTypeDistributionItem[] {
    const originTypes = new Map<OriginType, DisplayMedia[]>();
    const mangaItems = items.filter(i => i.mediaType === "MANGA");
    mangaItems.forEach(item => {
        if (item.originType) {
            if (!originTypes.has(item.originType)) originTypes.set(item.originType, []);
            originTypes.get(item.originType)!.push(item);
        }
    });
    const total = mangaItems.length;
    return Array.from(originTypes.entries()).map(([originType, originItems]) => ({
        originType, count: originItems.length,
        percentage: total > 0 ? (originItems.length / total) * 100 : 0,
        items: originItems,
    })).sort((a, b) => b.count - a.count);
}

export interface OriginTypeDistributionItem {
    originType: OriginType;
    count: number;
    percentage: number;
    items: DisplayMedia[];
}

export function calculateFormatDistribution(items: DisplayMedia[]): FormatDistributionItem[] {
    const formats = new Map<string, DisplayMedia[]>();
    items.forEach(item => {
        const format = item.format || "Unknown";
        if (!formats.has(format)) formats.set(format, []);
        formats.get(format)!.push(item);
    });
    const total = items.length;
    return Array.from(formats.entries()).map(([format, formatItems]) => ({
        format, count: formatItems.length,
        percentage: total > 0 ? (formatItems.length / total) * 100 : 0,
        items: formatItems,
    })).sort((a, b) => b.count - a.count);
}

export interface FormatDistributionItem {
    format: string;
    count: number;
    percentage: number;
    items: DisplayMedia[];
}

export function calculateBehavioralStats(activities: ActivityLog[], mediaItems: DisplayMedia[]): BehavioralStatsData {
    const heatmapMap = new Map<string, ActivityHeatmapData>();
    activities.forEach(act => {
        const date = act.createdAt.split("T")[0];
        if (!heatmapMap.has(date)) heatmapMap.set(date, { date, count: 0, actions: [] });
        const data = heatmapMap.get(date)!;
        data.count++;
        data.actions.push(act);
    });
    const heatmap = Array.from(heatmapMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    const hourly: Record<number, number> = {};
    const weekday: Record<number, number> = {};
    const monthly: Record<number, number> = {};
    activities.forEach(act => {
        const d = new Date(act.createdAt);
        const h = d.getHours(); const w = d.getDay(); const m = d.getMonth();
        hourly[h] = (hourly[h] || 0) + 1;
        weekday[w] = (weekday[w] || 0) + 1;
        monthly[m] = (monthly[m] || 0) + 1;
    });

    const bingeSessions: BingeSession[] = [];
    const mediaTitleMap = new Map(mediaItems.map(m => [m._seriesId, m.title?.romaji || "Unknown"]));
    const progressActivities = activities.filter(a => a.actionType === "progress").sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const seriesGroups = new Map<number, ActivityLog[]>();
    progressActivities.forEach(a => { if (a.seriesId) { if (!seriesGroups.has(a.seriesId)) seriesGroups.set(a.seriesId, []); seriesGroups.get(a.seriesId)!.push(a); } });

    seriesGroups.forEach((group, seriesId) => {
        let current: ActivityLog[] = [];
        group.forEach(act => {
            if (current.length === 0) { current.push(act); return; }
            const last = current[current.length - 1];
            const diff = new Date(act.createdAt).getTime() - new Date(last.createdAt).getTime();
            if (diff < 2 * 60 * 60 * 1000) { current.push(act); } else {
                if (current.length >= 3) bingeSessions.push(createBingeSession(current, seriesId, mediaTitleMap));
                current = [act];
            }
        });
        if (current.length >= 3) bingeSessions.push(createBingeSession(current, seriesId, mediaTitleMap));
    });

    return {
        heatmap, habits: { hourly, weekday, monthly },
        binge: {
            sessions: bingeSessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
            longestSession: bingeSessions.length > 0 ? [...bingeSessions].sort((a, b) => b.durationMinutes - a.durationMinutes)[0] : null,
            averageSessionLength: bingeSessions.length > 0 ? bingeSessions.reduce((s, b) => s + b.durationMinutes, 0) / bingeSessions.length : 0,
            totalBingeTime: bingeSessions.reduce((s, b) => s + b.durationMinutes, 0)
        }
    };
}

function createBingeSession(acts: ActivityLog[], seriesId: number, titleMap: Map<number, string>): BingeSession {
    const start = new Date(acts[0].createdAt);
    const end = new Date(acts[acts.length - 1].createdAt);
    let episodes = 0;
    acts.forEach(a => { episodes += a.details?.from !== undefined && a.details?.to !== undefined ? Math.max(0, a.details.to - a.details.from) : 1; });
    return { seriesId, title: titleMap.get(seriesId) || "Unknown", startTime: start.toISOString(), endTime: end.toISOString(), episodes, durationMinutes: Math.max(1, (end.getTime() - start.getTime()) / 60000) };
}

export function calculateIntelligence(items: DisplayMedia[], activities: ActivityLog[]): IntelligenceData {
    const scored = items.filter(i => i.score > 0);
    const completed = items.filter(i => i.status === "COMPLETED");
    const started = items.filter(i => ["CURRENT", "COMPLETED", "PAUSED", "DROPPED"].includes(i.status));

    const studioMap = new Map<string, DisplayMedia[]>();
    const authorMap = new Map<string, DisplayMedia[]>();
    items.forEach(item => {
        safeArray(item.tags).forEach(tag => {
            const lower = tag.toLowerCase();
            if (lower.includes("studio")) {
                const name = tag.replace(/studio:?\s*/i, "").trim();
                if (!studioMap.has(name)) studioMap.set(name, []);
                studioMap.get(name)!.push(item);
            }
            if (lower.includes("author") || lower.includes("mangaka")) {
                const name = tag.replace(/(author|mangaka):?\s*/i, "").trim();
                if (!authorMap.has(name)) authorMap.set(name, []);
                authorMap.get(name)!.push(item);
            }
        });
    });

    const eraMap = new Map<string, DisplayMedia[]>();
    items.forEach(item => {
        if (!item.seasonYear) return;
        const era = `${Math.floor(item.seasonYear / 10) * 10}s`;
        if (!eraMap.has(era)) eraMap.set(era, []);
        eraMap.get(era)!.push(item);
    });

    const finished = items.filter(i => i.completedAt && i.startedAt);
    const finishDurations = finished.map(i => ({ 
        days: (new Date(i.completedAt!).getTime() - new Date(i.startedAt!).getTime()) / 86400000,
        item: i 
    })).filter(d => d.days >= 0);

    const nightWatcherFactor = (activities.filter(a => { const h = new Date(a.createdAt).getHours(); return h >= 22 || h <= 4; }).length / (activities.length || 1)) * 100;
    const genreDist = calculateGenreDistribution(items);
    const avgScore = scored.length > 0 ? scored.reduce((s, i) => s + i.score, 0) / scored.length : 70;

    const evolutionMap = new Map<string, { scores: number[], count: number }>();
    items.forEach(item => {
        const d = item.completedAt || item.updatedAt;
        if (!d) return;
        const p = d.slice(0, 7);
        if (!evolutionMap.has(p)) evolutionMap.set(p, { scores: [], count: 0 });
        const data = evolutionMap.get(p)!;
        data.count++; if (item.score > 0) data.scores.push(item.score);
    });

    const stats = calculateMediaStats(items);

    return {
        archetypes: [
            calculateArchetype("The Completionist", "Focused on finishing every series started.", items, (list) => started.length > 0 ? (completed.length / started.length) * 100 : 0, i => i.status === "COMPLETED"),
            calculateArchetype("The Archivist", "Possesses a massive library of entries.", items, (list) => Math.min(100, (list.length / 500) * 100), i => true),
            calculateArchetype("The Speedrunner", "Finishes series at a record pace.", items, (list) => finishDurations.length > 0 ? Math.max(0, 100 - (finishDurations.reduce((a, b) => a + b.days, 0) / finishDurations.length * 5)) : 0, i => !!(i.completedAt && i.startedAt)),
            calculateArchetype("The Harsh Critic", "Maintains an incredibly high standard for ratings.", items, (list) => Math.max(0, (70 - avgScore) * 2), i => i.score > 0 && i.score < 60),
            calculateArchetype("The Romantic", "Heavily invested in romance and emotional storytelling.", items, (list) => Math.min(100, (list.filter(i => i.genres?.includes("Romance")).length / Math.max(1, list.length)) * 300), i => i.genres?.includes("Romance")),
        ].sort((a, b) => b.value - a.value),
        milestones: [
            { id: "centurion", title: "100 Completed", description: "Finish 100 series.", achieved: completed.length >= 100, progress: completed.length, target: 100 },
            { id: "millennium", title: "1000 Hours", description: "Invest 1000 hours.", achieved: (items.reduce((s, i) => s + i.progress, 0) * 24 / 60) >= 1000, progress: Math.floor(items.reduce((s, i) => s + i.progress, 0) * 24 / 60), target: 1000 },
        ],
        outliers: calculateOutliers(items, finishDurations.sort((a, b) => a.days - b.days)[0]),
        evolution: Array.from(evolutionMap.entries()).map(([period, data]) => ({ period, count: data.count, meanScore: data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0 })).sort((a, b) => a.period.localeCompare(b.period)).slice(-12),
        loyalty: { 
            studios: Array.from(studioMap.entries()).map(([name, items]) => ({ name, count: items.length, items })).sort((a, b) => b.count - a.count).slice(0, 10),
            authors: Array.from(authorMap.entries()).map(([name, items]) => ({ name, count: items.length, items })).sort((a, b) => a.count - a.count).slice(0, 10)
        },
        timeline: Array.from(eraMap.entries()).map(([era, items]) => ({ era, count: items.length, items })).sort((a, b) => a.era.localeCompare(b.era)),
        metrics: {
            harshness: Math.round(Math.max(0, Math.min(100, (75 - avgScore) * 4))),
            diversity: Math.min(100, (genreDist.length / 20) * 100),
            bingeFactor: Math.min(100, (calculateBehavioralStats(activities, items).binge.sessions.length / 5) * 100),
            completionVelocity: evolutionMap.size > 0 ? (completed.length / (evolutionMap.size * 30)) : 0,
            nightWatcherFactor,
            dropSpeed: items.filter(i => i.status === "DROPPED").length > 0 ? items.filter(i => i.status === "DROPPED").reduce((s, i) => s + i.progress, 0) / items.filter(i => i.status === "DROPPED").length : 0,
            avgCompletionTime: Math.round(finishDurations.length > 0 ? finishDurations.reduce((s, d) => s + d.days, 0) / finishDurations.length : 0),
            watchingPlanningRatio: items.filter(i => i.status === "PLANNING").length > 0 ? (items.filter(i => i.status === "CURRENT").length / items.filter(i => i.status === "PLANNING").length) : 0,
            volatility: stats.standardDeviation.value
        },
        tasteDna: {
            vibe: Object.fromEntries(genreDist.slice(0, 8).map(g => [g.genre, g.percentage])),
            weighted: genreDist.map(g => ({ genre: g.genre, score: g.averageScore })).filter(g => g.score > 0).sort((a, b) => b.score - a.score).slice(0, 10),
            diversity: genreDist.length
        }
    };
}

function calculateOutliers(items: DisplayMedia[], fastest?: { days: number, item: DisplayMedia }): Outlier[] {
    const scored = items.filter(i => i.score > 0).sort((a, b) => b.score - a.score);
    const outliers: Outlier[] = [];
    if (scored.length > 0) {
        outliers.push({ type: "positive", title: "Crown Jewel", description: "Highest rated entry.", item: scored[0] });
        outliers.push({ type: "negative", title: "Bottom Tier", description: "Lowest score.", item: scored[scored.length - 1] });
    }
    if (fastest && fastest.days < 2) outliers.push({ type: "positive", title: "Flash Finish", description: `Finished in ${fastest.days.toFixed(1)} days.`, item: fastest.item });
    return outliers;
}

function calculateArchetype(name: string, description: string, items: DisplayMedia[], calcFn: (list: DisplayMedia[]) => number, filterFn: (item: DisplayMedia) => boolean): Archetype {
    return { name, label: name, description, value: Math.round(calcFn(items)), items: items.filter(filterFn) };
}

/**
 * PRO STAT PAGE DATA GENERATOR
 * Returns structured JSON exactly matching the layout requirements.
 */
export function computeProStatsPayload(items: DisplayMedia[], scoreFormat: ScoreFormat) {
    const anime = items.filter(i => i.mediaType === "ANIME");
    const manga = items.filter(i => i.mediaType === "MANGA");
    const scored = items.filter(i => i.score > 0);
    const completed = items.filter(i => i.status === "COMPLETED");
    const dropped = items.filter(i => i.status === "DROPPED");
    
    // Investment Time
    const animeMinutes = anime.reduce((sum, item) => sum + (item.progress * (item.duration || 24)), 0);
    const mangaMinutes = manga.reduce((sum, item) => sum + (item.progress * 5) + (item.progressVolumes * 30), 0);
    const totalMinutes = animeMinutes + mangaMinutes;
    const totalDays = Math.round((totalMinutes / 1440) * 100) / 100;

    // Scores
    const meanAnime = anime.filter(i => i.score > 0).reduce((s, i) => s + i.score, 0) / (anime.filter(i => i.score > 0).length || 1);
    const meanManga = manga.filter(i => i.score > 0).reduce((s, i) => s + i.score, 0) / (manga.filter(i => i.score > 0).length || 1);
    const meanOverall = scored.reduce((s, i) => s + i.score, 0) / (scored.length || 1);

    // Distribution
    const dist: Record<string, number> = {};
    for (let i = 0; i < 10; i++) {
        const range = `${i * 10 + 1}-${(i + 1) * 10}`;
        dist[range] = items.filter(item => item.score > (i * 10) && item.score <= ((i + 1) * 10)).length;
    }

    // Standard Deviation
    let sumSq = 0;
    scored.forEach(i => sumSq += Math.pow(i.score - meanOverall, 2));
    const stdDev = scored.length > 1 ? Math.sqrt(sumSq / (scored.length - 1)) : 0;

    // Profile Type
    const completionRate = (completed.length / (items.length || 1)) * 100;
    const dropRate = (dropped.length / (items.length || 1)) * 100;
    
    let profileType: "completionist" | "critic" | "explorer" | "casual" | "strategist" = "strategist";
    if (completionRate > 70) profileType = "completionist";
    else if (dropRate > 30) profileType = "critic";
    else if (items.length < 20) profileType = "casual";

    return {
        hero_summary: {
            total_anime: anime.length,
            total_manga: manga.length,
            total_entries: items.length,
            total_minutes_watched: totalMinutes,
            total_days_invested: totalDays,
            mean_score_anime: Math.round(meanAnime * 100) / 100,
            mean_score_manga: Math.round(meanManga * 100) / 100,
            overall_mean_score: Math.round(meanOverall * 100) / 100,
            completion_rate_percent: Math.round(completionRate * 100) / 100,
            drop_rate_percent: Math.round(dropRate * 100) / 100
        },
        vault_integrity: {
            archive_scale: items.length,
            completed: completed.length,
            current: items.filter(i => i.status === "CURRENT").length,
            planning: items.filter(i => i.status === "PLANNING").length,
            dropped: dropped.length,
            paused: items.filter(i => i.status === "PAUSED").length,
            rewatched_count: items.filter(i => i.repeat > 0).length,
            repeat_average: Math.round((items.reduce((s, i) => s + i.repeat, 0) / (items.length || 1)) * 100) / 100
        },
        score_intelligence: {
            mean: Math.round(meanOverall * 100) / 100,
            standard_deviation: Math.round(stdDev * 100) / 100,
            most_common_score: 0,
            score_distribution: dist,
            harsh_vs_generous_index: Math.round((meanOverall - 70) * 100) / 100,
            rating_consistency_level: stdDev < 8 ? "high" : stdDev < 15 ? "medium" : "low"
        },
        time_analytics: {
            episodes_watched: anime.reduce((s, i) => s + i.progress, 0),
            chapters_read: manga.reduce((s, i) => s + i.progress, 0),
            volumes_read: manga.reduce((s, i) => s + i.progressVolumes, 0),
            average_time_to_complete_days: 0,
            average_episodes_before_drop: dropped.length > 0 ? (dropped.reduce((s, i) => s + i.progress, 0) / dropped.length) : 0
        },
        behavioral_profile: {
            completionist_score: Math.round(completionRate),
            drop_tendency_score: Math.round(dropRate),
            rating_strictness_score: Math.round(Math.max(0, 100 - meanOverall)),
            binge_watcher_score: 0,
            consistency_score: Math.round(Math.max(0, 100 - (stdDev * 4))),
            profile_type: profileType
        },
        genre_distribution: calculateGenreDistribution(items).map(g => ({
            genre: g.genre,
            count: g.count,
            percent: Math.round(g.percentage * 100) / 100
        })),
        format_distribution: calculateFormatDistribution(items).map(f => ({
            format: f.format,
            count: f.count
        })),
        year_distribution: Array.from(new Set(items.map(i => i.seasonYear).filter(Boolean))).map(y => ({
            year: y as number,
            count: items.filter(i => i.seasonYear === y).length
        })).sort((a, b) => b.year - a.year),
        advanced_metrics: {
            watching_vs_planning_ratio: items.filter(i => i.status === "PLANNING").length > 0 ? (items.filter(i => i.status === "CURRENT").length / items.filter(i => i.status === "PLANNING").length) : 0,
            average_score_of_completed: completed.length > 0 ? (completed.reduce((s, i) => s + i.score, 0) / completed.length) : 0,
            average_score_of_dropped: dropped.length > 0 ? (dropped.reduce((s, i) => s + i.score, 0) / dropped.length) : 0,
            score_bias_vs_platform_estimate: Math.round((meanOverall - 70) * 100) / 100,
            rating_volatility_index: Math.round(stdDev * 100) / 100
        }
    };
}
