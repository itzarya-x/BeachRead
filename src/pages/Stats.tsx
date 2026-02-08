import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { DrillDownModal } from "@/components/stats/DrillDownModal";
import { ScoreChart } from "@/components/stats/ScoreChart";
import { StatusChart } from "@/components/stats/StatusChart";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useData } from "@/context/DataContext";
import { applyStatsFilters, useStatsFilters } from "@/context/StatsFilterContext";
import {
    calculateActivityTimeline,
    calculateAdvancedScoresAnalysis,
    calculateCompletionRate,
    calculateCustomListUsage,
    calculateFavouritesBreakdown,
    calculateFormatDistribution,
    calculateGenreDistribution,
    calculateGlobalStats,
    calculateHiddenItemsAnalysis,
    calculateLengthAnalysis,
    calculateMediaStats,
    calculateNotesAnalysis,
    calculateOriginTypeDistribution,
    calculatePriorityDistribution,
    calculateRewatchAnalysis,
    calculateSeasonDistribution,
    calculateStatusDistribution,
    calculateTagAnalysis,
    calculateTimeInvestment,
    calculateVisibilityStats,
} from "@/lib/stats-engine";
import { subscribeToMutations, useMediaStore } from "@/store/mediaStore";
import type { DisplayMedia } from "@/types/display";
import {
    Activity,
    BarChart3,
    BookOpen,
    Calendar,
    CheckCircle,
    Eye,
    Flag,
    Heart,
    Layers,
    List,
    RepeatIcon,
    Sigma,
    Tag,
    Tv,
    Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const Stats = () => {
    const { loading, user } = useData();
    // TASK 6: Use Yura DB from Zustand store (reactive to mutations)
    const { animeList, mangaList, statsVersion } = useMediaStore();
    const { filters, updateFilter, resetFilters, hasActiveFilters } = useStatsFilters();
    const [detailModal, setDetailModal] = useState<{
        items: DisplayMedia[];
        title: string;
        subtitle?: string;
    } | null>(null);

    // TASK 6: Force recomputation when statsVersion changes
    const [, forceUpdate] = useState(0);
    useEffect(() => {
        const unsubscribe = subscribeToMutations(() => {
            forceUpdate(prev => prev + 1);
        });
        return unsubscribe;
    }, []);

    // Don't block on loading - show data if we have it
    if (!user) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Show loading only if we have no data at all
    if (loading && animeList.length === 0 && mangaList.length === 0) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Apply filters to lists using global filter system
    const filteredAnimeList = useMemo(
        () => applyStatsFilters(animeList, filters, user?.favourites),
        [animeList, filters, user?.favourites],
    );
    const filteredMangaList = useMemo(
        () => applyStatsFilters(mangaList, filters, user?.favourites),
        [mangaList, filters, user?.favourites],
    );

    // Determine which lists to use based on filter
    const listToUse =
        filters.mediaType === "anime"
            ? filteredAnimeList
            : filters.mediaType === "manga"
              ? filteredMangaList
              : [...filteredAnimeList, ...filteredMangaList];

    // Calculate all stats from current Yura database
    const globalStats = useMemo(
        () => calculateGlobalStats(filteredAnimeList, filteredMangaList),
        [filteredAnimeList, filteredMangaList],
    );
    const animeStats = useMemo(() => calculateMediaStats(filteredAnimeList), [filteredAnimeList]);
    const mangaStats = useMemo(() => calculateMediaStats(filteredMangaList), [filteredMangaList]);
    const animeStatusDist = useMemo(() => calculateStatusDistribution(filteredAnimeList, "ANIME"), [filteredAnimeList]);
    const mangaStatusDist = useMemo(() => calculateStatusDistribution(filteredMangaList, "MANGA"), [filteredMangaList]);
    const animeFormatDist = useMemo(() => calculateFormatDistribution(filteredAnimeList), [filteredAnimeList]);
    const mangaFormatDist = useMemo(() => calculateFormatDistribution(filteredMangaList), [filteredMangaList]);
    const mangaOriginTypeDist = useMemo(() => calculateOriginTypeDistribution(filteredMangaList), [filteredMangaList]);
    const animeGenreDist = useMemo(() => calculateGenreDistribution(filteredAnimeList), [filteredAnimeList]);
    const mangaGenreDist = useMemo(() => calculateGenreDistribution(filteredMangaList), [filteredMangaList]);
    const animeTagAnalysis = useMemo(() => calculateTagAnalysis(filteredAnimeList), [filteredAnimeList]);
    const mangaTagAnalysis = useMemo(() => calculateTagAnalysis(filteredMangaList), [filteredMangaList]);
    const animeSeasonDist = useMemo(() => calculateSeasonDistribution(filteredAnimeList), [filteredAnimeList]);
    const mangaSeasonDist = useMemo(() => calculateSeasonDistribution(filteredMangaList), [filteredMangaList]);
    const animeActivityTimeline = useMemo(() => calculateActivityTimeline(filteredAnimeList), [filteredAnimeList]);
    const mangaActivityTimeline = useMemo(() => calculateActivityTimeline(filteredMangaList), [filteredMangaList]);
    const animeRewatchAnalysis = useMemo(() => calculateRewatchAnalysis(filteredAnimeList), [filteredAnimeList]);
    const mangaRewatchAnalysis = useMemo(() => calculateRewatchAnalysis(filteredMangaList), [filteredMangaList]);
    const animePriorityDist = useMemo(() => calculatePriorityDistribution(filteredAnimeList), [filteredAnimeList]);
    const mangaPriorityDist = useMemo(() => calculatePriorityDistribution(filteredMangaList), [filteredMangaList]);
    const animeCustomLists = useMemo(() => calculateCustomListUsage(filteredAnimeList), [filteredAnimeList]);
    const mangaCustomLists = useMemo(() => calculateCustomListUsage(filteredMangaList), [filteredMangaList]);
    const animeCompletionRate = useMemo(() => calculateCompletionRate(filteredAnimeList), [filteredAnimeList]);
    const mangaCompletionRate = useMemo(() => calculateCompletionRate(filteredMangaList), [filteredMangaList]);
    const animeLengthAnalysis = useMemo(() => calculateLengthAnalysis(filteredAnimeList), [filteredAnimeList]);
    const mangaLengthAnalysis = useMemo(() => calculateLengthAnalysis(filteredMangaList), [filteredMangaList]);
    const animeTimeInvestment = useMemo(() => calculateTimeInvestment(filteredAnimeList), [filteredAnimeList]);
    const mangaTimeInvestment = useMemo(() => calculateTimeInvestment(filteredMangaList), [filteredMangaList]);
    const animeVisibility = useMemo(() => calculateVisibilityStats(filteredAnimeList), [filteredAnimeList]);
    const mangaVisibility = useMemo(() => calculateVisibilityStats(filteredMangaList), [filteredMangaList]);
    const animeNotesAnalysis = useMemo(() => calculateNotesAnalysis(filteredAnimeList), [filteredAnimeList]);
    const mangaNotesAnalysis = useMemo(() => calculateNotesAnalysis(filteredMangaList), [filteredMangaList]);
    const animeAdvancedScores = useMemo(() => calculateAdvancedScoresAnalysis(filteredAnimeList), [filteredAnimeList]);
    const mangaAdvancedScores = useMemo(() => calculateAdvancedScoresAnalysis(filteredMangaList), [filteredMangaList]);
    const animeHiddenItems = useMemo(() => calculateHiddenItemsAnalysis(filteredAnimeList), [filteredAnimeList]);
    const mangaHiddenItems = useMemo(() => calculateHiddenItemsAnalysis(filteredMangaList), [filteredMangaList]);
    const favouritesBreakdown = useMemo(
        () => calculateFavouritesBreakdown(user, animeList, mangaList),
        [user, animeList, mangaList],
    );

    return (
        <TooltipProvider>
            <PageWrapper>
                <PageHeader title="Statistics" subtitle="Your viewing and reading statistics" />
                <PageContent className="animate-fade-in space-y-6">
                    {/* Filter Panel */}
                    <FilterPanel
                        filters={filters}
                        onFilterChange={updateFilter}
                        onReset={resetFilters}
                        hasActiveFilters={hasActiveFilters}
                        animeList={animeList}
                        mangaList={mangaList}
                    />

                    {/* Drill Down Modal */}
                    {detailModal && (
                        <DrillDownModal
                            items={detailModal.items}
                            title={detailModal.title}
                            subtitle={detailModal.subtitle}
                            onClose={() => setDetailModal(null)}
                        />
                    )}

                    {/* Global Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                        <StatCard
                            icon={Tv}
                            label="Total Anime"
                            metric={globalStats.anime.count}
                            subtext={`${globalStats.anime.completedCount.value} completed`}
                            onClick={() =>
                                setDetailModal({
                                    items: globalStats.anime.count.items,
                                    title: "All Anime",
                                    subtitle: globalStats.anime.count.formula,
                                })
                            }
                        />
                        <StatCard
                            icon={BookOpen}
                            label="Total Manga"
                            metric={globalStats.manga.count}
                            subtext={`${globalStats.manga.completedCount.value} completed`}
                            onClick={() =>
                                setDetailModal({
                                    items: globalStats.manga.count.items,
                                    title: "All Manga",
                                    subtitle: globalStats.manga.count.formula,
                                })
                            }
                        />
                        <StatCard
                            icon={Activity}
                            label="Episodes"
                            metric={globalStats.anime.episodesWatched}
                            subtext={`${globalStats.anime.daysWatched.value.toFixed(1)} days`}
                            onClick={() =>
                                setDetailModal({
                                    items: globalStats.anime.episodesWatched.items,
                                    title: "Anime Episodes Watched",
                                    subtitle: globalStats.anime.episodesWatched.formula,
                                })
                            }
                        />
                        <StatCard
                            icon={BookOpen}
                            label="Chapters"
                            metric={globalStats.manga.chaptersRead}
                            subtext={`${globalStats.manga.volumesRead.value} volumes`}
                            onClick={() =>
                                setDetailModal({
                                    items: globalStats.manga.chaptersRead.items,
                                    title: "Manga Chapters Read",
                                    subtitle: globalStats.manga.chaptersRead.formula,
                                })
                            }
                        />
                        <StatCard
                            icon={Sigma}
                            label="Global Mean"
                            metric={globalStats.combined.globalMeanScore}
                            subtext="Score average"
                            onClick={() =>
                                setDetailModal({
                                    items: globalStats.combined.globalMeanScore.items,
                                    title: "Global Mean Score",
                                    subtitle: globalStats.combined.globalMeanScore.formula,
                                })
                            }
                        />
                    </div>

                    {/* Detailed Panels */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Anime Panel */}
                        <div className="bg-card rounded-lg p-6 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                                <Tv className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold text-foreground">Anime Statistics</h3>
                            </div>
                            <div className="space-y-3">
                                <StatRow
                                    label="Total Count"
                                    metric={animeStats.count}
                                    onClick={() =>
                                        setDetailModal({
                                            items: animeStats.count.items,
                                            title: "Anime - Total Count",
                                            subtitle: animeStats.count.formula,
                                        })
                                    }
                                />
                                <StatRow
                                    label="Episodes Watched"
                                    metric={animeStats.episodesWatched}
                                    onClick={() =>
                                        setDetailModal({
                                            items: animeStats.episodesWatched.items,
                                            title: "Anime - Episodes Watched",
                                            subtitle: animeStats.episodesWatched.formula,
                                        })
                                    }
                                />
                                <StatRow
                                    label="Days Watched"
                                    metric={animeStats.daysWatched}
                                    onClick={() =>
                                        setDetailModal({
                                            items: animeStats.daysWatched.items,
                                            title: "Anime - Days Watched",
                                            subtitle: animeStats.daysWatched.formula,
                                        })
                                    }
                                />
                                <StatRow
                                    label="Mean Score"
                                    metric={animeStats.meanScore}
                                    onClick={() =>
                                        setDetailModal({
                                            items: animeStats.meanScore.items,
                                            title: "Anime - Mean Score",
                                            subtitle: animeStats.meanScore.formula,
                                        })
                                    }
                                />
                                <StatRow
                                    label="Std Deviation"
                                    metric={animeStats.standardDeviation}
                                    onClick={() =>
                                        setDetailModal({
                                            items: animeStats.standardDeviation.items,
                                            title: "Anime - Standard Deviation",
                                            subtitle: animeStats.standardDeviation.formula,
                                        })
                                    }
                                />
                                <hr className="my-2 border-border/30" />
                                <StatRow
                                    label="Completed"
                                    metric={animeStats.completedCount}
                                    secondary
                                    onClick={() =>
                                        setDetailModal({
                                            items: animeStats.completedCount.items,
                                            title: "Anime - Completed",
                                            subtitle: animeStats.completedCount.formula,
                                        })
                                    }
                                />
                                <StatRow
                                    label="Currently Watching"
                                    metric={animeStats.currentCount}
                                    secondary
                                    onClick={() =>
                                        setDetailModal({
                                            items: animeStats.currentCount.items,
                                            title: "Anime - Currently Watching",
                                            subtitle: animeStats.currentCount.formula,
                                        })
                                    }
                                />
                                <StatRow
                                    label="Planning"
                                    metric={animeStats.planningCount}
                                    secondary
                                    onClick={() =>
                                        setDetailModal({
                                            items: animeStats.planningCount.items,
                                            title: "Anime - Planning",
                                            subtitle: animeStats.planningCount.formula,
                                        })
                                    }
                                />
                                <StatRow
                                    label="Paused"
                                    metric={animeStats.pausedCount}
                                    secondary
                                    onClick={() =>
                                        setDetailModal({
                                            items: animeStats.pausedCount.items,
                                            title: "Anime - Paused",
                                            subtitle: animeStats.pausedCount.formula,
                                        })
                                    }
                                />
                                <StatRow
                                    label="Dropped"
                                    metric={animeStats.droppedCount}
                                    secondary
                                    onClick={() =>
                                        setDetailModal({
                                            items: animeStats.droppedCount.items,
                                            title: "Anime - Dropped",
                                            subtitle: animeStats.droppedCount.formula,
                                        })
                                    }
                                />
                                <StatRow
                                    label="Repeating"
                                    metric={animeStats.repeatingCount}
                                    secondary
                                    onClick={() =>
                                        setDetailModal({
                                            items: animeStats.repeatingCount.items,
                                            title: "Anime - Repeating",
                                            subtitle: animeStats.repeatingCount.formula,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        {/* Manga Panel */}
                        <div className="bg-card rounded-lg p-6 border border-border/50">
                            <div className="flex items-center gap-2 mb-4">
                                <BookOpen className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold text-foreground">Manga Statistics</h3>
                            </div>
                            <div className="space-y-3">
                                <StatRow
                                    label="Total Count"
                                    metric={mangaStats.count}
                                    onClick={() =>
                                        setDetailModal({
                                            items: mangaStats.count.items,
                                            title: "Manga - Total Count",
                                            subtitle: mangaStats.count.formula,
                                        })
                                    }
                                />
                                <StatRow
                                    label="Chapters Read"
                                    metric={mangaStats.chaptersRead}
                                    onClick={() =>
                                        setDetailModal({
                                            items: mangaStats.chaptersRead.items,
                                            title: "Manga - Chapters Read",
                                            subtitle: mangaStats.chaptersRead.formula,
                                        })
                                    }
                                />
                                <StatRow
                                    label="Volumes Read"
                                    metric={mangaStats.volumesRead}
                                    onClick={() =>
                                        setDetailModal({
                                            items: mangaStats.volumesRead.items,
                                            title: "Manga - Volumes Read",
                                            subtitle: mangaStats.volumesRead.formula,
                                        })
                                    }
                                />
                                <StatRow
                                    label="Mean Score"
                                    metric={mangaStats.meanScore}
                                    onClick={() =>
                                        setDetailModal({
                                            items: mangaStats.meanScore.items,
                                            title: "Manga - Mean Score",
                                            subtitle: mangaStats.meanScore.formula,
                                        })
                                    }
                                />
                                <StatRow
                                    label="Std Deviation"
                                    metric={mangaStats.standardDeviation}
                                    onClick={() =>
                                        setDetailModal({
                                            items: mangaStats.standardDeviation.items,
                                            title: "Manga - Standard Deviation",
                                            subtitle: mangaStats.standardDeviation.formula,
                                        })
                                    }
                                />
                                <hr className="my-2 border-border/30" />
                                <StatRow
                                    label="Completed"
                                    metric={mangaStats.completedCount}
                                    secondary
                                    onClick={() =>
                                        setDetailModal({
                                            items: mangaStats.completedCount.items,
                                            title: "Manga - Completed",
                                            subtitle: mangaStats.completedCount.formula,
                                        })
                                    }
                                />
                                <StatRow
                                    label="Currently Reading"
                                    metric={mangaStats.currentCount}
                                    secondary
                                    onClick={() =>
                                        setDetailModal({
                                            items: mangaStats.currentCount.items,
                                            title: "Manga - Currently Reading",
                                            subtitle: mangaStats.currentCount.formula,
                                        })
                                    }
                                />
                                <StatRow
                                    label="Planning"
                                    metric={mangaStats.planningCount}
                                    secondary
                                    onClick={() =>
                                        setDetailModal({
                                            items: mangaStats.planningCount.items,
                                            title: "Manga - Planning",
                                            subtitle: mangaStats.planningCount.formula,
                                        })
                                    }
                                />
                                <StatRow
                                    label="Paused"
                                    metric={mangaStats.pausedCount}
                                    secondary
                                    onClick={() =>
                                        setDetailModal({
                                            items: mangaStats.pausedCount.items,
                                            title: "Manga - Paused",
                                            subtitle: mangaStats.pausedCount.formula,
                                        })
                                    }
                                />
                                <StatRow
                                    label="Dropped"
                                    metric={mangaStats.droppedCount}
                                    secondary
                                    onClick={() =>
                                        setDetailModal({
                                            items: mangaStats.droppedCount.items,
                                            title: "Manga - Dropped",
                                            subtitle: mangaStats.droppedCount.formula,
                                        })
                                    }
                                />
                                <StatRow
                                    label="Repeating"
                                    metric={mangaStats.repeatingCount}
                                    secondary
                                    onClick={() =>
                                        setDetailModal({
                                            items: mangaStats.repeatingCount.items,
                                            title: "Manga - Repeating",
                                            subtitle: mangaStats.repeatingCount.formula,
                                        })
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ScoreChart
                            items={filteredAnimeList}
                            mediaType="ANIME"
                            scoreFormat={user.scoreFormat}
                            onBucketClick={(items, label) =>
                                setDetailModal({
                                    items,
                                    title: `Anime - Score ${label}`,
                                    subtitle: `Items with score in this range`,
                                })
                            }
                        />
                        <ScoreChart
                            items={filteredMangaList}
                            mediaType="MANGA"
                            scoreFormat={user.scoreFormat}
                            onBucketClick={(items, label) =>
                                setDetailModal({
                                    items,
                                    title: `Manga - Score ${label}`,
                                    subtitle: `Items with score in this range`,
                                })
                            }
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <StatusChart
                            items={filteredAnimeList}
                            mediaType="ANIME"
                            onStatusClick={(items, status) =>
                                setDetailModal({
                                    items,
                                    title: `Anime - ${status}`,
                                    subtitle: `Items with status: ${status}`,
                                })
                            }
                        />
                        <StatusChart
                            items={filteredMangaList}
                            mediaType="MANGA"
                            onStatusClick={(items, status) =>
                                setDetailModal({
                                    items,
                                    title: `Manga - ${status}`,
                                    subtitle: `Items with status: ${status}`,
                                })
                            }
                        />
                    </div>

                    {/* Status Distribution Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <StatusBreakdown label="Anime Status Distribution" items={animeStatusDist} />
                        <StatusBreakdown label="Manga Status Distribution" items={mangaStatusDist} />
                    </div>

                    {/* Format Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <DistributionPanel
                            title="Anime Format Distribution"
                            icon={Layers}
                            items={animeFormatDist.map(f => ({
                                label: f.format,
                                count: f.count,
                                percentage: f.percentage,
                            }))}
                        />
                        <DistributionPanel
                            title="Manga Format Distribution"
                            icon={Layers}
                            items={mangaFormatDist.map(f => ({
                                label: f.format,
                                count: f.count,
                                percentage: f.percentage,
                            }))}
                        />
                    </div>

                    {/* Origin Type Distribution (TASK 1: Manga/Manhua/Manhwa) */}
                    {mangaOriginTypeDist.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <DistributionPanel
                                title="Manga Origin Type Distribution"
                                icon={Layers}
                                items={mangaOriginTypeDist.map(o => ({
                                    label: o.originType.charAt(0).toUpperCase() + o.originType.slice(1),
                                    count: o.count,
                                    percentage: o.percentage,
                                }))}
                                onItemClick={(items, label) =>
                                    setDetailModal({
                                        items,
                                        title: `Manga - ${label}`,
                                        subtitle: `Items classified as ${label.toLowerCase()}`,
                                    })
                                }
                                itemMap={
                                    new Map(
                                        mangaOriginTypeDist.map(o => [
                                            o.originType.charAt(0).toUpperCase() + o.originType.slice(1),
                                            o.items,
                                        ]),
                                    )
                                }
                            />
                        </div>
                    )}

                    {/* Genre Distribution (Top 10) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <GenrePanel title="Top Anime Genres" items={animeGenreDist.slice(0, 10)} />
                        <GenrePanel title="Top Manga Genres" items={mangaGenreDist.slice(0, 10)} />
                    </div>

                    {/* Tag Analysis */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <TagAnalysisPanel
                            title="Most Frequent Genres"
                            icon={Tag}
                            items={animeTagAnalysis.mostFrequent.slice(0, 5)}
                            valueLabel="Count"
                            getValue={i => i.count.toString()}
                        />
                        <TagAnalysisPanel
                            title="Highest Rated Genres"
                            icon={Tag}
                            items={animeTagAnalysis.highestRated.slice(0, 5)}
                            valueLabel="Score"
                            getValue={i => i.averageScore.toFixed(1)}
                        />
                        <TagAnalysisPanel
                            title="Lowest Rated Genres"
                            icon={Tag}
                            items={animeTagAnalysis.lowestRated.slice(0, 5)}
                            valueLabel="Score"
                            getValue={i => i.averageScore.toFixed(1)}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <TagAnalysisPanel
                            title="Most Frequent Manga Genres"
                            icon={Tag}
                            items={mangaTagAnalysis.mostFrequent.slice(0, 5)}
                            valueLabel="Count"
                            getValue={i => i.count.toString()}
                        />
                        <TagAnalysisPanel
                            title="Highest Rated Manga Genres"
                            icon={Tag}
                            items={mangaTagAnalysis.highestRated.slice(0, 5)}
                            valueLabel="Score"
                            getValue={i => i.averageScore.toFixed(1)}
                        />
                        <TagAnalysisPanel
                            title="Lowest Rated Manga Genres"
                            icon={Tag}
                            items={mangaTagAnalysis.lowestRated.slice(0, 5)}
                            valueLabel="Score"
                            getValue={i => i.averageScore.toFixed(1)}
                        />
                    </div>

                    {/* PANEL G: Year/Season Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <SeasonDistributionPanel
                            title="Anime Release Seasons"
                            icon={Calendar}
                            items={animeSeasonDist.slice(0, 12)}
                        />
                        <SeasonDistributionPanel
                            title="Manga Release Seasons"
                            icon={Calendar}
                            items={mangaSeasonDist.slice(0, 12)}
                        />
                    </div>

                    {/* PANEL I: Activity Timeline - By Year */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ActivityTimelinePanel
                            title="Anime Completion Activity (Yearly)"
                            icon={Activity}
                            items={animeActivityTimeline.byYear}
                        />
                        <ActivityTimelinePanel
                            title="Manga Completion Activity (Yearly)"
                            icon={Activity}
                            items={mangaActivityTimeline.byYear}
                        />
                    </div>

                    {/* PANEL J: Rewatch/Reread Analysis */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <RewatchPanel title="Anime Rewatch Statistics" icon={RepeatIcon} data={animeRewatchAnalysis} />
                        <RewatchPanel title="Manga Reread Statistics" icon={RepeatIcon} data={mangaRewatchAnalysis} />
                    </div>

                    {/* PANEL K: Priority Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <PriorityDistributionPanel
                            title="Anime Priority Distribution"
                            icon={Flag}
                            items={animePriorityDist}
                        />
                        <PriorityDistributionPanel
                            title="Manga Priority Distribution"
                            icon={Flag}
                            items={mangaPriorityDist}
                        />
                    </div>

                    {/* PANEL L: Custom List Usage */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {animeCustomLists.length > 0 && (
                            <CustomListPanel
                                title="Anime Custom Lists"
                                icon={List}
                                items={animeCustomLists.slice(0, 10)}
                            />
                        )}
                        {mangaCustomLists.length > 0 && (
                            <CustomListPanel
                                title="Manga Custom Lists"
                                icon={List}
                                items={mangaCustomLists.slice(0, 10)}
                            />
                        )}
                    </div>

                    {/* PANEL N: Completion Rate */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <CompletionRatePanel
                            title="Anime Completion Rate"
                            icon={CheckCircle}
                            data={animeCompletionRate}
                            onMetricClick={setDetailModal}
                        />
                        <CompletionRatePanel
                            title="Manga Completion Rate"
                            icon={CheckCircle}
                            data={mangaCompletionRate}
                            onMetricClick={setDetailModal}
                        />
                    </div>

                    {/* PANEL O: Length Analysis */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <LengthAnalysisPanel
                            title="Anime Length Analysis"
                            icon={BarChart3}
                            data={animeLengthAnalysis}
                            onMetricClick={setDetailModal}
                        />
                        <LengthAnalysisPanel
                            title="Manga Length Analysis"
                            icon={BarChart3}
                            data={mangaLengthAnalysis}
                            onMetricClick={setDetailModal}
                        />
                    </div>

                    {/* PANEL P: Time Investment */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <TimeInvestmentPanel
                            title="Anime Time Investment"
                            icon={Zap}
                            items={animeTimeInvestment}
                            onItemClick={setDetailModal}
                        />
                        <TimeInvestmentPanel
                            title="Manga Time Investment"
                            icon={Zap}
                            items={mangaTimeInvestment}
                            onItemClick={setDetailModal}
                        />
                    </div>

                    {/* PANEL M: Favourites Breakdown */}
                    <div className="grid grid-cols-1 gap-6">
                        <FavouritesPanel
                            title="Favourites Breakdown"
                            icon={Heart}
                            data={favouritesBreakdown}
                            onMetricClick={setDetailModal}
                        />
                    </div>

                    {/* PANEL Q: Visibility Statistics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <VisibilityPanel
                            title="Anime Visibility"
                            icon={Eye}
                            data={animeVisibility}
                            onMetricClick={setDetailModal}
                        />
                        <VisibilityPanel
                            title="Manga Visibility"
                            icon={Eye}
                            data={mangaVisibility}
                            onMetricClick={setDetailModal}
                        />
                    </div>

                    {/* PANEL R: Notes Analysis */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <NotesAnalysisPanel
                            title="Anime Notes Analysis"
                            icon={BookOpen}
                            data={animeNotesAnalysis}
                            onMetricClick={setDetailModal}
                        />
                        <NotesAnalysisPanel
                            title="Manga Notes Analysis"
                            icon={BookOpen}
                            data={mangaNotesAnalysis}
                            onMetricClick={setDetailModal}
                        />
                    </div>

                    {/* PANEL S: Advanced Scores Analysis */}
                    {(animeAdvancedScores.itemsWithAdvancedScores.value > 0 ||
                        mangaAdvancedScores.itemsWithAdvancedScores.value > 0) && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {animeAdvancedScores.itemsWithAdvancedScores.value > 0 && (
                                <AdvancedScoresPanel
                                    title="Anime Advanced Scores"
                                    icon={BarChart3}
                                    data={animeAdvancedScores}
                                    onMetricClick={setDetailModal}
                                />
                            )}
                            {mangaAdvancedScores.itemsWithAdvancedScores.value > 0 && (
                                <AdvancedScoresPanel
                                    title="Manga Advanced Scores"
                                    icon={BarChart3}
                                    data={mangaAdvancedScores}
                                    onMetricClick={setDetailModal}
                                />
                            )}
                        </div>
                    )}

                    {/* PANEL T: Hidden Items Analysis */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <HiddenItemsPanel
                            title="Anime Hidden Items"
                            icon={Eye}
                            data={animeHiddenItems}
                            onMetricClick={setDetailModal}
                        />
                        <HiddenItemsPanel
                            title="Manga Hidden Items"
                            icon={Eye}
                            data={mangaHiddenItems}
                            onMetricClick={setDetailModal}
                        />
                    </div>
                </PageContent>
            </PageWrapper>
        </TooltipProvider>
    );
};

interface StatCardProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    metric: { value: number; items: DisplayMedia[]; formula?: string };
    subtext: string;
    onClick?: () => void;
}

function StatCard({ icon: Icon, label, metric, subtext, onClick }: StatCardProps) {
    const content = (
        <div
            className={`bg-card rounded-lg p-4 border border-border/50 transition-colors ${
                onClick ? "hover:border-primary/50 cursor-pointer" : ""
            }`}
        >
            <div className="flex items-start justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
                <Icon className="w-4 h-4 text-primary/60" />
            </div>
            <div className="text-2xl font-bold text-foreground">{metric.value.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">{subtext}</div>
        </div>
    );

    if (onClick && metric.formula) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div onClick={onClick}>{content}</div>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="text-xs">{metric.formula}</p>
                    <p className="text-xs text-muted-foreground mt-1">Click to view {metric.items.length} items</p>
                </TooltipContent>
            </Tooltip>
        );
    }

    return content;
}

interface StatRowProps {
    label: string;
    metric: { value: number; items: DisplayMedia[]; formula?: string };
    secondary?: boolean;
    onClick?: () => void;
}

function StatRow({ label, metric, secondary, onClick }: StatRowProps) {
    const displayValue =
        typeof metric.value === "number"
            ? metric.value % 1 === 0
                ? metric.value.toString()
                : metric.value.toFixed(2)
            : metric.value.toString();

    const content = (
        <div
            className={`flex justify-between items-center text-sm ${
                onClick ? "cursor-pointer hover:bg-secondary/50 -mx-2 px-2 py-1 rounded transition-colors" : ""
            }`}
            onClick={onClick}
        >
            <span className={secondary ? "text-muted-foreground text-xs" : "text-muted-foreground"}>{label}</span>
            <span className={`font-medium ${secondary ? "text-xs" : ""}`}>{displayValue}</span>
        </div>
    );

    if (onClick && metric.formula) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>{content}</TooltipTrigger>
                <TooltipContent>
                    <p className="text-xs">{metric.formula}</p>
                    <p className="text-xs text-muted-foreground mt-1">Click to view {metric.items.length} items</p>
                </TooltipContent>
            </Tooltip>
        );
    }

    return content;
}

interface StatusBreakdownItem {
    label: string;
    count: number;
    percentage: number;
}

interface StatusBreakdownProps {
    label: string;
    items: StatusBreakdownItem[];
}

function StatusBreakdown({ label, items }: StatusBreakdownProps) {
    const total = items.reduce((sum, item) => sum + item.count, 0);

    return (
        <div className="bg-card rounded-lg p-6 border border-border/50">
            <h4 className="text-sm font-semibold text-foreground mb-4">{label}</h4>
            <div className="space-y-3">
                {items.map(item => (
                    <div key={item.label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-medium">
                                {item.count} ({item.percentage.toFixed(1)}%)
                            </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-primary h-full transition-all duration-300"
                                style={{ width: `${item.percentage}%` }}
                            />
                        </div>
                    </div>
                ))}
                <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">Total: {total} items</div>
            </div>
        </div>
    );
}

interface DistributionItem {
    label: string;
    count: number;
    percentage: number;
}

interface DistributionPanelProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    items: DistributionItem[];
    onItemClick?: (items: DisplayMedia[], label: string) => void;
    itemMap?: Map<string, DisplayMedia[]>; // Map label to items for drill-down
}

function DistributionPanel({ title, icon: Icon, items, onItemClick, itemMap }: DistributionPanelProps) {
    const total = items.reduce((sum, item) => sum + item.count, 0);

    return (
        <div className="bg-card rounded-lg p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            </div>
            <div className="space-y-2.5">
                {items.map(item => {
                    const handleClick =
                        onItemClick && itemMap?.has(item.label)
                            ? () => onItemClick(itemMap.get(item.label)!, item.label)
                            : undefined;

                    return (
                        <div
                            key={item.label}
                            className="space-y-1"
                            onClick={handleClick}
                            style={handleClick ? { cursor: "pointer" } : undefined}
                        >
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground truncate">{item.label}</span>
                                <span className="font-medium whitespace-nowrap ml-2">
                                    {item.count} ({item.percentage.toFixed(1)}%)
                                </span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-primary h-full transition-all duration-300"
                                    style={{ width: `${item.percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
                <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">Total: {total} items</div>
            </div>
        </div>
    );
}

interface GenreDistributionItem {
    genre: string;
    count: number;
    percentage: number;
    totalTime: number;
    averageScore: number;
}

interface GenrePanelProps {
    title: string;
    items: GenreDistributionItem[];
}

function GenrePanel({ title, items }: GenrePanelProps) {
    return (
        <div className="bg-card rounded-lg p-6 border border-border/50">
            <h4 className="text-sm font-semibold text-foreground mb-4">{title}</h4>
            <div className="space-y-2.5">
                {items.map((item, index) => (
                    <div key={item.genre} className="text-xs">
                        <div className="flex justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground/60 w-5">{index + 1}.</span>
                                <span className="text-muted-foreground truncate">{item.genre}</span>
                            </div>
                            <div className="flex gap-3 ml-2 whitespace-nowrap text-muted-foreground">
                                <span>{item.count}</span>
                                <span>⌀{item.averageScore.toFixed(1)}</span>
                            </div>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-primary h-full transition-all duration-300"
                                style={{ width: `${Math.max(5, (item.count / items[0]?.count) * 100)}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

interface TagAnalysisItem {
    tag: string;
    count: number;
    percentage: number;
    averageScore: number;
}

interface TagAnalysisPanelProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    items: TagAnalysisItem[];
    valueLabel: string;
    getValue: (item: TagAnalysisItem) => string;
}

function TagAnalysisPanel({ title, icon: Icon, items, valueLabel, getValue }: TagAnalysisPanelProps) {
    return (
        <div className="bg-card rounded-lg p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            </div>
            <div className="space-y-2">
                {items.length > 0 ? (
                    items.map(item => (
                        <div key={item.tag} className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground truncate pr-2">{item.tag}</span>
                            <span className="font-medium whitespace-nowrap">{getValue(item)}</span>
                        </div>
                    ))
                ) : (
                    <div className="text-xs text-muted-foreground">No data available</div>
                )}
            </div>
        </div>
    );
}

// PANEL G: Season Distribution
interface SeasonDistributionItem {
    year: number;
    season: string;
    label: string;
    count: number;
    percentage: number;
}

interface SeasonDistributionPanelProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    items: SeasonDistributionItem[];
}

function SeasonDistributionPanel({ title, icon: Icon, items }: SeasonDistributionPanelProps) {
    const total = items.reduce((sum, item) => sum + item.count, 0);
    return (
        <div className="bg-card rounded-lg p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            </div>
            <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {items.map(item => (
                    <div key={`${item.year}-${item.season}`} className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-medium">
                                {item.count} ({item.percentage.toFixed(1)}%)
                            </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-primary h-full transition-all duration-300"
                                style={{ width: `${item.percentage}%` }}
                            />
                        </div>
                    </div>
                ))}
                <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">Total: {total} items</div>
            </div>
        </div>
    );
}

// PANEL I: Activity Timeline
interface ActivityTimelineItem {
    period: string;
    count: number;
}

interface ActivityTimelinePanelProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    items: ActivityTimelineItem[];
}

function ActivityTimelinePanel({ title, icon: Icon, items }: ActivityTimelinePanelProps) {
    const total = items.reduce((sum, item) => sum + item.count, 0);
    const maxCount = Math.max(...items.map(i => i.count), 1);
    return (
        <div className="bg-card rounded-lg p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            </div>
            <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {items.map(item => (
                    <div key={item.period} className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{item.period}</span>
                            <span className="font-medium">{item.count}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-primary h-full transition-all duration-300"
                                style={{ width: `${(item.count / maxCount) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
                <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
                    Total: {total} completions
                </div>
            </div>
        </div>
    );
}

// PANEL J: Rewatch Analysis
interface RewatchData {
    totalRepeats: number;
    itemsWithRepeats: number;
    mostRepeated: any[];
}

interface RewatchPanelProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    data: RewatchData;
}

function RewatchPanel({ title, icon: Icon, data }: RewatchPanelProps) {
    return (
        <div className="bg-card rounded-lg p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            </div>
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-secondary rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1">Total Repeats</div>
                        <div className="text-2xl font-bold">{data.totalRepeats}</div>
                    </div>
                    <div className="bg-secondary rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1">Unique Items</div>
                        <div className="text-2xl font-bold">{data.itemsWithRepeats}</div>
                    </div>
                </div>
                {data.mostRepeated.length > 0 && (
                    <>
                        <div className="text-xs font-semibold text-foreground mt-4">Most Repeated:</div>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                            {data.mostRepeated.slice(0, 5).map((item, idx) => (
                                <div key={idx} className="text-xs flex justify-between">
                                    <span className="text-muted-foreground truncate">{item.title}</span>
                                    <span className="font-medium whitespace-nowrap ml-2">{item.repeats}x</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// PANEL K: Priority Distribution
interface PriorityItem {
    priority: number;
    count: number;
    percentage: number;
    label: string;
}

interface PriorityDistributionPanelProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    items: PriorityItem[];
}

function PriorityDistributionPanel({ title, icon: Icon, items }: PriorityDistributionPanelProps) {
    const total = items.reduce((sum, item) => sum + item.count, 0);
    return (
        <div className="bg-card rounded-lg p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            </div>
            <div className="space-y-2.5">
                {items.map(item => (
                    <div key={item.priority} className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-medium">
                                {item.count} ({item.percentage.toFixed(1)}%)
                            </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-primary h-full transition-all duration-300"
                                style={{ width: `${item.percentage}%` }}
                            />
                        </div>
                    </div>
                ))}
                <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">Total: {total} items</div>
            </div>
        </div>
    );
}

// PANEL L: Custom Lists
interface CustomListItem {
    listName: string;
    count: number;
    percentage: number;
}

interface CustomListPanelProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    items: CustomListItem[];
}

function CustomListPanel({ title, icon: Icon, items }: CustomListPanelProps) {
    const total = items.reduce((sum, item) => sum + item.count, 0);
    return (
        <div className="bg-card rounded-lg p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            </div>
            <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {items.map((item, idx) => (
                    <div key={item.listName} className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground/60 w-5">{idx + 1}.</span>
                                <span className="text-muted-foreground truncate">{item.listName}</span>
                            </div>
                            <span className="font-medium whitespace-nowrap ml-2">{item.count}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-primary h-full transition-all duration-300"
                                style={{ width: `${item.percentage}%` }}
                            />
                        </div>
                    </div>
                ))}
                <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">Total: {total} items</div>
            </div>
        </div>
    );
}

// PANEL N: Completion Rate
interface CompletionRateData {
    completed: number;
    started: number;
    completionPercentage: number;
    notStarted: number;
}

interface CompletionRatePanelProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    data: CompletionRateData;
    onMetricClick?: (modal: { items: DisplayMedia[]; title: string; subtitle?: string }) => void;
}

function CompletionRatePanel({ title, icon: Icon, data, onMetricClick }: CompletionRatePanelProps) {
    return (
        <div className="bg-card rounded-lg p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Completion Rate</span>
                        <span className="font-semibold">{data.completionPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-green-500 h-full transition-all duration-300"
                            style={{ width: `${data.completionPercentage}%` }}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="bg-secondary rounded-lg p-2 cursor-pointer hover:bg-secondary/80 transition-colors"
                                onClick={() =>
                                    onMetricClick?.({
                                        items: data.completed.items,
                                        title: `${title} - Completed`,
                                        subtitle: data.completed.formula,
                                    })
                                }
                            >
                                <div className="text-xs text-muted-foreground">Completed</div>
                                <div className="text-lg font-bold">{data.completed.value}</div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">{data.completed.formula}</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="bg-secondary rounded-lg p-2 cursor-pointer hover:bg-secondary/80 transition-colors"
                                onClick={() =>
                                    onMetricClick?.({
                                        items: data.started.items,
                                        title: `${title} - Started`,
                                        subtitle: data.started.formula,
                                    })
                                }
                            >
                                <div className="text-xs text-muted-foreground">Started</div>
                                <div className="text-lg font-bold">{data.started.value}</div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">{data.started.formula}</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="bg-secondary rounded-lg p-2 cursor-pointer hover:bg-secondary/80 transition-colors"
                                onClick={() =>
                                    onMetricClick?.({
                                        items: data.notStarted.items,
                                        title: `${title} - Planning`,
                                        subtitle: data.notStarted.formula,
                                    })
                                }
                            >
                                <div className="text-xs text-muted-foreground">Planning</div>
                                <div className="text-lg font-bold">{data.notStarted.value}</div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">{data.notStarted.formula}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
}

// PANEL O: Length Analysis
interface LengthAnalysisData {
    longestSeries: Array<{ title: string; length: number }>;
    averageLength: number;
    totalLength: number;
}

interface LengthAnalysisPanelProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    data: LengthAnalysisData;
    onMetricClick?: (modal: { items: DisplayMedia[]; title: string; subtitle?: string }) => void;
}

function LengthAnalysisPanel({ title, icon: Icon, data, onMetricClick }: LengthAnalysisPanelProps) {
    return (
        <div className="bg-card rounded-lg p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            </div>
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="bg-secondary rounded-lg p-3 cursor-pointer hover:bg-secondary/80 transition-colors"
                                onClick={() =>
                                    onMetricClick?.({
                                        items: data.totalLength.items,
                                        title: `${title} - Total Length`,
                                        subtitle: data.totalLength.formula,
                                    })
                                }
                            >
                                <div className="text-xs text-muted-foreground mb-1">Total</div>
                                <div className="text-2xl font-bold">{data.totalLength.value}</div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">{data.totalLength.formula}</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="bg-secondary rounded-lg p-3 cursor-pointer hover:bg-secondary/80 transition-colors"
                                onClick={() =>
                                    onMetricClick?.({
                                        items: data.averageLength.items,
                                        title: `${title} - Average Length`,
                                        subtitle: data.averageLength.formula,
                                    })
                                }
                            >
                                <div className="text-xs text-muted-foreground mb-1">Average</div>
                                <div className="text-2xl font-bold">{data.averageLength.value.toFixed(1)}</div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">{data.averageLength.formula}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                {data.longestSeries.length > 0 && (
                    <>
                        <div className="text-xs font-semibold text-foreground mt-2">Top Series:</div>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                            {data.longestSeries.slice(0, 5).map((item, idx) => (
                                <div
                                    key={idx}
                                    className="text-xs flex justify-between cursor-pointer hover:bg-secondary/50 p-1 rounded transition-colors"
                                    onClick={() =>
                                        onMetricClick?.({
                                            items: item.items,
                                            title: `${title} - ${item.title}`,
                                            subtitle: `Length: ${item.length}`,
                                        })
                                    }
                                >
                                    <span className="text-muted-foreground truncate">
                                        {idx + 1}. {item.title}
                                    </span>
                                    <span className="font-medium whitespace-nowrap ml-2">{item.length}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// PANEL P: Time Investment
interface TimeInvestmentItem {
    format: string;
    totalTime: number;
    percentage: number;
    count: number;
}

interface TimeInvestmentPanelProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    items: TimeInvestmentItem[];
    onItemClick?: (modal: { items: DisplayMedia[]; title: string; subtitle?: string }) => void;
}

function TimeInvestmentPanel({ title, icon: Icon, items, onItemClick }: TimeInvestmentPanelProps) {
    const total = items.reduce((sum, item) => sum + item.totalTime, 0);
    return (
        <div className="bg-card rounded-lg p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            </div>
            <div className="space-y-2.5">
                {items.map(item => (
                    <div
                        key={item.format}
                        className={`space-y-1 ${onItemClick ? "cursor-pointer hover:bg-secondary/30 p-2 -mx-2 rounded transition-colors" : ""}`}
                        onClick={() =>
                            onItemClick?.({
                                items: item.items,
                                title: `${title} - ${item.format}`,
                                subtitle: `${item.count} items, ${item.totalTime} total time`,
                            })
                        }
                    >
                        <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{item.format}</span>
                            <span className="font-medium">
                                {item.totalTime} ({item.percentage.toFixed(1)}%)
                            </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-primary h-full transition-all duration-300"
                                style={{ width: `${item.percentage}%` }}
                            />
                        </div>
                    </div>
                ))}
                <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
                    Total: {total} episodes/chapters
                </div>
            </div>
        </div>
    );
}

// PANEL Q: Visibility
interface VisibilityData {
    public: number;
    private: number;
    publicPercentage: number;
    privatePercentage: number;
}

interface VisibilityPanelProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    data: VisibilityStatsData;
    onMetricClick?: (modal: { items: DisplayMedia[]; title: string; subtitle?: string }) => void;
}

function VisibilityPanel({ title, icon: Icon, data, onMetricClick }: VisibilityPanelProps) {
    return (
        <div className="bg-card rounded-lg p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Public</span>
                        <span className="font-semibold">{data.publicPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-blue-500 h-full transition-all duration-300"
                            style={{ width: `${data.publicPercentage}%` }}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Private</span>
                        <span className="font-semibold">{data.privatePercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-yellow-500 h-full transition-all duration-300"
                            style={{ width: `${data.privatePercentage}%` }}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center mt-4">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="bg-secondary rounded-lg p-2 cursor-pointer hover:bg-secondary/80 transition-colors"
                                onClick={() =>
                                    onMetricClick?.({
                                        items: data.public.items,
                                        title: `${title} - Public`,
                                        subtitle: data.public.formula,
                                    })
                                }
                            >
                                <div className="text-xs text-muted-foreground">Public</div>
                                <div className="text-lg font-bold">{data.public.value}</div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">{data.public.formula}</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="bg-secondary rounded-lg p-2 cursor-pointer hover:bg-secondary/80 transition-colors"
                                onClick={() =>
                                    onMetricClick?.({
                                        items: data.private.items,
                                        title: `${title} - Private`,
                                        subtitle: data.private.formula,
                                    })
                                }
                            >
                                <div className="text-xs text-muted-foreground">Private</div>
                                <div className="text-lg font-bold">{data.private.value}</div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">{data.private.formula}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
}

// FILTER UI COMPONENT

interface FilterPanelProps {
    filters: ReturnType<typeof useStatsFilters>["filters"];
    onFilterChange: ReturnType<typeof useStatsFilters>["updateFilter"];
    onReset: () => void;
    hasActiveFilters: boolean;
    animeList: DisplayMedia[];
    mangaList: DisplayMedia[];
}

function FilterPanel({ filters, onFilterChange, onReset, hasActiveFilters, animeList, mangaList }: FilterPanelProps) {
    // Extract unique genres from both lists
    const allGenres = Array.from(new Set([...animeList, ...mangaList].flatMap(item => item.genres || []))).sort();

    // Extract unique years
    const allYears = Array.from(
        new Set([...animeList, ...mangaList].map(item => item.seasonYear).filter(Boolean)),
    ).sort((a, b) => (b as number) - (a as number));

    // Extract unique statuses
    const allStatuses: DisplayMedia["status"][] = [
        "CURRENT",
        "COMPLETED",
        "PLANNING",
        "PAUSED",
        "DROPPED",
        "REPEATING",
    ];

    // Extract unique priorities
    const allPriorities = Array.from(new Set([...animeList, ...mangaList].map(item => item.priority))).sort(
        (a, b) => b - a,
    );

    // Extract unique custom lists
    const allCustomLists = Array.from(
        new Set([...animeList, ...mangaList].flatMap(item => item.customLists || [])),
    ).sort();

    const toggleGenre = (genre: string) => {
        const newGenres = filters.genres.includes(genre)
            ? filters.genres.filter(g => g !== genre)
            : [...filters.genres, genre];
        onFilterChange("genres", newGenres);
    };

    const toggleYear = (year: number) => {
        const newYears = filters.years.includes(year)
            ? filters.years.filter(y => y !== year)
            : [...filters.years, year];
        onFilterChange("years", newYears);
    };

    const toggleStatus = (status: DisplayMedia["status"]) => {
        const newStatuses = filters.statuses.includes(status)
            ? filters.statuses.filter(s => s !== status)
            : [...filters.statuses, status];
        onFilterChange("statuses", newStatuses);
    };

    const togglePriority = (priority: number) => {
        const newTiers = filters.tiers.includes(priority)
            ? filters.tiers.filter(t => t !== priority)
            : [...filters.tiers, priority];
        onFilterChange("tiers", newTiers);
    };

    const toggleCustomList = (listName: string) => {
        const newLists = filters.customLists.includes(listName)
            ? filters.customLists.filter(l => l !== listName)
            : [...filters.customLists, listName];
        onFilterChange("customLists", newLists);
    };

    return (
        <div className="bg-card rounded-lg p-6 border border-border/50 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Filters</h3>
                {hasActiveFilters && (
                    <button
                        onClick={onReset}
                        className="text-xs px-2 py-1 bg-secondary rounded hover:bg-secondary/80 transition-colors"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Media Type Filter */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Media Type</label>
                <div className="flex gap-2">
                    {(["all", "anime", "manga"] as const).map(type => (
                        <button
                            key={type}
                            onClick={() => onFilterChange("mediaType", type)}
                            className={`px-3 py-1 rounded text-xs transition-colors ${
                                filters.mediaType === type
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary hover:bg-secondary/80"
                            }`}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Origin Type Filter (TASK 1: Manga/Manhua/Manhwa) */}
            {(filters.mediaType === "manga" || filters.mediaType === "all") && (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Origin Type</label>
                    <div className="flex gap-2">
                        {(["manga", "manhua", "manhwa"] as const).map(originType => (
                            <button
                                key={originType}
                                onClick={() => {
                                    const newOriginTypes = filters.originTypes.includes(originType)
                                        ? filters.originTypes.filter(t => t !== originType)
                                        : [...filters.originTypes, originType];
                                    onFilterChange("originTypes", newOriginTypes);
                                }}
                                className={`px-3 py-1 rounded text-xs transition-colors ${
                                    filters.originTypes.includes(originType)
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary hover:bg-secondary/80"
                                }`}
                            >
                                {originType.charAt(0).toUpperCase() + originType.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Status Filter */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="flex flex-wrap gap-2">
                    {allStatuses.map(status => (
                        <button
                            key={status}
                            onClick={() => toggleStatus(status)}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                                filters.statuses.includes(status)
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary hover:bg-secondary/80"
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Genre Filter */}
            {allGenres.length > 0 && (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Genres</label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {allGenres.map(genre => (
                            <button
                                key={genre}
                                onClick={() => toggleGenre(genre)}
                                className={`px-2 py-1 rounded text-xs transition-colors ${
                                    filters.genres.includes(genre)
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary hover:bg-secondary/80"
                                }`}
                            >
                                {genre}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Year Filter */}
            {allYears.length > 0 && (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Release Years</label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {(allYears as number[]).map(year => (
                            <button
                                key={year}
                                onClick={() => toggleYear(year)}
                                className={`px-2 py-1 rounded text-xs transition-colors ${
                                    filters.years.includes(year)
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary hover:bg-secondary/80"
                                }`}
                            >
                                {year}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Priority/Tier Filter */}
            {allPriorities.length > 0 && (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Priority/Tier</label>
                    <div className="flex flex-wrap gap-2">
                        {allPriorities.map(priority => (
                            <button
                                key={priority}
                                onClick={() => togglePriority(priority)}
                                className={`px-2 py-1 rounded text-xs transition-colors ${
                                    filters.tiers.includes(priority)
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary hover:bg-secondary/80"
                                }`}
                            >
                                {priority === 0 ? "None" : priority === 1 ? "Low" : priority === 2 ? "Medium" : "High"}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Custom Lists Filter */}
            {allCustomLists.length > 0 && (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Custom Lists</label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {allCustomLists.map(listName => (
                            <button
                                key={listName}
                                onClick={() => toggleCustomList(listName)}
                                className={`px-2 py-1 rounded text-xs transition-colors ${
                                    filters.customLists.includes(listName)
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary hover:bg-secondary/80"
                                }`}
                            >
                                {listName}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Score Range Filter */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Score Range</label>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={filters.minScore}
                        onChange={e => onFilterChange("minScore", parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-xs bg-secondary border border-border rounded"
                    />
                    <span className="text-xs text-muted-foreground">to</span>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={filters.maxScore}
                        onChange={e => onFilterChange("maxScore", parseInt(e.target.value) || 100)}
                        className="w-20 px-2 py-1 text-xs bg-secondary border border-border rounded"
                    />
                </div>
            </div>
        </div>
    );
}

// PANEL R: Notes Analysis
interface NotesAnalysisData {
    itemsWithNotes: { value: number; items: DisplayMedia[]; formula?: string };
    itemsWithoutNotes: { value: number; items: DisplayMedia[]; formula?: string };
    averageNoteLength: { value: number; items: DisplayMedia[]; formula?: string };
    longestNotes: Array<{ title: string; noteLength: number; items: DisplayMedia[] }>;
}

interface NotesAnalysisPanelProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    data: NotesAnalysisData;
    onMetricClick?: (modal: { items: DisplayMedia[]; title: string; subtitle?: string }) => void;
}

function NotesAnalysisPanel({ title, icon: Icon, data, onMetricClick }: NotesAnalysisPanelProps) {
    return (
        <div className="bg-card rounded-lg p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            </div>
            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="bg-secondary rounded-lg p-2 cursor-pointer hover:bg-secondary/80 transition-colors"
                                onClick={() =>
                                    onMetricClick?.({
                                        items: data.itemsWithNotes.items,
                                        title: `${title} - With Notes`,
                                        subtitle: data.itemsWithNotes.formula,
                                    })
                                }
                            >
                                <div className="text-xs text-muted-foreground">With Notes</div>
                                <div className="text-lg font-bold">{data.itemsWithNotes.value}</div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">{data.itemsWithNotes.formula}</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="bg-secondary rounded-lg p-2 cursor-pointer hover:bg-secondary/80 transition-colors"
                                onClick={() =>
                                    onMetricClick?.({
                                        items: data.itemsWithoutNotes.items,
                                        title: `${title} - Without Notes`,
                                        subtitle: data.itemsWithoutNotes.formula,
                                    })
                                }
                            >
                                <div className="text-xs text-muted-foreground">Without Notes</div>
                                <div className="text-lg font-bold">{data.itemsWithoutNotes.value}</div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">{data.itemsWithoutNotes.formula}</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="bg-secondary rounded-lg p-2 cursor-pointer hover:bg-secondary/80 transition-colors"
                                onClick={() =>
                                    onMetricClick?.({
                                        items: data.averageNoteLength.items,
                                        title: `${title} - Average Note Length`,
                                        subtitle: data.averageNoteLength.formula,
                                    })
                                }
                            >
                                <div className="text-xs text-muted-foreground">Avg Length</div>
                                <div className="text-lg font-bold">{data.averageNoteLength.value}</div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">{data.averageNoteLength.formula}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                {data.longestNotes.length > 0 && (
                    <>
                        <div className="text-xs font-semibold text-foreground mt-2">Longest Notes:</div>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                            {data.longestNotes.slice(0, 5).map((item, idx) => (
                                <div
                                    key={idx}
                                    className="text-xs flex justify-between cursor-pointer hover:bg-secondary/50 p-1 rounded transition-colors"
                                    onClick={() =>
                                        onMetricClick?.({
                                            items: item.items,
                                            title: `${title} - ${item.title}`,
                                            subtitle: `Note length: ${item.noteLength} characters`,
                                        })
                                    }
                                >
                                    <span className="text-muted-foreground truncate">
                                        {idx + 1}. {item.title}
                                    </span>
                                    <span className="font-medium whitespace-nowrap ml-2">{item.noteLength} chars</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// PANEL S: Advanced Scores Analysis
interface AdvancedScoresData {
    itemsWithAdvancedScores: { value: number; items: DisplayMedia[]; formula?: string };
    averageAdvancedScores: Record<string, { value: number; items: DisplayMedia[]; formula?: string }>;
    scoreBreakdown: Array<{ scoreName: string; average: number; items: DisplayMedia[] }>;
}

interface AdvancedScoresPanelProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    data: AdvancedScoresData;
    onMetricClick?: (modal: { items: DisplayMedia[]; title: string; subtitle?: string }) => void;
}

function AdvancedScoresPanel({ title, icon: Icon, data, onMetricClick }: AdvancedScoresPanelProps) {
    return (
        <div className="bg-card rounded-lg p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            </div>
            <div className="space-y-3">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className="bg-secondary rounded-lg p-3 cursor-pointer hover:bg-secondary/80 transition-colors"
                            onClick={() =>
                                onMetricClick?.({
                                    items: data.itemsWithAdvancedScores.items,
                                    title: `${title} - Items with Advanced Scores`,
                                    subtitle: data.itemsWithAdvancedScores.formula,
                                })
                            }
                        >
                            <div className="text-xs text-muted-foreground mb-1">Items with Advanced Scores</div>
                            <div className="text-2xl font-bold">{data.itemsWithAdvancedScores.value}</div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-xs">{data.itemsWithAdvancedScores.formula}</p>
                    </TooltipContent>
                </Tooltip>
                {data.scoreBreakdown.length > 0 && (
                    <>
                        <div className="text-xs font-semibold text-foreground mt-2">Average Scores:</div>
                        <div className="space-y-2">
                            {data.scoreBreakdown.map((score, idx) => (
                                <Tooltip key={idx}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="flex justify-between items-center text-xs cursor-pointer hover:bg-secondary/50 p-2 rounded transition-colors"
                                            onClick={() =>
                                                onMetricClick?.({
                                                    items: score.items,
                                                    title: `${title} - ${score.scoreName}`,
                                                    subtitle: `Average: ${score.average}`,
                                                })
                                            }
                                        >
                                            <span className="text-muted-foreground">{score.scoreName}</span>
                                            <span className="font-medium">{score.average.toFixed(2)}</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs">
                                            {data.averageAdvancedScores[score.scoreName]?.formula}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// PANEL T: Hidden Items Analysis
interface HiddenItemsData {
    hidden: { value: number; items: DisplayMedia[]; formula?: string };
    visible: { value: number; items: DisplayMedia[]; formula?: string };
    hiddenPercentage: number;
    visiblePercentage: number;
}

interface HiddenItemsPanelProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    data: HiddenItemsData;
    onMetricClick?: (modal: { items: DisplayMedia[]; title: string; subtitle?: string }) => void;
}

function HiddenItemsPanel({ title, icon: Icon, data, onMetricClick }: HiddenItemsPanelProps) {
    return (
        <div className="bg-card rounded-lg p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Hidden</span>
                        <span className="font-semibold">{data.hiddenPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-yellow-500 h-full transition-all duration-300"
                            style={{ width: `${data.hiddenPercentage}%` }}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Visible</span>
                        <span className="font-semibold">{data.visiblePercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-green-500 h-full transition-all duration-300"
                            style={{ width: `${data.visiblePercentage}%` }}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center mt-4">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="bg-secondary rounded-lg p-2 cursor-pointer hover:bg-secondary/80 transition-colors"
                                onClick={() =>
                                    onMetricClick?.({
                                        items: data.hidden.items,
                                        title: `${title} - Hidden`,
                                        subtitle: data.hidden.formula,
                                    })
                                }
                            >
                                <div className="text-xs text-muted-foreground">Hidden</div>
                                <div className="text-lg font-bold">{data.hidden.value}</div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">{data.hidden.formula}</p>
                        </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="bg-secondary rounded-lg p-2 cursor-pointer hover:bg-secondary/80 transition-colors"
                                onClick={() =>
                                    onMetricClick?.({
                                        items: data.visible.items,
                                        title: `${title} - Visible`,
                                        subtitle: data.visible.formula,
                                    })
                                }
                            >
                                <div className="text-xs text-muted-foreground">Visible</div>
                                <div className="text-lg font-bold">{data.visible.value}</div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">{data.visible.formula}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
}

// PANEL M: Favourites Breakdown
interface FavouritesBreakdownData {
    anime: { value: number; items: DisplayMedia[]; formula?: string };
    manga: { value: number; items: DisplayMedia[]; formula?: string };
    characters: { value: number; items: DisplayMedia[]; formula?: string };
    staff: { value: number; items: DisplayMedia[]; formula?: string };
    studios: { value: number; items: DisplayMedia[]; formula?: string };
    total: { value: number; items: DisplayMedia[]; formula?: string };
}

interface FavouritesPanelProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    data: FavouritesBreakdownData;
    onMetricClick?: (modal: { items: DisplayMedia[]; title: string; subtitle?: string }) => void;
}

function FavouritesPanel({ title, icon: Icon, data, onMetricClick }: FavouritesPanelProps) {
    return (
        <div className="bg-card rounded-lg p-6 border border-border/50">
            <div className="flex items-center gap-2 mb-4">
                <Icon className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className="bg-secondary rounded-lg p-3 cursor-pointer hover:bg-secondary/80 transition-colors text-center"
                            onClick={() =>
                                onMetricClick?.({
                                    items: data.anime.items,
                                    title: "Favourite Anime",
                                    subtitle: data.anime.formula,
                                })
                            }
                        >
                            <div className="text-xs text-muted-foreground mb-1">Anime</div>
                            <div className="text-2xl font-bold">{data.anime.value}</div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-xs">{data.anime.formula}</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className="bg-secondary rounded-lg p-3 cursor-pointer hover:bg-secondary/80 transition-colors text-center"
                            onClick={() =>
                                onMetricClick?.({
                                    items: data.manga.items,
                                    title: "Favourite Manga",
                                    subtitle: data.manga.formula,
                                })
                            }
                        >
                            <div className="text-xs text-muted-foreground mb-1">Manga</div>
                            <div className="text-2xl font-bold">{data.manga.value}</div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-xs">{data.manga.formula}</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="bg-secondary rounded-lg p-3 text-center">
                            <div className="text-xs text-muted-foreground mb-1">Characters</div>
                            <div className="text-2xl font-bold">{data.characters.value}</div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-xs">{data.characters.formula}</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="bg-secondary rounded-lg p-3 text-center">
                            <div className="text-xs text-muted-foreground mb-1">Staff</div>
                            <div className="text-2xl font-bold">{data.staff.value}</div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-xs">{data.staff.formula}</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="bg-secondary rounded-lg p-3 text-center">
                            <div className="text-xs text-muted-foreground mb-1">Studios</div>
                            <div className="text-2xl font-bold">{data.studios.value}</div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-xs">{data.studios.formula}</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className="bg-primary/10 rounded-lg p-3 cursor-pointer hover:bg-primary/20 transition-colors text-center border border-primary/20"
                            onClick={() =>
                                onMetricClick?.({
                                    items: data.total.items,
                                    title: "Total Favourites",
                                    subtitle: data.total.formula,
                                })
                            }
                        >
                            <div className="text-xs text-muted-foreground mb-1">Total</div>
                            <div className="text-2xl font-bold">{data.total.value}</div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-xs">{data.total.formula}</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}

export default Stats;
