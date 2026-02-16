/**
 * REBUILT Tier Maker Experience
 * Architecture: Vertical board, horizontal scroll rows, Supabase-backed.
 */

import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { TierToolbar } from "@/components/tier/v2/TierToolbar";
import { TierRow } from "@/components/tier/v2/TierRow";
import { UntieredPool } from "@/components/tier/v2/UntieredPool";
import { TierEditModal } from "@/components/tier/v2/TierEditModal";
import { BulkMoveModal } from "@/components/tier/v2/BulkMoveModal";
import { FilterPanel } from "@/components/tier/FilterPanel";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { useData } from "@/context/DataContext";
import {
    createTier,
    deleteTier,
    getTierItems,
    getTiers,
    getSupabaseSession,
    moveMediaToTier,
    reorderItemsInTier,
    supabase,
    updateTier,
} from "@/lib/supabase-client";
import type { Tier, TierAssignment } from "@/lib/tierDatabase";
import { useMediaStore } from "@/store/mediaStore";
import type { DisplayMedia } from "@/types/display";
import { safeArray } from "@/utils/safeArray";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    useSensor,
    useSensors,
    DragStartEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
} from "@dnd-kit/sortable";
import { Plus, Trophy } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { TierMediaCard } from "@/components/tier/v2/TierMediaCard";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";

const CLOUD_BOARD_ID = "cloud";

export default function TierMaker() {
    const { user, loading: dataLoading } = useData();
    const { animeList, mangaList } = useMediaStore();
    const boardRef = useRef<HTMLDivElement>(null);

    // State
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [assignments, setAssignments] = useState<TierAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState<string | number | null>(null);
    
    // Modal State
    const [editingTier, setEditingTier] = useState<Tier | null>(null);
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
    const [isBulkMoveOpen, setIsBulkMoveOpen] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // Filters
    const [filters, setFilters] = useState<{
        mediaType: "all" | "anime" | "manga" | "manhua" | "manhwa";
        genres: string[];
        minScore: number;
        maxScore: number;
        status: string[];
    }>({
        mediaType: "all",
        genres: [],
        minScore: 0,
        maxScore: 100,
        status: [],
    });

    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 10 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    );

    const allLibraryMedia = useMemo(() => {
        return [...safeArray<DisplayMedia>(animeList), ...safeArray<DisplayMedia>(mangaList)];
    }, [animeList, mangaList]);

    const refreshBoardData = useCallback(async () => {
        if (!user) {
            setTiers([]);
            setAssignments([]);
            setLoading(false);
            return;
        }

        // Safety check to prevent AuthSessionMissingError
        const session = await getSupabaseSession();
        if (!session) {
            setLoading(false);
            return;
        }

        try {
            const [tierRows, itemRows] = await Promise.all([
                getTiers(),
                getTierItems(),
            ]);

            const nextTiers: Tier[] = tierRows.map((row) => ({
                id: row.id,
                boardId: CLOUD_BOARD_ID,
                name: row.name,
                color: row.color,
                order: row.order,
            }));

            const nextAssignments: TierAssignment[] = itemRows.map((row) => ({
                boardId: CLOUD_BOARD_ID,
                mediaId: row.series_id,
                tierId: row.tier_id,
                position: row.position,
            }))
            .sort((a, b) => a.position - b.position);

            setTiers(nextTiers);
            setAssignments(nextAssignments);
        } catch (err) {
            console.error("[TierMaker] refresh failed", err);
            toast.error("Failed to synchronize vault data");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        refreshBoardData();
    }, [refreshBoardData]);

    // Realtime Sync
    useEffect(() => {
        if (!supabase || !user?.id) return;

        const channel = supabase
            .channel(`tier-maker-v2:${user.id}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "tiers", filter: `user_id=eq.${user.id}` }, refreshBoardData)
            .on("postgres_changes", { event: "*", schema: "public", table: "tier_items", filter: `user_id=eq.${user.id}` }, refreshBoardData)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, refreshBoardData]);

    // Derived Data
    const filteredLibraryMedia = useMemo(() => {
        let media = [...allLibraryMedia];
        if (filters.mediaType !== "all") {
            if (filters.mediaType === "anime") media = media.filter((m) => m.mediaType === "ANIME");
            else media = media.filter((m) => m.mediaType === "MANGA" && m.originType?.toLowerCase() === filters.mediaType);
        }
        if (filters.genres.length > 0) media = media.filter((m) => safeArray<string>(filters.genres).some((g) => safeArray<string>(m.genres).includes(g)));
        if (filters.minScore > 0 || filters.maxScore < 100) media = media.filter((m) => m.score >= filters.minScore && m.score <= filters.maxScore);
        if (filters.status.length > 0) media = media.filter((m) => safeArray<string>(filters.status).includes(m.status));
        return media;
    }, [allLibraryMedia, filters]);

    const sortedTiers = useMemo(() => [...tiers].sort((a, b) => a.order - b.order), [tiers]);

    const assignedMediaIds = useMemo(
        () => new Set(safeArray<TierAssignment>(assignments).map((a) => String(a.mediaId))),
        [assignments],
    );

    const unassignedMedia = useMemo(
        () => safeArray<DisplayMedia>(filteredLibraryMedia).filter((m) => !assignedMediaIds.has(String(m._entryId))),
        [filteredLibraryMedia, assignedMediaIds],
    );

    const getTierMedia = useCallback(
        (tierId: string | number | null) => {
            const tierAssignments = assignments
                .filter((a) => String(a.tierId) === String(tierId))
                .sort((a, b) => a.position - b.position);
            
            return tierAssignments
                .map((a) => filteredLibraryMedia.find((m) => String(m._entryId) === String(a.mediaId)))
                .filter(Boolean) as DisplayMedia[];
        },
        [assignments, filteredLibraryMedia],
    );

    // Handlers
    const handleAddTier = async () => {
        try {
            await createTier("NEW PROTOCOL", "#FD4B7E");
            toast.success("Tier initialized");
            // refreshBoardData will be called by realtime subscription
        } catch (err) {
            toast.error("Initialization failed");
        }
    };

    const handleSaveTierEdit = async (updates: Partial<Tier>) => {
        if (!editingTier) return;
        try {
            await updateTier(String(editingTier.id), updates);
            toast.success("Metadata updated");
        } catch (err) {
            toast.error("Update failed");
        }
    };

    const handleDeleteTier = async (tierId: string | number) => {
        try {
            await deleteTier(String(tierId));
            toast.success("Tier decommissioned");
        } catch (err) {
            toast.error("Decommission failed");
        }
    };

    const handleRemoveItem = async (mediaId: string | number) => {
        try {
            await moveMediaToTier(Number(mediaId), null, 0);
            toast.success("Subject relocated to pool");
        } catch (err) {
            toast.error("Relocation failed");
        }
    };

    const handleAutoSort = async () => {
        if (!confirm("Auto-sort completed items by score? This will override current positions.")) return;
        
        try {
            const completed = filteredLibraryMedia.filter(m => m.status === "COMPLETED" && m.score > 0);
            if (completed.length === 0) {
                toast.error("No eligible subjects for auto-sort");
                return;
            }

            for (const media of completed) {
                let targetTierIndex = 5;
                if (media.score >= 90) targetTierIndex = 0;
                else if (media.score >= 80) targetTierIndex = 1;
                else if (media.score >= 70) targetTierIndex = 2;
                else if (media.score >= 60) targetTierIndex = 3;
                else if (media.score >= 50) targetTierIndex = 4;

                const targetTier = sortedTiers[targetTierIndex] || sortedTiers[sortedTiers.length - 1];
                if (targetTier) {
                    await moveMediaToTier(Number(media._entryId), String(targetTier.id), 0, media.mediaType);
                }
            }
            toast.success("Auto-sort protocol complete");
        } catch (err) {
            toast.error("Auto-sort failed");
        }
    };

    const handleExportImage = async () => {
        if (!boardRef.current) return;
        const loadingToast = toast.loading("Capturing archive snapshot...");
        try {
            const canvas = await html2canvas(boardRef.current, {
                backgroundColor: "#0a0a0a",
                scale: 2,
                logging: false,
                useCORS: true,
            });
            const link = document.createElement("a");
            link.download = `yura-tier-snapshot-${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
            toast.dismiss(loadingToast);
            toast.success("Snapshot secured");
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error("Capture failed");
        }
    };

    // Bulk Handlers
    const toggleSelect = (id: string | number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleBulkMove = async (targetTierId: string | number | null) => {
        const loadingToast = toast.loading(`Transferring ${selectedIds.size} subjects...`);
        try {
            for (const id of Array.from(selectedIds)) {
                const media = allLibraryMedia.find(m => String(m._entryId) === String(id));
                await moveMediaToTier(Number(id), targetTierId ? String(targetTierId) : null, 0, media?.mediaType);
            }
            setSelectedIds(new Set());
            setIsBulkMode(false);
            toast.dismiss(loadingToast);
            toast.success("Mass relocation successful");
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error("Mass relocation failed");
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Relocate ${selectedIds.size} selected subjects back to untiered pool?`)) return;
        await handleBulkMove(null);
    };

    // DnD Handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string | number);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const draggedId = active.id as string | number;
        const overId = over.id as string | number;

        const activeAssignment = assignments.find(a => String(a.mediaId) === String(draggedId));
        const sourceTierId = activeAssignment?.tierId ?? null;

        let targetTierId: string | number | null = null;
        if (String(overId).startsWith("tier-")) {
            targetTierId = String(overId).replace("tier-", "");
        } else if (overId === "pool") {
            targetTierId = null;
        } else {
            const overAssignment = assignments.find(a => String(a.mediaId) === String(overId));
            targetTierId = overAssignment?.tierId ?? null;
        }

        // 1. REORDER IN SAME TIER
        if (String(sourceTierId) === String(targetTierId)) {
            if (targetTierId === null) return; // Pool reorder not supported yet

            const tierMedia = getTierMedia(targetTierId);
            const oldIndex = tierMedia.findIndex(m => String(m._entryId) === String(draggedId));
            const newIndex = tierMedia.findIndex(m => String(m._entryId) === String(overId));

            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                const newOrderMedia = arrayMove(tierMedia, oldIndex, newIndex);
                const newOrderIds = newOrderMedia.map(m => Number(m._entryId));

                // Optimistic UI
                setAssignments(prev => prev.map(a => {
                    if (String(a.tierId) === String(targetTierId)) {
                        const idx = newOrderIds.indexOf(Number(a.mediaId));
                        return { ...a, position: idx };
                    }
                    return a;
                }));

                try {
                    await reorderItemsInTier(String(targetTierId), newOrderIds);
                } catch (err) {
                    toast.error("Reorder synchronization failed");
                    refreshBoardData();
                }
            }
            return;
        }

        // 2. MOVE TO DIFFERENT TIER
        const draggedMedia = allLibraryMedia.find(m => String(m._entryId) === String(draggedId));
        if (!draggedMedia) return;

        try {
            // Optimistic UI
            setAssignments(prev => {
                const filtered = prev.filter(a => String(a.mediaId) !== String(draggedId));
                if (targetTierId === null) return filtered;
                return [...filtered, {
                    boardId: CLOUD_BOARD_ID,
                    mediaId: draggedId,
                    tierId: targetTierId,
                    position: 999 // Append
                }];
            });

            await moveMediaToTier(
                Number(draggedId), 
                targetTierId ? String(targetTierId) : null, 
                0, 
                draggedMedia.mediaType
            );
        } catch (err) {
            toast.error("Relocation protocol failed");
            refreshBoardData();
        }
    };

    const activeMedia = useMemo(() => allLibraryMedia.find((m) => String(m._entryId) === String(activeId)), [allLibraryMedia, activeId]);

    if (loading || dataLoading) {
        return (
            <PageWrapper className="p-6">
                <div className="space-y-8">
                    <GridSkeleton count={12} />
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <div className="page-container">
                <PageHeader
                    title="Tier Protocols"
                    subtitle="Classification & Ranking Interface"
                    icon={Trophy}
                />
            </div>

            <PageContent className="space-y-10 max-w-none px-0 pb-40">
                <div className="page-container space-y-8">
                    <TierToolbar 
                        onAddTier={handleAddTier}
                        onAutoSort={handleAutoSort}
                        onToggleFilter={() => setShowFilters(!showFilters)}
                        onExportImage={handleExportImage}
                        isBulkMode={isBulkMode}
                        onToggleBulkMode={() => {
                            setIsBulkMode(!isBulkMode);
                            setSelectedIds(new Set());
                        }}
                        selectedCount={selectedIds.size}
                        onBulkMove={() => setIsBulkMoveOpen(true)}
                        onBulkDelete={handleBulkDelete}
                    />

                    {showFilters && (
                        <div className="animate-in slide-in-from-top-4 fade-in duration-300">
                            <FilterPanel 
                                filters={filters} 
                                onFiltersChange={setFilters} 
                                allMedia={allLibraryMedia} 
                            />
                        </div>
                    )}

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        {/* THE BOARD */}
                        <div ref={boardRef} className="space-y-6 max-w-full overflow-hidden">
                            {sortedTiers.map((tier) => (
                                <TierRow
                                    key={String(tier.id)}
                                    tier={tier}
                                    media={getTierMedia(tier.id!)}
                                    onEditTier={setEditingTier}
                                    onRemoveItem={handleRemoveItem}
                                    isBulkMode={isBulkMode}
                                    selectedIds={selectedIds}
                                    onToggleSelect={toggleSelect}
                                />
                            ))}
                        </div>

                        {/* POOL */}
                        <div className="mt-12 max-w-full overflow-hidden">
                            <UntieredPool 
                                media={unassignedMedia}
                                isBulkMode={isBulkMode}
                                selectedIds={selectedIds}
                                onToggleSelect={toggleSelect}
                            />
                        </div>

                        <DragOverlay>
                            {activeMedia ? <TierMediaCard media={activeMedia} id={activeMedia._entryId} overlay /> : null}
                        </DragOverlay>
                    </DndContext>
                </div>
            </PageContent>

            {/* Modals */}
            <TierEditModal 
                tier={editingTier}
                isOpen={!!editingTier}
                onClose={() => setEditingTier(null)}
                onSave={handleSaveTierEdit}
                onDelete={handleDeleteTier}
            />

            <BulkMoveModal 
                tiers={sortedTiers}
                isOpen={isBulkMoveOpen}
                onClose={() => setIsBulkMoveOpen(false)}
                onConfirm={handleBulkMove}
                selectedCount={selectedIds.size}
            />

            <FloatingActionButton 
                onClick={handleAddTier} 
                icon={Plus} 
                label="Initialize Tier" 
                className="md:hidden"
            />
        </PageWrapper>
    );
}
