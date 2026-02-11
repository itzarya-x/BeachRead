import { MediaRowCard } from "@/components/home/MediaRowCard";
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
                <div className="h-10 w-48 bg-surface-2 rounded-lg animate-pulse mb-8" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="aspect-[2/3] bg-surface-2 rounded-xl animate-pulse" />
                    ))}
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <PageHeader 
                title="Continue Exploration" 
                subtitle={`You have ${currentItems.length} active journeys in progress`}
                icon={Play}
            />
            <PageContent>
                {currentItems.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {currentItems.map((item, i) => (
                            <MediaRowCard key={`${item.mediaType}-${item._seriesId}`} media={item} index={i} className="w-full" />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-surface-2 flex items-center justify-center">
                            <Play className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">Nothing in progress</h3>
                            <p className="text-muted-foreground">Start a new series to see it here.</p>
                        </div>
                    </div>
                )}
            </PageContent>
        </PageWrapper>
    );
};

export default Continue;
