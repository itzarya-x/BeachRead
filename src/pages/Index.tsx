import { AboutCard } from "@/components/home/AboutCard";
import { ContinueWatchingSection } from "@/components/home/ContinueWatchingSection";
import { HeroSection } from "@/components/home/HeroSection";
import { MediaRow } from "@/components/home/MediaRow";
import { MediaRowCard } from "@/components/home/MediaRowCard";
import { PersonalizedInsights } from "@/components/home/PersonalizedInsights";
import { RecentlyUpdatedSection } from "@/components/home/RecentlyUpdatedSection";
import { RecommendationsSection } from "@/components/home/RecommendationsSection";
import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { StatsOverview } from "@/components/profile/StatsOverview";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { useData } from "@/context/DataContext";
import { Activity, Bookmark, Clock, Pin, Play, Star } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
    const { loading, user, animeList, mangaList } = useData();
    const navigate = useNavigate();

    const allMedia = useMemo(() => [...animeList, ...mangaList], [animeList, mangaList]);

    const continueItems = useMemo(
        () =>
            allMedia
                .filter(e => e.status === "CURRENT")
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
        [allMedia],
    );

    const pinnedItems = useMemo(
        () => allMedia.filter(e => e.priority > 0 || e.repeat > 0).sort((a, b) => b.score - a.score),
        [allMedia],
    );

    const highTierItems = useMemo(
        () => allMedia.filter(e => e.score >= 80 && e.status === "COMPLETED").sort((a, b) => b.score - a.score),
        [allMedia],
    );

    const recentItems = useMemo(
        () =>
            [...allMedia]
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 25),
        [allMedia],
    );

    const plannedItems = useMemo(
        () =>
            allMedia.filter(e => e.status === "PLANNING").sort((a, b) => b.priority - a.priority || b.score - a.score),
        [allMedia],
    );

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm">Loading your library…</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-destructive">Failed to load profile data.</p>
            </div>
        );
    }

    const { anime, manga } = user.statistics;

    return (
        <PageWrapper>
            <PageHeader title="Welcome back" subtitle={user.displayName} />
            <PageContent className="space-section">
                {/* Hero Section */}
                <HeroSection
                    user={user}
                    onAddClick={() => console.log("Add clicked")}
                    onImportClick={() => navigate("/settings")}
                    onTierClick={() => navigate("/tiers")}
                />

                {/* Stats Overview */}
                <div>
                    <StatsOverview />
                </div>

                {/* About Card */}
                <AboutCard user={user} />

                {/* Personalized Insights */}
                <PersonalizedInsights />

                {/* Continue Watching Section - Premium Main Attraction */}
                <div>
                    <ContinueWatchingSection items={continueItems} onViewAll={() => navigate("/anime")} />
                </div>

                {/* Recently Updated Section */}
                <div>
                    <RecentlyUpdatedSection items={recentItems} onViewAll={() => navigate("/anime")} />
                </div>

                {/* From Your Favourites Section */}
                {highTierItems.length > 0 && (
                    <div>
                        <MediaRow title="From Your Favourites" icon={Star} count={highTierItems.length}>
                            {highTierItems.map(item => (
                                <MediaRowCard key={item._seriesId} media={item} />
                            ))}
                        </MediaRow>
                    </div>
                )}

                {/* Recommendations Section */}
                <div>
                    <RecommendationsSection />
                </div>

                {/* Activity Feed Section */}
                <section className="space-subsection">
                    <div className="flex items-center justify-between">
                        <h2 className="section-title text-2xl md:text-3xl">
                            <Activity className="w-6 h-6 text-primary" />
                            Activity
                        </h2>
                        <button
                            onClick={() => navigate("/activity")}
                            className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors"
                        >
                            View All →
                        </button>
                    </div>
                    <p className="text-sm text-muted-foreground text-center py-8">Your activity will appear here</p>
                </section>

                {/* Legacy Content rows - kept for completeness */}
                <div className="max-w-7xl mx-auto px-4 py-6 space-section">
                    {continueItems.length > 0 && (
                        <MediaRow title="Continue" icon={Play} count={continueItems.length}>
                            {continueItems.map(item => (
                                <MediaRowCard key={item._seriesId} media={item} />
                            ))}
                        </MediaRow>
                    )}

                    {pinnedItems.length > 0 && (
                        <MediaRow title="Pinned" icon={Pin} count={pinnedItems.length}>
                            {pinnedItems.map(item => (
                                <MediaRowCard key={item._seriesId} media={item} />
                            ))}
                        </MediaRow>
                    )}

                    {highTierItems.length > 0 && (
                        <MediaRow title="High Tier" icon={Star} count={highTierItems.length}>
                            {highTierItems.map(item => (
                                <MediaRowCard key={item._seriesId} media={item} />
                            ))}
                        </MediaRow>
                    )}

                    {recentItems.length > 0 && (
                        <MediaRow title="Recently Updated" icon={Clock} count={recentItems.length}>
                            {recentItems.map((item, i) => (
                                <MediaRowCard key={`${item._seriesId}-${i}`} media={item} />
                            ))}
                        </MediaRow>
                    )}

                    {plannedItems.length > 0 && (
                        <MediaRow title="Planned" icon={Bookmark} count={plannedItems.length}>
                            {plannedItems.map(item => (
                                <MediaRowCard key={item._seriesId} media={item} />
                            ))}
                        </MediaRow>
                    )}
                </div>

                {/* Floating Action Button */}
                <FloatingActionButton onClick={() => console.log("Add clicked")} />
            </PageContent>
        </PageWrapper>
    );
};

export default Index;
