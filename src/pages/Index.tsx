import { MediaRow } from "@/components/home/MediaRow";
import { MediaRowCard } from "@/components/home/MediaRowCard";
import { AutoBento } from "@/components/layout/AutoBento";
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
                <div className="page-container space-y-12 py-12">
                    <div className="h-[25vh] w-full animate-pulse rounded-[2.5rem] border border-white/5 bg-card/70 backdrop-blur-[18px]" />
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
            <div className="space-y-12 pb-36">
                {/* 🎬 SECTION 1 — COMPACT HERO */}
                <div className="page-container">
                    <section className="relative flex min-h-[220px] items-center overflow-hidden rounded-[2.5rem] border border-white/5 bg-card/30 p-8 md:p-12 shadow-depth2">
                        <div className="sakura-hero-flare pointer-events-none absolute inset-0" />
                        <div className="pointer-events-none absolute -right-28 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
                        <div className="pointer-events-none absolute -left-20 -top-12 h-52 w-52 rounded-full bg-accent/80 blur-2xl" />
                        
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                            className="relative z-10 space-y-5 max-w-4xl"
                        >
                            <div className="space-y-1">
                                <h1 className="text-4xl font-black tracking-tighter text-foreground md:text-6xl uppercase">
                                    Welcome, <span className="text-primary">{user.displayName || "Explorer"}</span>
                                </h1>
                                <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/30">
                                    Archive Synchronisation Active
                                </p>
                            </div>

                            {/* Quick Stats Ribbon */}
                            <div className="flex flex-wrap gap-3 items-center w-fit">
                                <div className="inline-flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-2 backdrop-blur-md">
                                    <span className="text-sm font-black tabular-nums text-foreground">{allMedia.length}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Total Assets</span>
                                </div>
                                <div className="inline-flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2">
                                    <span className="text-sm font-black tabular-nums text-primary">{continueItems.length}</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-primary/40">Active Links</span>
                                </div>
                            </div>
                        </motion.div>
                    </section>
                </div>

                <div className="page-container space-y-20">
                    {/* ▶ SECTION 2 — CONTINUE WATCHING (LARGE) */}
                    {continueItems.length > 0 && (
                        <MediaRow title="Neural Continuity" icon={History}>
                            {continueItems.map((item, i) => (
                                <MediaRowCard key={`cont-${item._seriesId}`} media={item} index={i} variant="continue" className="w-[280px] md:w-[420px]" />
                            ))}
                        </MediaRow>
                    )}

                    {/* Quick Activity Pulse (Bento Zone) */}
                    <AutoBento maxWidth={1500} minTileWidth={400}>
                        <div className="bento-span-2 sakura-glass p-6 flex flex-col justify-center">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Vault Status</h3>
                            <p className="text-lg font-medium text-white/70 leading-relaxed">
                                Your intelligence hub is operating at nominal capacity. <span className="text-primary font-bold">{justUpdatedItems.length}</span> updates recorded in this cycle.
                            </p>
                        </div>
                        {recentActivity.length > 0 && (
                            <div className="sakura-glass p-6 space-y-5 shadow-depth1">
                                <div className="flex items-center gap-2">
                                    <History className="w-4 h-4 text-primary" />
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Recent Pulse</h3>
                                </div>
                                <div className="space-y-4">
                                    {recentActivity.slice(0, 3).map((item, i) => (
                                        <div key={`pulse-${item._seriesId}`} className="flex items-center gap-4">
                                            <div className="h-12 w-9 shrink-0 rounded-lg overflow-hidden border border-white/5">
                                                <img src={item.coverImage} className="w-full h-full object-cover" alt={`${getTitle(item)} cover`} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="truncate text-xs font-black uppercase tracking-widest text-white/80">{getTitle(item)}</h4>
                                                <p className="text-[9px] font-bold text-primary/60 mt-0.5">{item.status} · {item.mediaType}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </AutoBento>

                    {/* ✨ SECTION 3 — JUST UPDATED */}
                    {justUpdatedItems.length > 0 && (
                        <MediaRow title="Latest Fragments" icon={Sparkles}>
                            {justUpdatedItems.map((item, i) => (
                                <MediaRowCard key={`upd-${item._seriesId}`} media={item} index={i} variant="updated" />
                            ))}
                        </MediaRow>
                    )}

                    {/* 🔥 SECTION 4 — TRENDING NOW */}
                    {trendingItems.length > 0 && (
                        <MediaRow title="Trending Signals" icon={Flame}>
                            {trendingItems.map((item, i) => (
                                <MediaRowCard key={`trend-${item._seriesId}`} media={item} index={i} variant="trending" />
                            ))}
                        </MediaRow>
                    )}

                    {/* 🏆 SECTION 5 — FROM YOUR S / A TIERS */}
                    {sATierItems.length > 0 && (
                        <MediaRow title="High Affinity" icon={Star}>
                            {sATierItems.map((item, i) => (
                                <MediaRowCard key={`rank-${item._seriesId}`} media={item} index={i} />
                            ))}
                        </MediaRow>
                    )}

                    {/* 💎 SECTION 6 — HIDDEN GEMS */}
                    {hiddenGems.length > 0 && (
                        <MediaRow title="Deep Data" icon={Sparkles}>
                            {hiddenGems.map((item, i) => (
                                <MediaRowCard key={`gems-${item._seriesId}`} media={item} index={i} />
                            ))}
                        </MediaRow>
                    )}

                    {/* ❤️ SECTION 7 — BECAUSE YOU LIKED X */}
                    {becauseYouLikedSeed && becauseYouLikedItems.length > 0 && (
                        <MediaRow title={`Signal Similarity: ${getTitle(becauseYouLikedSeed)}`} icon={History}>
                            {becauseYouLikedItems.map((item, i) => (
                                <MediaRowCard key={`because-${item._seriesId}`} media={item} index={i} />
                            ))}
                        </MediaRow>
                    )}
                </div>
            </div>

            <FloatingActionButton onClick={() => console.log("Add clicked")} label="Establish Link" />
        </PageWrapper>
    );
};

export default Index;
