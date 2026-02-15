import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ActivityHeatmap } from "@/components/profile/ActivityHeatmap";
import { useData } from "@/context/DataContext";
import type { DisplayMedia } from "@/types/display";
import { safeArray } from "@/utils/safeArray";
import { History } from "lucide-react";

const Activity = () => {
    const { user, loading, animeList, mangaList, getTitle } = useData();

    if (loading || !user) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Build a recent activity feed from list entries sorted by updatedAt
    const allEntries = [
        ...safeArray<DisplayMedia>(animeList), 
        ...safeArray<DisplayMedia>(mangaList)
    ]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 50);

    return (
        <PageWrapper>
            <PageHeader title="Activity" subtitle="Recent updates from your reading and watching flow" icon={History} />
            <PageContent className="space-y-8">
                <ActivityHeatmap />

                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <h3 className="border-b border-border p-4 text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
                        Recent Updates
                    </h3>
                    <div className="divide-y divide-border">
                        {allEntries.map((entry, idx) => (
                            <div
                                key={`${entry._seriesId}-${idx}`}
                                className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50"
                            >
                                {entry.coverImage && (
                                    <img
                                        src={entry.coverImage}
                                        alt=""
                                        className="h-11 w-8 shrink-0 rounded-sm object-cover"
                                        loading="lazy"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="line-clamp-1 text-sm font-semibold text-foreground">
                                        {getTitle(entry)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {entry.status} · Progress: {entry.progress} · {entry.mediaType}
                                    </p>
                                </div>
                                <span className="shrink-0 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                                    {new Date(entry.updatedAt).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </PageContent>
        </PageWrapper>
    );
};

export default Activity;
