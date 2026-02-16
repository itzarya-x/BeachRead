import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { AddMediaModal } from "@/components/media/AddMediaModal";
import { AdvancedFilterPanel } from "@/components/media/AdvancedFilterPanel";
import { MediaGrid } from "@/components/media/MediaGrid";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/YuraButton";
import { useData } from "@/context/DataContext";
import { useMediaFilters } from "@/hooks/useMediaFilters";
import { applyFilters } from "@/lib/media-filters";
import { BookOpen, Plus } from "lucide-react";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const MangaList = () => {
    const { mangaList, loading } = useData();
    const [showAddModal, setShowAddModal] = useState(false);
    const navigate = useNavigate();

    // NEW FILTER SYSTEM
    const { filters, updateFilters, resetFilters } = useMediaFilters();

    const filtered = useMemo(() => {
        return applyFilters(mangaList, filters, "MANGA");
    }, [mangaList, filters]);

    if (loading) {
        return (
            <PageWrapper className="p-6">
                <div className="flex justify-between items-center mb-8">
                    <div className="h-10 w-48 rounded-lg bg-muted animate-pulse" />
                    <div className="h-10 w-32 rounded-lg bg-muted animate-pulse" />
                </div>
                <GridSkeleton count={12} />
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <div className="page-container">
                <PageHeader 
                    title="Graphic Library" 
                    subtitle={`${filtered.length} matching volumes (${mangaList.length} total)`} 
                    icon={BookOpen}
                />
            </div>

            {/* Mobile Segmented Control */}
            <div className="md:hidden px-4 mb-6">
                <div className="flex p-1 rounded-2xl bg-white/5 border border-white/5">
                    <button 
                        onClick={() => navigate('/anime')}
                        className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white/70 transition-colors"
                    >
                        Anime
                    </button>
                    <button 
                        onClick={() => navigate('/manga')}
                        className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary text-primary-foreground shadow-glow-sm"
                    >
                        Manga
                    </button>
                </div>
            </div>

            <PageContent className="animate-fade-in max-w-none px-0 space-y-8">
                {/* 1. Toolbar area */}
                <div className="page-container">
                    <div className="sakura-glass p-5 toolbar shadow-depth1 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <AdvancedFilterPanel 
                              type="MANGA" 
                              filters={filters} 
                              updateFilters={updateFilters} 
                              resetFilters={resetFilters} 
                            />
                        </div>

                        <Button
                            onClick={() => setShowAddModal(true)}
                            icon={Plus}
                            className="h-12 rounded-2xl px-8 shadow-glow"
                        >
                            Add Entry
                        </Button>
                    </div>
                </div>

                {/* 3. Media Grid (Content Zone) */}
                <div className="w-full">
                    <MediaGrid items={filtered} emptyMessage="No manga match your filters" />
                </div>
            </PageContent>
            {showAddModal && (
                <AddMediaModal
                    mediaType="MANGA"
                    onClose={() => setShowAddModal(false)}
                />
            )}
        </PageWrapper>
    );
};

export default MangaList;
