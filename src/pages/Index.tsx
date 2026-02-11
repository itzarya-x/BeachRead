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
            .reverse()
            .slice(0, 12),
        [allMedia],
    );

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
                    <div className="h-[25vh] w-full bg-white/5 rounded-[2.5rem] animate-pulse" />
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="space-y-6">
                            <div className="h-10 w-64 bg-white/5 rounded-xl animate-pulse" />
                            <div className="flex gap-6 overflow-hidden">
                                {[...Array(6)].map((_, j) => (
                                    <div key={j} className="w-[200px] md:w-[320px] aspect-[2/3] bg-white/5 rounded-[1.5rem] shrink-0 animate-pulse" />
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
            <div className="space-y-24 pb-40">
                {/* 🎬 SECTION 1 — COMPACT HERO */}
                <section className="relative h-[25vh] min-h-[250px] flex items-center px-6 lg:px-14 overflow-hidden pt-10">
                    {/* Ambient Glow */}
                    <div className="absolute top-0 right-0 w-[50%] h-full bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                    
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                        className="relative z-10 space-y-4 max-w-4xl"
                    >
                        <div className="space-y-0.5">
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white/90">
                                Welcome back, <span className="text-primary">{user.displayName || "Explorer"}</span>
                            </h1>
                        </div>

                        {/* Quick Stats Ribbon */}
                        <div className="flex flex-wrap gap-8 items-center bg-white/[0.02] border border-white/5 backdrop-blur-md rounded-2xl p-4 w-fit">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-black tabular-nums">{allMedia.length}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Entries</span>
                            </div>
                            <div className="w-px h-6 bg-white/10" />
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-black tabular-nums text-primary">{continueItems.length}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/20">In Progress</span>
                            </div>
                            <div className="w-px h-6 bg-white/10" />
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-black tabular-nums text-white/60">
                                    {allMedia.length > 0 
                                        ? (allMedia.reduce((acc, m) => acc + m.score, 0) / allMedia.filter(m => m.score > 0).length || 0).toFixed(1)
                                        : "0.0"}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Avg Score</span>
                            </div>
                        </div>
                    </motion.div>
                </section>

                <div className="space-y-24">
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
                        <MediaRow title="Just Updated" icon={Sparkles}>
                            {justUpdatedItems.map((item, i) => (
                                <MediaRowCard key={`upd-${item._seriesId}`} media={item} index={i} variant="updated" />
                            ))}
                        </MediaRow>
                    )}

                    {/* 🔥 SECTION 4 — TRENDING NOW */}
                    {trendingItems.length > 0 && (
                        <MediaRow title="Trending Now" icon={Flame}>
                            {trendingItems.map((item, i) => (
                                <MediaRowCard key={`trend-${item._seriesId}`} media={item} index={i} variant="trending" />
                            ))}
                        </MediaRow>
                    )}

                    {/* 🏆 SECTION 5 — FROM YOUR S / A TIERS */}
                    {sATierItems.length > 0 && (
                        <MediaRow title="From Your S/A Tiers" icon={Star}>
                            {sATierItems.map((item, i) => (
                                <MediaRowCard key={`rank-${item._seriesId}`} media={item} index={i} />
                            ))}
                        </MediaRow>
                    )}

                    {/* 🕒 SECTION 6 — RECENT ACTIVITY (FEED CARDS) */}
                    {recentActivity.length > 0 && (
                        <MediaRow title="Recent Activity" icon={History}>
                            {recentActivity.map((item, i) => (
                                <motion.div 
                                    key={`act-${item._seriesId}`}
                                    className="w-[280px] md:w-[340px] p-5 rounded-[1.5rem] bg-white/5 border border-white/5 flex gap-4 items-center shrink-0 hover:bg-white/10 transition-all cursor-pointer group snap-start"
                                >
                                    <div className="w-14 h-18 rounded-lg overflow-hidden shrink-0">
                                        <img src={item.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold text-white line-clamp-1 text-sm">{getTitle(item)}</h4>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-primary/60 mt-1">
                                            {item.mediaType === "ANIME" ? "EP" : "CH"} {item.progress} (+1)
                                        </p>
                                        <p className="text-[9px] text-white/20 mt-0.5">{new Date(item.updatedAt).toLocaleDateString()}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </MediaRow>
                    )}
                </div>
            </div>

            <FloatingActionButton onClick={() => console.log("Add clicked")} />
        </PageWrapper>
    );
};

export default Index;
