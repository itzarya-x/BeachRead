/**
 * PHASE 5: Premium Tier Maker Experience
 */

import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { FilterPanel } from "@/components/tier/FilterPanel";
import { TierAnalytics } from "@/components/tier/TierAnalytics";
import { TierMediaItem } from "@/components/tier/TierMediaItem";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { Button, IconButton } from "@/components/ui/YuraButton";
import { useData } from "@/context/DataContext";
import { supabase } from "@/lib/supabase-client";
import {
    Tier,
    TierAssignment,
    TierBoard,
    createDefaultBoard,
    createTier,
    createTierBoard,
    deleteTier,
    deleteTierBoard,
    getAllTierBoards,
    getAssignmentsForBoard,
    getTiersForBoard,
    saveAssignment,
    updateTier,
    updateTierBoard,
} from "@/lib/tierDatabase";
import { useMediaStore } from "@/store/mediaStore";
import type { DisplayMedia } from "@/types/display";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DropAnimation,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    closestCenter,
    defaultDropAnimationSideEffects,
    useDroppable,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
    BarChart3,
    Check,
    Edit2,
    Filter,
    Plus,
    RotateCcw,
    Settings,
    Trash2,
    X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
};

export default function TierMaker() {
    const { user, loading: dataLoading } = useData();
    const { animeList, mangaList } = useMediaStore();
    
    // State
    const [boards, setBoards] = useState<TierBoard[]>([]);
    const [currentBoardId, setCurrentBoardId] = useState<string | number | null>(null);
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [assignments, setAssignments] = useState<TierAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState<string | number | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    
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
        useSensor(KeyboardSensor)
    );

    const [searchParams, setSearchParams] = useSearchParams();

    // Initial Load
    useEffect(() => {
        async function load() {
            try {
                const loadedBoards = await getAllTierBoards();
                if (loadedBoards.length === 0) {
                    const defaultId = await createDefaultBoard();
                    setBoards(await getAllTierBoards());
                    setSearchParams({ board: String(defaultId) });
                    setCurrentBoardId(defaultId);
                } else {
                    setBoards(loadedBoards);
                    const paramId = searchParams.get("board");
                    if (paramId) {
                        const found = loadedBoards.find(b => String(b.id) === paramId);
                        setCurrentBoardId(found ? found.id! : loadedBoards[0].id!);
                    } else {
                        setCurrentBoardId(loadedBoards[0].id!);
                    }
                }
            } catch (err) {
                console.error("Failed to load boards:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // Update URL when board changes
    useEffect(() => {
        if (currentBoardId) {
            setSearchParams({ board: String(currentBoardId) });
        }
    }, [currentBoardId, setSearchParams]);

    // Board Data Load
    const refreshBoardData = useCallback(async () => {
        if (!currentBoardId) return;
        try {
            const [t, a] = await Promise.all([
                getTiersForBoard(currentBoardId),
                getAssignmentsForBoard(currentBoardId),
            ]);
            setTiers(t);
            setAssignments(a);
        } catch (err) {
            console.error("Failed to load board data:", err);
        }
    }, [currentBoardId]);

    useEffect(() => {
        refreshBoardData();
    }, [refreshBoardData]);

    // Realtime Sync
    useEffect(() => {
        if (!currentBoardId || !supabase || !user) return;
        const channel = supabase
            .channel(`tier_assignments:${currentBoardId}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "tier_assignments", filter: `board_id=eq.${currentBoardId}` }, refreshBoardData)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [currentBoardId, user, refreshBoardData]);

    // Derived Data
    const allMedia = useMemo(() => {
        let media = [...animeList, ...mangaList];
        if (filters.mediaType !== "all") {
             if (filters.mediaType === "anime") media = media.filter(m => m.mediaType === "ANIME");
             else media = media.filter(m => m.mediaType === "MANGA" && m.originType?.toLowerCase() === filters.mediaType);
        }
        if (filters.genres.length > 0) media = media.filter(m => filters.genres.some(g => m.genres.includes(g)));
        if (filters.minScore > 0 || filters.maxScore < 100) media = media.filter(m => m.score >= filters.minScore && m.score <= filters.maxScore);
        if (filters.status.length > 0) media = media.filter(m => filters.status.includes(m.status));
        return media;
    }, [animeList, mangaList, filters]);

    const assignedMediaIds = useMemo(() => new Set(assignments.map(a => a.mediaId)), [assignments]);
    const unassignedMedia = useMemo(() => allMedia.filter(m => !assignedMediaIds.has(m._entryId)), [allMedia, assignedMediaIds]);

    // Logic: Auto Assign
    const handleAutoAssign = async () => {
        if (!currentBoardId || !confirm("Auto-assign based on scores? This will reset current assignments.")) return;
        
        const sortedTiers = [...tiers].sort((a, b) => a.order - b.order);
        if (sortedTiers.length < 5) {
            alert("Need at least 5 tiers for auto-assign (S, A, B, C, D/F)");
            return;
        }
        
        for (const media of allMedia) {
            if (media.score === 0 || media.status !== "COMPLETED") continue;
            
            let tierIndex = 5; // Default F
            if (media.score >= 90) tierIndex = 0;
            else if (media.score >= 80) tierIndex = 1;
            else if (media.score >= 70) tierIndex = 2;
            else if (media.score >= 60) tierIndex = 3;
            else if (media.score >= 50) tierIndex = 4;
            
            if (tierIndex >= sortedTiers.length) tierIndex = sortedTiers.length - 1;
            
            const tier = sortedTiers[tierIndex];
            if (tier) {
                await saveAssignment({
                    boardId: currentBoardId,
                    mediaId: media._entryId,
                    tierId: tier.id!,
                    position: 0, 
                });
            }
        }
        refreshBoardData();
    };

    // Logic: Drag End
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over || !currentBoardId) return;

        const activeId = active.id as number;
        const overId = over.id;

        if (activeId === overId) return;

        // Find current assignment
        const activeAssignment = assignments.find(a => a.mediaId === activeId);
        const sourceTierId = activeAssignment?.tierId ?? null; 

        // Determine Target Tier
        let targetTierId: string | number | null = null;
        if (String(overId).startsWith("tier-")) {
            const tId = String(overId).replace("tier-", "");
            targetTierId = isNaN(Number(tId)) ? tId : Number(tId);
        } else if (overId === "pool") {
            targetTierId = null;
        } else {
            // Dropped on another item
            const overAssignment = assignments.find(a => a.mediaId === overId);
            if (overAssignment) targetTierId = overAssignment.tierId;
            else targetTierId = null; // Unassigned pool item
        }

        // 1. Reordering within same tier
        if (sourceTierId === targetTierId) {
            const tierAssignments = assignments
                .filter(a => a.boardId === currentBoardId && a.tierId === targetTierId)
                .sort((a, b) => a.position - b.position);
            
            const oldIndex = tierAssignments.findIndex(a => a.mediaId === activeId);
            const newIndex = tierAssignments.findIndex(a => a.mediaId === overId);

            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                // Determine new order locally
                const newOrder = arrayMove(tierAssignments, oldIndex, newIndex);
                
                // Update DB with new positions
                await Promise.all(newOrder.map((a, idx) => 
                     saveAssignment({ ...a, position: idx })
                ));
            }
        } 
        // 2. Moving to different tier
        else {
            const targetTierAssignments = assignments
                .filter(a => a.boardId === currentBoardId && a.tierId === targetTierId)
                .sort((a, b) => a.position - b.position);

            let newPosition = targetTierAssignments.length;
            if (!String(overId).startsWith("tier-") && overId !== "pool") {
                 const overIndex = targetTierAssignments.findIndex(a => a.mediaId === overId);
                 if (overIndex !== -1) newPosition = overIndex;
            }
            
             await saveAssignment({
                boardId: currentBoardId,
                mediaId: activeId,
                tierId: targetTierId,
                position: Date.now(), // Fallback for sort
            });
        }
        
        refreshBoardData();
    };

    // Board Actions
    const handleCreateBoard = async () => {
        const name = prompt("Board name:");
        if (name) {
            const id = await createTierBoard({ name, description: "" });
            setBoards(await getAllTierBoards());
            setCurrentBoardId(id);
        }
    };

    const handleRenameBoard = async () => {
        const board = boards.find(b => b.id === currentBoardId);
        if (!board) return;
        const name = prompt("New name:", board.name);
        if (name) {
            await updateTierBoard(board.id!, { name });
            setBoards(await getAllTierBoards());
        }
    };
    
    const handleDeleteBoard = async () => {
        if (confirm("Delete this board?")) {
            await deleteTierBoard(currentBoardId!);
            const newBoards = await getAllTierBoards();
            setBoards(newBoards);
            setCurrentBoardId(newBoards[0]?.id || null);
        }
    };

    const activeMedia = useMemo(() => allMedia.find(m => m._entryId === activeId), [allMedia, activeId]);
    const currentBoard = boards.find(b => b.id === currentBoardId);

    if (loading || dataLoading) {
        return (
            <PageWrapper className="p-6">
                <div className="space-y-8">
                    <div className="h-10 w-64 bg-surface-2 rounded-lg animate-pulse" />
                    <GridSkeleton count={12} />
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <PageHeader 
                title={currentBoard?.name || "Tier Maker"} 
                subtitle="Rank your collection" 
                action={
                    <div className="flex items-center gap-2">
                         <select 
                            className="bg-secondary text-sm rounded-lg px-3 py-1.5 border-none outline-none cursor-pointer hover:bg-secondary/80 transition-colors"
                            value={currentBoardId || ""}
                            onChange={(e) => setCurrentBoardId(Number(e.target.value) || e.target.value)}
                         >
                            {boards.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                         </select>
                         <IconButton onClick={handleCreateBoard} icon={Plus} label="New Board" size="sm" />
                         <IconButton onClick={handleRenameBoard} icon={Edit2} label="Rename Board" size="sm" />
                         <IconButton onClick={handleDeleteBoard} icon={Trash2} label="Delete Board" size="sm" variant="destructive" className="bg-destructive/5 hover:bg-destructive/10" />
                    </div>
                }
            />
            
            <PageContent className="space-y-6">
                <DndContext 
                    sensors={sensors} 
                    collisionDetection={closestCenter} 
                    onDragStart={(e) => setActiveId(e.active.id as number)} 
                    onDragEnd={handleDragEnd}
                >
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-3 mb-6 p-1">
                        <Button 
                            onClick={handleAutoAssign}
                            variant="outline"
                            icon={RotateCcw}
                            className="bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                        >
                            Auto Rank
                        </Button>
                        <Button 
                            onClick={() => setShowAnalytics(!showAnalytics)}
                            variant={showAnalytics ? "primary" : "secondary"}
                            icon={BarChart3}
                        >
                            Analytics
                        </Button>
                        <Button 
                            onClick={() => setShowFilters(!showFilters)}
                            variant={showFilters ? "primary" : "secondary"}
                            icon={Filter}
                        >
                            Filter
                        </Button>
                    </div>

                    {showFilters && (
                        <div className="mb-6 animate-in slide-in-from-top-2">
                            <FilterPanel filters={filters} onFiltersChange={setFilters} allMedia={allMedia} />
                        </div>
                    )}

                    {showAnalytics && tiers.length > 0 && (
                        <div className="mb-6 animate-in slide-in-from-top-2">
                             <TierAnalytics tiers={tiers} assignments={assignments} allMedia={allMedia} />
                        </div>
                    )}

                    {/* Tier Rows */}
                    <div className="space-y-4">
                        {tiers.map(tier => {
                            // Filter and SORT assignments for this tier
                            const tierAssignments = assignments
                                .filter(a => a.tierId === tier.id)
                                .sort((a, b) => a.position - b.position);
                                
                            const tierMedia = tierAssignments
                                .map(a => allMedia.find(m => m._entryId === a.mediaId))
                                .filter(Boolean) as DisplayMedia[];

                            return (
                                <TierRow 
                                    key={tier.id} 
                                    tier={tier} 
                                    media={tierMedia}
                                    onUpdate={refreshBoardData}
                                />
                            );
                        })}
                        
                        <button 
                            onClick={async () => {
                                await createTier({ boardId: currentBoardId!, name: "New Tier", color: "#808080", order: tiers.length });
                                refreshBoardData();
                            }}
                            className="w-full py-3 border-2 border-dashed border-border/50 rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Add Tier
                        </button>
                    </div>

                    {/* Unassigned Pool */}
                    <div className="mt-12">
                        <div className="flex items-center justify-between mb-4">
                             <h3 className="text-xl font-bold flex items-center gap-2">
                                Unassigned <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{unassignedMedia.length}</span>
                             </h3>
                        </div>
                        <UnassignedPool media={unassignedMedia} id="pool" />
                    </div>

                    {/* Drag Overlay */}
                    <DragOverlay dropAnimation={dropAnimation}>
                        {activeMedia ? <TierMediaItem media={activeMedia} id={activeMedia._entryId} overlay /> : null}
                    </DragOverlay>
                </DndContext>
            </PageContent>
        </PageWrapper>
    );
}

// Sub-components

function TierRow({ tier, media, onUpdate }: { tier: Tier; media: DisplayMedia[]; onUpdate: () => void }) {
    const { setNodeRef } = useDroppable({ id: `tier-${tier.id}` });
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(tier.name);
    const [color, setColor] = useState(tier.color);

    const handleSave = async () => {
        await updateTier(tier.id!, { name, color });
        setIsEditing(false);
        onUpdate();
    };

    const handleDelete = async () => {
        if (confirm("Delete tier? Items will be unassigned.")) {
            await deleteTier(tier.id!);
            onUpdate();
        }
    };

    return (
        <div ref={setNodeRef} className="flex flex-col md:flex-row rounded-xl overflow-hidden bg-card border border-border/50 shadow-sm min-h-[120px]">
            {/* Header/Label */}
            <div 
                className="w-full md:w-32 flex flex-col items-center justify-center p-4 gap-2 relative group"
                style={{ backgroundColor: `${color}15`, borderRight: `4px solid ${color}` }}
            >
                {isEditing ? (
                    <div className="flex flex-col gap-2 w-full">
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full text-center bg-background rounded border px-1 py-0.5 text-sm" autoFocus />
                        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-6 cursor-pointer" />
                        <div className="flex gap-1 justify-center">
                            <IconButton onClick={handleSave} icon={Check} label="Save" size="sm" variant="primary" />
                            <IconButton onClick={() => setIsEditing(false)} icon={X} label="Cancel" size="sm" variant="secondary" />
                        </div>
                    </div>
                ) : (
                    <>
                        <h3 className="text-xl font-black text-center break-words leading-tight" style={{ color }}>{tier.name}</h3>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 right-1 md:static">
                            <IconButton onClick={() => setIsEditing(true)} icon={Settings} label="Edit Tier" size="sm" />
                            <IconButton onClick={handleDelete} icon={Trash2} label="Delete Tier" size="sm" />
                        </div>
                    </>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 p-3 bg-surface-1/50 flex flex-wrap gap-2 content-start">
                <SortableContext items={media.map(m => m._entryId)} strategy={rectSortingStrategy}>
                    {media.map(m => (
                        <TierMediaItem key={m._entryId} id={m._entryId} media={m} compact />
                    ))}
                </SortableContext>
                {media.length === 0 && (
                    <div className="w-full h-full min-h-[80px] flex items-center justify-center text-muted-foreground/20 text-sm font-medium italic border-2 border-dashed border-border/20 rounded-lg">
                        Drop items here
                    </div>
                )}
            </div>
        </div>
    );
}

function UnassignedPool({ media, id }: { media: DisplayMedia[]; id: string }) {
    const { setNodeRef } = useDroppable({ id });
    
    return (
        <div ref={setNodeRef} className="bg-surface-1/30 rounded-xl p-4 border border-border/30 min-h-[200px]">
            <SortableContext items={media.map(m => m._entryId)} strategy={rectSortingStrategy}>
                <div className="flex flex-wrap gap-3">
                    {media.map(m => (
                        <TierMediaItem key={m._entryId} id={m._entryId} media={m} />
                    ))}
                    {media.length === 0 && (
                        <div className="w-full py-10 text-center text-muted-foreground">
                            All items ranked! 🎉
                        </div>
                    )}
                </div>
            </SortableContext>
        </div>
    );
}
