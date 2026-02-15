import { MediaRow } from "@/components/home/MediaRow";
import { MediaRowCard } from "@/components/home/MediaRowCard";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { useData } from "@/context/DataContext";
import type { DisplayMedia } from "@/types/display";
import { safeArray } from "@/utils/safeArray";
import { motion } from "framer-motion";
import { Flame, History, Sparkles, Star } from "lucide-react";
import { useMemo } from "react";

const Index = () => {
    const { loading, user, animeList, mangaList, getTitle } = useData();

    const allMedia = useMemo(() => [
        ...safeArray<DisplayMedia>(animeList), 
        ...safeArray<DisplayMedia>(mangaList)
    ], [animeList, mangaList]);

    const continueItems = useMemo(
        () =>
            safeArray<DisplayMedia>(allMedia)
                .filter(e => e.status === "CURRENT")
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
        [allMedia],
    );

    const sATierItems = useMemo(
        () => safeArray<DisplayMedia>(allMedia)
            .filter(e => e.score >= 80)
            .sort((a, b) => b.score - a.score),
        [allMedia],
    );

    const justUpdatedItems = useMemo(
        () =>
            [...safeArray<DisplayMedia>(allMedia)]
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .filter(m => m.status === "CURRENT" || m.status === "REPEATING")
                .slice(0, 15),
        [allMedia],
    );

    const trendingItems = useMemo(
        () => [...safeArray<DisplayMedia>(allMedia)]
            .sort((a, b) => b.score - a.score)
            .slice(0, 12),
        [allMedia],
    );

    const hiddenGems = useMemo(
        () =>
            [...safeArray<DisplayMedia>(allMedia)]
                .filter(m => m.score >= 65 && m.score < 85 && m.status !== "DROPPED")
                .sort((a, b) => b.score - a.score)
                .slice(0, 12),
        [allMedia],
    );

    const becauseYouLikedSeed = useMemo(
        () => [...safeArray<DisplayMedia>(allMedia)].sort((a, b) => b.score - a.score)[0] ?? null,
        [allMedia],
    );

    const becauseYouLikedItems = useMemo(() => {
        if (!becauseYouLikedSeed) return [];

        return [...safeArray<DisplayMedia>(allMedia)]
            .filter(m => m._seriesId !== becauseYouLikedSeed._seriesId)
            .filter(m => {
                const sameType = m.mediaType === becauseYouLikedSeed.mediaType;
                const sharedGenre = m.genres?.some(g => becauseYouLikedSeed.genres?.includes(g));
                return sameType || sharedGenre;
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 12);
    }, [allMedia, becauseYouLikedSeed]);

    const recentActivity = useMemo(
        () =>
            [...safeArray<DisplayMedia>(allMedia)]
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 10),
        [allMedia],
    );

    if (loading) {
        return (
            <PageWrapper>
                <div className="space-y-12 pb-20 p-6 lg:p-14">
                    <div className="h-[25vh] w-full animate-pulse rounded-[2.5rem] border border-border bg-card/70 backdrop-blur-[18px]" />
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="space-y-6">
                            <div className="h-10 w-64 animate-pulse rounded-xl bg-muted/60" />
                            <div className="flex gap-6 overflow-hidden">
                                {[...Array(6)].map((_, j) => (
                                    <div key={j} className="aspect-[2/3] w-[200px] shrink-0 animate-pulse rounded-[1.5rem] bg-muted/60 md:w-[320px]" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </PageWrapper>
        );
    }

    if (!user) return null;

    return (
        <PageWrapper>
            <div className="space-y-14 pb-36">
                {/* 🎬 SECTION 1 — COMPACT HERO */}
                <section className="relative flex min-h-[190px] items-center overflow-hidden px-6 pt-8 lg:px-14">
                    <div className="sakura-hero-flare pointer-events-none absolute inset-0" />
                    <div className="pointer-events-none absolute -right-28 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
                    <div className="pointer-events-none absolute -left-20 -top-12 h-52 w-52 rounded-full bg-accent/80 blur-2xl" />
                    
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                        className="relative z-10 space-y-3 max-w-4xl"
                    >
                        <div className="space-y-0.5">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
                                Welcome back, <span className="text-primary">{user.displayName || "Explorer"}</span>
                            </h1>
                            <p className="text-sm text-muted-foreground md:text-base">
                                Pick up where you left off and discover your next collectible favorite.
                            </p>
                        </div>

                        {/* Quick Stats Ribbon */}
                        <div className="flex flex-wrap gap-2.5 items-center w-fit">
                            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/60 px-3.5 py-1.5 backdrop-blur-md">
                                <span className="text-sm font-bold tabular-nums text-foreground">{allMedia.length}</span>
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Entries</span>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/12 px-3.5 py-1.5">
                                <span className="text-sm font-bold tabular-nums text-primary">{continueItems.length}</span>
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">In Progress</span>
                            </div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/60 px-3.5 py-1.5 backdrop-blur-md">
                                <span className="text-sm font-bold tabular-nums text-foreground">
                                    {allMedia.length > 0 
                                        ? (allMedia.reduce((acc, m) => acc + m.score, 0) / allMedia.filter(m => m.score > 0).length || 0).toFixed(1)
                                        : "0.0"}
                                </span>
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Avg Score</span>
                            </div>
                        </div>
                    </motion.div>
                </section>

                <div className="space-y-16">
                    {/* ▶ SECTION 2 — CONTINUE WATCHING (LARGE) */}
                    {continueItems.length > 0 && (
                        <MediaRow title="Continue Journey" icon={History}>
                            {continueItems.map((item, i) => (
                                <MediaRowCard key={`cont-${item._seriesId}`} media={item} index={i} variant="continue" className="w-[240px] md:w-[380px]" />
                            ))}
                        </MediaRow>
                    )}

                    {/* ✨ SECTION 3 — JUST UPDATED */}
                    {justUpdatedItems.length > 0 && (
                        <MediaRow title="Recently Updated" icon={Sparkles}>
                            {justUpdatedItems.map((item, i) => (
                                <MediaRowCard key={`upd-${item._seriesId}`} media={item} index={i} variant="updated" />
                            ))}
                        </MediaRow>
                    )}

                    {/* 🔥 SECTION 4 — TRENDING NOW */}
                    {trendingItems.length > 0 && (
                        <MediaRow title="Trending" icon={Flame}>
                            {trendingItems.map((item, i) => (
                                <MediaRowCard key={`trend-${item._seriesId}`} media={item} index={i} variant="trending" />
                            ))}
                        </MediaRow>
                    )}

                    {/* 🏆 SECTION 5 — FROM YOUR S / A TIERS */}
                    {sATierItems.length > 0 && (
                        <MediaRow title="From Your Tiers" icon={Star}>
                            {sATierItems.map((item, i) => (
                                <MediaRowCard key={`rank-${item._seriesId}`} media={item} index={i} />
                            ))}
                        </MediaRow>
                    )}

                    {/* 💎 SECTION 6 — HIDDEN GEMS */}
                    {hiddenGems.length > 0 && (
                        <MediaRow title="Hidden Gems" icon={Sparkles}>
                            {hiddenGems.map((item, i) => (
                                <MediaRowCard key={`gems-${item._seriesId}`} media={item} index={i} />
                            ))}
                        </MediaRow>
                    )}

                    {/* ❤️ SECTION 7 — BECAUSE YOU LIKED X */}
                    {becauseYouLikedSeed && becauseYouLikedItems.length > 0 && (
                        <MediaRow title={`Because You Liked ${getTitle(becauseYouLikedSeed)}`} icon={History}>
                            {becauseYouLikedItems.map((item, i) => (
                                <MediaRowCard key={`because-${item._seriesId}`} media={item} index={i} />
                            ))}
                        </MediaRow>
                    )}

                    {/* 🕒 SECTION 8 — RECENT ACTIVITY (FEED CARDS) */}
                    {recentActivity.length > 0 && (
                        <MediaRow title="Recent Activity" icon={History}>
                            {recentActivity.map((item, i) => (
                                <motion.div 
                                    key={`act-${item._seriesId}`}
                                    className="group flex w-[280px] shrink-0 snap-start items-center gap-4 rounded-xl border border-border/80 bg-card/60 p-4 backdrop-blur-[16px] transition-all hover:-translate-y-1 hover:border-primary/30 md:w-[340px]"
                                >
                                    <div className="h-18 w-14 shrink-0 overflow-hidden rounded-lg">
                                        <img src={item.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="line-clamp-1 text-sm font-semibold text-foreground">{getTitle(item)}</h4>
                                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/80">
                                            {item.mediaType === "ANIME" ? "EP" : "CH"} {item.progress} (+1)
                                        </p>
                                        <p className="mt-0.5 text-[10px] text-muted-foreground">{new Date(item.updatedAt).toLocaleDateString()}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </MediaRow>
                    )}
                </div>
            </div>

            <FloatingActionButton onClick={() => console.log("Add clicked")} label="Quick Add" />
        </PageWrapper>
    );
};

export default Index;
