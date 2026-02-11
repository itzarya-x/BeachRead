import { HeroCarousel } from "@/components/home/HeroCarousel";
import { MediaRow } from "@/components/home/MediaRow";
import { MediaRowCard } from "@/components/home/MediaRowCard";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { MediaRowCardSkeleton } from "@/components/ui/Skeleton";
import { useData } from "@/context/DataContext";
import { Flame, Heart, History, Shuffle, Sparkles } from "lucide-react";
import { useMemo } from "react";

const Index = () => {
    const { loading, user, animeList, mangaList } = useData();

    const allMedia = useMemo(() => [...animeList, ...mangaList], [animeList, mangaList]);

    const continueItems = useMemo(
        () =>
            allMedia
                .filter(e => e.status === "CURRENT")
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
        [allMedia],
    );

    const favoriteItems = useMemo(
        () => allMedia.filter(e => e.score >= 90).sort((a, b) => b.score - a.score),
        [allMedia],
    );

    const recentItems = useMemo(
        () =>
            [...allMedia]
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 20),
        [allMedia],
    );

    const randomPick = useMemo(() => {
        if (allMedia.length === 0) return null;
        return allMedia[Math.floor(Math.random() * allMedia.length)];
    }, [allMedia]);

    if (loading) {
        return (
            <PageWrapper>
                <div className="space-y-12 pb-20">
                    <div className="px-4 pt-4">
                        <div className="h-[500px] w-full bg-surface-2 rounded-[2.5rem] animate-pulse" />
                    </div>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="px-4 space-y-4">
                            <div className="h-8 w-48 bg-surface-2 rounded-lg animate-pulse" />
                            <div className="flex gap-4 overflow-hidden">
                                {[...Array(6)].map((_, j) => (
                                    <MediaRowCardSkeleton key={j} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </PageWrapper>
        );
    }

    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-destructive font-bold">Session expired. Please reconnect.</p>
            </div>
        );
    }

    return (
        <PageWrapper>
            <div className="space-y-20 pb-32">
                {/* Cinematic Hero */}
                {continueItems.length > 0 && (
                    <div className="md:px-4 pt-4">
                        <HeroCarousel items={continueItems} />
                    </div>
                )}

                <div className="space-y-24">
                    {/* 1. Continue Watching / Reading */}
                    {continueItems.length > 0 && (
                        <div className="px-4 container mx-auto max-w-[1600px]">
                            <MediaRow title="Continue Journey" icon={History} count={continueItems.length}>
                                {continueItems.map((item, i) => (
                                    <MediaRowCard key={`cont-${item._seriesId}`} media={item} index={i} />
                                ))}
                            </MediaRow>
                        </div>
                    )}

                    {/* 2. Recently Updated */}
                    {recentItems.length > 0 && (
                        <div className="px-4 container mx-auto max-w-[1600px]">
                            <MediaRow title="Just Updated" icon={Sparkles} count={recentItems.length}>
                                {recentItems.map((item, i) => (
                                    <MediaRowCard key={`rec-${item._seriesId}`} media={item} index={i} />
                                ))}
                            </MediaRow>
                        </div>
                    )}

                    {/* 3. Your Favorites */}
                    {favoriteItems.length > 0 && (
                        <div className="px-4 container mx-auto max-w-[1600px]">
                            <MediaRow title="Your Masterpieces" icon={Heart} count={favoriteItems.length}>
                                {favoriteItems.map((item, i) => (
                                    <MediaRowCard key={`fav-${item._seriesId}`} media={item} index={i} />
                                ))}
                            </MediaRow>
                        </div>
                    )}

                    {/* 4. Trending (Simulated for this demo) */}
                    <div className="px-4 container mx-auto max-w-[1600px]">
                        <MediaRow title="Trending Now" icon={Flame}>
                             {allMedia.slice(0, 10).map((item, i) => (
                                <MediaRowCard key={`trend-${item._seriesId}`} media={item} index={i} />
                            ))}
                        </MediaRow>
                    </div>

                    {/* 7. Random Pick */}
                    {randomPick && (
                        <div className="px-4 container mx-auto max-w-[1600px]">
                             <div className="bg-gradient-to-br from-primary/10 to-transparent p-12 rounded-[3rem] border border-primary/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-all group-hover:bg-primary/10" />
                                <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                                    <div className="shrink-0">
                                        <MediaRowCard media={randomPick} />
                                    </div>
                                    <div className="flex-1 space-y-6 text-center md:text-left">
                                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary text-xs font-black uppercase tracking-widest">
                                            <Shuffle className="w-3 h-3" />
                                            Fate Selection
                                        </div>
                                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">
                                            Feeling adventurous?
                                        </h2>
                                        <p className="text-white/60 text-lg max-w-xl">
                                            We've pulled a random gem from your vault. Why not give it another look?
                                        </p>
                                        <button 
                                            onClick={() => window.location.reload()}
                                            className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                                        >
                                            Roll Again
                                        </button>
                                    </div>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>

            <FloatingActionButton onClick={() => console.log("Add clicked")} />
        </PageWrapper>
    );
};

export default Index;
