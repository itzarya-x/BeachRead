import { MediaRowCard } from "@/components/home/MediaRowCard";
import { AutoBento } from "@/components/layout/AutoBento";
import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { useData } from "@/context/DataContext";
import type { DisplayMedia } from "@/types/display";
import { safeArray } from "@/utils/safeArray";
import { Play } from "lucide-react";
import { useMemo } from "react";

const Continue = () => {
    const { animeList, mangaList, loading } = useData();

    const currentItems = useMemo(() => {
        const all = [
            ...safeArray<DisplayMedia>(animeList), 
            ...safeArray<DisplayMedia>(mangaList)
        ];
        return all
            .filter(item => item.status === "CURRENT")
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [animeList, mangaList]);

    if (loading) {
        return (
            <PageWrapper className="p-6">
                <div className="mb-8 h-10 w-48 animate-pulse rounded-lg bg-muted" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-muted" />
                    ))}
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <div className="page-container">
                <PageHeader 
                    title="Neural Continuity" 
                    subtitle={`Establishing ${currentItems.length} active sessions`}
                    icon={Play}
                />
            </div>
            <PageContent className="max-w-none px-0">
                {currentItems.length > 0 ? (
                    <AutoBento maxWidth={1500} minTileWidth={240}>
                        {currentItems.map((item, i) => (
                            <MediaRowCard key={`${item.mediaType}-${item._seriesId}`} media={item} index={i} className="w-full" />
                        ))}
                    </AutoBento>
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
