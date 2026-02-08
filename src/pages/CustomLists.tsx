import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { MediaGrid } from "@/components/media/MediaGrid";
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
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const entries = getCustomListEntries(activeList, activeType);

    return (
        <PageWrapper>
            <PageHeader title="Custom Lists" subtitle={`${allLists.length} lists created`} />
            <PageContent>
                {allLists.length === 0 ? (
                    <p className="text-muted-foreground">No custom lists configured.</p>
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
