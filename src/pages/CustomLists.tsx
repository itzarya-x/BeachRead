import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { MediaGrid } from "@/components/media/MediaGrid";
import * as EmptyStates from "@/components/ui/EmptyState";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import { useState } from "react";

const CustomLists = () => {
    const { user, getCustomListEntries, loading } = useData();
    const allLists = [
        ...(user?.customListNames.anime || []).map(n => ({ name: n, type: "ANIME" as const })),
        ...(user?.customListNames.manga || []).map(n => ({ name: n, type: "MANGA" as const })),
    ];
    const [activeList, setActiveList] = useState(allLists[0]?.name || "");
    const activeType = allLists.find(l => l.name === activeList)?.type || "MANGA";

    if (loading) {
        return (
            <PageWrapper className="p-6">
                <div className="h-10 w-48 bg-surface-2 rounded-lg animate-pulse mb-8" />
                <GridSkeleton count={12} />
            </PageWrapper>
        );
    }

    const entries = getCustomListEntries(activeList, activeType);

    return (
        <PageWrapper>
            <PageHeader title="Custom Lists" subtitle={`${allLists.length} lists created`} />
            <PageContent>
                {allLists.length === 0 ? (
                    <EmptyStates.EmptyCustomList />
                ) : (
                    <>
                        <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-4">
                            {allLists.map(list => (
                                <button
                                    key={list.name}
                                    onClick={() => setActiveList(list.name)}
                                    className={cn(
                                        "px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                                        activeList === list.name
                                            ? "text-primary bg-primary/10"
                                            : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                                    )}
                                >
                                    {list.name}
                                    <span className="ml-1.5 text-xs opacity-60">
                                        ({list.type === "ANIME" ? "A" : "M"})
                                    </span>
                                </button>
                            ))}
                        </div>

                        <p className="text-sm text-muted-foreground mb-4">{entries.length} entries</p>
                        <MediaGrid items={entries} emptyMessage="No entries in this custom list" />
                    </>
                )}
            </PageContent>
        </PageWrapper>
    );
};

export default CustomLists;
