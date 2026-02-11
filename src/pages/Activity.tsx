import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { ActivityHeatmap } from "@/components/profile/ActivityHeatmap";
import { useData } from "@/context/DataContext";

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
    const allEntries = [...animeList, ...mangaList]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 50);

    return (
        <PageWrapper>
            <PageHeader title="Activity" subtitle="Your viewing and reading history" />
            <PageContent className="space-y-6">
                <ActivityHeatmap />

                <div className="bg-card rounded-lg border border-border/50">
                    <h3 className="text-sm font-medium text-foreground p-4 border-b border-border/50">
                        Recent Updates
                    </h3>
                    <div className="divide-y divide-border/30">
                        {allEntries.map((entry, idx) => (
                            <div
                                key={`${entry._seriesId}-${idx}`}
                                className="p-3 flex items-center gap-3 hover:bg-secondary/30 transition-colors"
                            >
                                {entry.coverImage && (
                                    <img
                                        src={entry.coverImage}
                                        alt=""
                                        className="w-8 h-11 object-cover rounded-sm shrink-0"
                                        loading="lazy"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground font-medium line-clamp-1">
                                        {getTitle(entry)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {entry.status} · Progress: {entry.progress} · {entry.mediaType}
                                    </p>
                                </div>
                                <span className="text-xs text-muted-foreground shrink-0">
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
