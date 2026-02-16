import { UpdateCard } from "@/components/continue/UpdateCard";
import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { useData } from "@/context/DataContext";
import { fetchMediaBatched } from "@/lib/anilist-api";
import type { DisplayMedia } from "@/types/display";
import { safeArray } from "@/utils/safeArray";
import { Play, RotateCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const Continue = () => {
    const { animeList, mangaList, loading, updateEntry, user } = useData();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [updatedMedia, setUpdatedMedia] = useState<Map<number, any>>(new Map());

    // Filter for ongoing items
    const ongoingItems = useMemo(() => {
        const all = [
            ...safeArray<DisplayMedia>(animeList), 
            ...safeArray<DisplayMedia>(mangaList)
        ];
        return all.filter(item => {
            if (item.status === "CURRENT") return true;
            // Also include items that are not completed but have progress
            const total = item.episodes || item.chapters || 0;
            return item.status !== "COMPLETED" && item.status !== "DROPPED" && item.progress > 0 && (total === 0 || item.progress < total);
        });
    }, [animeList, mangaList]);

    // Check for updates
    const checkForUpdates = async () => {
        if (ongoingItems.length === 0) return;
        
        setIsRefreshing(true);
        try {
            const ids = ongoingItems.map(m => m._seriesId);
            const freshData = await fetchMediaBatched(ids);
            setUpdatedMedia(freshData);
            
            // Check for new content
            let newUpdates = 0;
            ongoingItems.forEach(item => {
                const fresh = freshData.get(item._seriesId);
                if (fresh) {
                    const total = fresh.episodes || fresh.chapters || 0;
                    if (total > item.progress) newUpdates++;
                }
            });

            if (newUpdates > 0) {
                toast.success(`${newUpdates} new updates detected`);
            }
        } catch (err) {
            console.error("Failed to check updates", err);
            toast.error("Update check failed");
        } finally {
            setIsRefreshing(false);
        }
    };

    // Auto-check on mount (debounced)
    useEffect(() => {
        if (!loading && ongoingItems.length > 0) {
            const timeout = setTimeout(() => {
                void checkForUpdates();
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [loading, ongoingItems.length]); // Only re-run if item count changes significantly

    // Merge fresh data and sort
    const displayItems = useMemo(() => {
        return ongoingItems.map(item => {
            const fresh = updatedMedia.get(item._seriesId);
            if (fresh) {
                return {
                    ...item,
                    episodes: fresh.episodes ?? item.episodes,
                    chapters: fresh.chapters ?? item.chapters,
                    updatedAt: fresh.updatedAt ? new Date(fresh.updatedAt * 1000).toISOString() : item.updatedAt,
                    _hasUpdate: (fresh.episodes || fresh.chapters || 0) > item.progress
                };
            }
            return {
                ...item,
                _hasUpdate: (item.episodes || item.chapters || 0) > item.progress && (item.episodes || item.chapters || 0) > 0
            };
        }).sort((a, b) => {
            // Priority 1: Has new update
            if (a._hasUpdate !== b._hasUpdate) return a._hasUpdate ? -1 : 1;
            
            // Priority 2: Recently updated
            const dateA = new Date(a.updatedAt).getTime();
            const dateB = new Date(b.updatedAt).getTime();
            return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
        });
    }, [ongoingItems, updatedMedia]);

    const handleIncrement = async (id: number, current: number) => {
        await updateEntry(id, { progress: current + 1 });
        toast.success("Progress updated");
    };

    const handleComplete = async (id: number) => {
        await updateEntry(id, { status: "COMPLETED" });
        toast.success("Marked as completed");
    };

    if (loading) {
        return (
            <PageWrapper className="p-6">
                <div className="mb-8 h-10 w-48 animate-pulse rounded-lg bg-muted" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
                    ))}
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <div className="page-container">
                <div className="flex items-center justify-between mb-8">
                    <PageHeader 
                        title="Live Feed" 
                        subtitle={`${displayItems.length} active series tracked`}
                        icon={Play}
                    />
                    <button
                        onClick={checkForUpdates}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest text-primary disabled:opacity-50 transition-colors"
                    >
                        <RotateCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                        {isRefreshing ? "Syncing..." : "Refresh"}
                    </button>
                </div>
            </div>

            <PageContent className="max-w-none px-0">
                {displayItems.length > 0 ? (
                    <div className="page-container">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {displayItems.map((item) => (
                                <UpdateCard 
                                    key={`${item.mediaType}-${item._seriesId}`} 
                                    media={item} 
                                    onIncrement={() => handleIncrement(Number(item._entryId), item.progress)}
                                    onComplete={() => handleComplete(Number(item._entryId))}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="page-container">
                        <div className="sakura-glass p-20 flex flex-col items-center justify-center text-center space-y-6 shadow-depth2">
                            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 border border-white/5">
                                <Play className="w-10 h-10 text-white/20" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black uppercase tracking-widest">No Active Links</h3>
                                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Start a new series to initialise continuity.</p>
                            </div>
                        </div>
                    </div>
                )}
            </PageContent>
        </PageWrapper>
    );
};

export default Continue;
import { cn } from "@/lib/utils";
