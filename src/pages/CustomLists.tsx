import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { AutoBento } from "@/components/layout/AutoBento";
import { MediaListView } from "@/components/library/MediaListView";
import { ViewSwitcher } from "@/components/library/ViewSwitcher";
import * as EmptyStates from "@/components/ui/EmptyState";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { useData } from "@/context/DataContext";
import { useLibraryView } from "@/hooks/useLibraryView";
import { cn } from "@/lib/utils";
import { useState } from "react";

const CustomLists = () => {
    const { user, getCustomListEntries, loading } = useData();
    const { viewMode, updateViewMode } = useLibraryView();
    
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
            <div className="page-container">
                <PageHeader 
                    title="Custom Lists" 
                    subtitle={`${allLists.length} lists created`}
                    action={
                        <ViewSwitcher 
                            currentMode={viewMode} 
                            onModeChange={updateViewMode} 
                        />
                    }
                />
            </div>
            <PageContent className="max-w-none px-0 space-y-10">
                {allLists.length === 0 ? (
                    <div className="page-container">
                        <EmptyStates.EmptyCustomList />
                    </div>
                ) : (
                    <>
                        <AutoBento maxWidth={1500} minTileWidth={400}>
                            <div className="bento-span-2 sakura-glass p-6 flex flex-col justify-center shadow-depth1">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">Collection Index</h3>
                                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                    {allLists.map(list => (
                                        <button
                                            key={list.name}
                                            onClick={() => setActiveList(list.name)}
                                            className={cn(
                                                "px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap border",
                                                activeList === list.name
                                                    ? "text-primary bg-primary/10 border-primary/30 shadow-glow"
                                                    : "text-white/20 border-white/5 hover:text-white/50 hover:bg-white/5",
                                            )}
                                        >
                                            {list.name}
                                            <span className="ml-2 opacity-30">
                                                {list.type}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="sakura-glass p-6 flex flex-col justify-center text-center shadow-depth1">
                                <p className="text-3xl font-black text-foreground tabular-nums">{entries.length}</p>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mt-1">Mapped Fragments</p>
                            </div>
                        </AutoBento>

                        <div className="w-full">
                            <MediaListView items={entries} viewMode={viewMode} />
                        </div>
                    </>
                )}
            </PageContent>
        </PageWrapper>
    );
};

export default CustomLists;
