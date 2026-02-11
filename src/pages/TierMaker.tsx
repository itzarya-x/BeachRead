/**
 * PHASE 2-12: Complete TierMaker System
 *
 * Powerful, persistent, multi-board tier ranking system
 */

import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { FilterPanel } from "@/components/tier/FilterPanel";
import { SmartTools } from "@/components/tier/SmartTools";
import { TierAnalytics } from "@/components/tier/TierAnalytics";
import { useData } from "@/context/DataContext";
import {
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
    type Tier,
    type TierAssignment,
    type TierBoard,
} from "@/lib/tierDatabase";
import { useMediaStore } from "@/store/mediaStore";
import type { DisplayMedia } from "@/types/display";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    closestCenter,
    useDroppable,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, horizontalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    ArrowDown,
    ArrowUp,
    Copy,
    Download,
    Edit2,
    Filter,
    Plus,
    Settings,
    SortDesc,
    Trash2,
    Type,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

export default function TierMaker() {
    const { user, loading: dataLoading } = useData();
    const { animeList, mangaList } = useMediaStore();
    const [boards, setBoards] = useState<TierBoard[]>([]);
    const [currentBoardId, setCurrentBoardId] = useState<string | number | null>(null);
    const [tiers, setTiers] = useState<Tier[]>([]);
    const [assignments, setAssignments] = useState<TierAssignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState<string | number | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [showRankings, setShowRankings] = useState(true);
    const [autoScroll, setAutoScroll] = useState(false);
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

    const refreshAssignments = useCallback(async () => {
        if (!currentBoardId) return;
        const updated = await getAssignmentsForBoard(currentBoardId);
        setAssignments(updated);
    }, [currentBoardId]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
    );

    // Load boards on mount
    useEffect(() => {
        async function load() {
            try {
                const loadedBoards = await getAllTierBoards();
                if (loadedBoards.length === 0) {
                    // Create default board
                    const defaultId = await createDefaultBoard();
                    const newBoards = await getAllTierBoards();
                    setBoards(newBoards);
                    setCurrentBoardId(defaultId);
                } else {
                    setBoards(loadedBoards);
                    setCurrentBoardId(loadedBoards[0].id!);
                }
            } catch (err) {
                console.error("Failed to load tier boards:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    // Load tiers and assignments when board changes
    useEffect(() => {
        if (!currentBoardId) return;

        async function load() {
            try {
                const [loadedTiers, loadedAssignments] = await Promise.all([
                    getTiersForBoard(currentBoardId),
                    getAssignmentsForBoard(currentBoardId),
                ]);
                setTiers(loadedTiers);
                setAssignments(loadedAssignments);
            } catch (err) {
                console.error("Failed to load tier data:", err);
            }
        }
        load();
    }, [currentBoardId]);

    // Get all media (filtered)
    const allMedia = useMemo(() => {
        let media = [...animeList, ...mangaList];

        if (filters.mediaType !== "all") {
            if (filters.mediaType === "anime") {
                media = media.filter(m => m.mediaType === "ANIME");
            } else if (filters.mediaType === "manga") {
                media = media.filter(m => m.mediaType === "MANGA" && m.originType === "manga");
            } else if (filters.mediaType === "manhua") {
                media = media.filter(m => m.mediaType === "MANGA" && m.originType === "manhua");
            } else if (filters.mediaType === "manhwa") {
                media = media.filter(m => m.mediaType === "MANGA" && m.originType === "manhwa");
            }
        }

        if (filters.genres.length > 0) {
            media = media.filter(m => filters.genres.some(g => m.genres.includes(g)));
        }

        if (filters.minScore > 0 || filters.maxScore < 100) {
            media = media.filter(m => m.score >= filters.minScore && m.score <= filters.maxScore);
        }

        if (filters.status.length > 0) {
            media = media.filter(m => filters.status.includes(m.status));
        }

        return media;
    }, [animeList, mangaList, filters]);

    // Get assigned media IDs
    const assignedMediaIds = useMemo(() => {
        return new Set<string | number>(assignments.map(a => a.mediaId));
    }, [assignments]);

    // Get unassigned pool (media not in any tier)
    const unassignedMedia = useMemo(() => {
        return allMedia.filter(m => !assignedMediaIds.has(m._entryId));
    }, [allMedia, assignedMediaIds]);

    // Get media for each tier
    const getMediaForTier = useCallback(
        (tierId: string | number | null) => {
            const tierAssignments = assignments
                .filter(a => a.tierId === tierId)
                .sort((a, b) => a.position - b.position);

            return tierAssignments
                .map(assignment => {
                    return allMedia.find(m => m._entryId === assignment.mediaId);
                })
                .filter(Boolean) as DisplayMedia[];
        },
        [assignments, allMedia],
    );

    // Handle drag end (PHASE 3.1 & 3.2: Auto-save with position handling)
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || !currentBoardId) {
            setActiveId(null);
            return;
        }

        const activeId = active.id as string | number;
        const overId = String(over.id);

        // Find the media being dragged
        const draggedMedia = allMedia.find(m => m._entryId === activeId);
        if (!draggedMedia) {
            setActiveId(null);
            return;
        }

        // Determine target tier
        let targetTierId: string | number | null = null;
        let insertIndex: number | undefined = undefined;

        if (overId.startsWith("tier-")) {
            const rawId = overId.replace("tier-", "");
            targetTierId = isNaN(Number(rawId)) ? rawId : parseInt(rawId);
        } else if (overId === "pool" || overId.startsWith("pool-")) {
            targetTierId = null; // Unassigned pool
        } else {
            // Dropped on another media item - find its tier and position
            const targetMediaId = isNaN(Number(overId)) ? overId : parseInt(overId);
            const targetAssignment = assignments.find(a => a.mediaId === targetMediaId && a.boardId === currentBoardId);
            if (targetAssignment) {
                targetTierId = targetAssignment.tierId;
                insertIndex = targetAssignment.position;
            } else {
                // Dropped on unassigned media
                targetTierId = null;
                insertIndex = assignments.find(
                    a => a.mediaId === targetMediaId && a.boardId === currentBoardId,
                )?.position;
            }
        }

        // Find existing assignment for this board
        const existingAssignment = assignments.find(a => a.mediaId === activeId && a.boardId === currentBoardId);

        // Get current tier assignments
        let tierAssignments = assignments.filter(
            a => a.tierId === targetTierId && a.boardId === currentBoardId && a.id !== existingAssignment?.id,
        );
        tierAssignments = tierAssignments.sort((a, b) => a.position - b.position);

        // Calculate insertion position (default to end)
        let newPosition = tierAssignments.length;
        if (insertIndex !== undefined && insertIndex <= tierAssignments.length) {
            newPosition = insertIndex;
            // Shift positions for items at and after insertion point
            for (let i = insertIndex; i < tierAssignments.length; i++) {
                await saveAssignment({
                    ...tierAssignments[i],
                    position: i + 1,
                });
            }
        }

        if (existingAssignment) {
            // Update existing assignment
            await saveAssignment({
                ...existingAssignment,
                tierId: targetTierId,
                position: newPosition,
            });
        } else {
            // Create new assignment
            await saveAssignment({
                boardId: currentBoardId,
                mediaId: activeId,
                tierId: targetTierId,
                position: newPosition,
            });
        }

        // Reload assignments
        const updatedAssignments = await getAssignmentsForBoard(currentBoardId);
        setAssignments(updatedAssignments);

        setActiveId(null);
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string | number);
    };

    // Create new board
    const handleCreateBoard = async () => {
        const name = prompt("Board name:");
        if (!name) return;

        try {
            const newId = await createTierBoard({
                name,
                description: "",
            });
            const newBoards = await getAllTierBoards();
            setBoards(newBoards);
            setCurrentBoardId(newId);
        } catch (err) {
            console.error("Failed to create board:", err);
        }
    };

    const handleRenameBoard = async () => {
        if (!currentBoardId) return;
        const currentBoard = boards.find(b => b.id === currentBoardId);
        if (!currentBoard) return;

        const newName = prompt("New board name:", currentBoard.name);
        if (!newName || newName === currentBoard.name) return;

        try {
            await updateTierBoard(currentBoardId, { name: newName });
            const newBoards = await getAllTierBoards();
            setBoards(newBoards);
        } catch (err) {
            console.error("Failed to rename board:", err);
        }
    };

    const handleDuplicateBoard = async () => {
        if (!currentBoardId) return;
        const currentBoard = boards.find(b => b.id === currentBoardId);
        if (!currentBoard) return;

        const newName = prompt("New board name:", `${currentBoard.name} (Copy)`);
        if (!newName) return;

        try {
            const newId = await createTierBoard({
                name: newName,
                description: currentBoard.description || "",
            });

            // Copy tiers from original board
            const tiersToCopy = await getTiersForBoard(currentBoardId);
            for (const tier of tiersToCopy) {
                const tierId = await createTier({
                    boardId: newId,
                    name: tier.name,
                    color: tier.color,
                    order: tier.order,
                });

                // Copy assignments
                const assignmentsToCopy = await getAssignmentsForBoard(currentBoardId);
                const tierAssignments = assignmentsToCopy.filter(a => a.tierId === tier.id);
                for (const assignment of tierAssignments) {
                    await saveAssignment({
                        boardId: newId,
                        mediaId: assignment.mediaId,
                        tierId: tierId,
                        position: assignment.position,
                    });
                }
            }

            const newBoards = await getAllTierBoards();
            setBoards(newBoards);
            setCurrentBoardId(newId);
        } catch (err) {
            console.error("Failed to duplicate board:", err);
        }
    };

    const handleDeleteBoard = async () => {
        if (!currentBoardId) return;
        if (!confirm("Are you sure you want to delete this board?")) return;

        try {
            await deleteTierBoard(currentBoardId);
            const newBoards = await getAllTierBoards();
            setBoards(newBoards);
            if (newBoards.length > 0) {
                setCurrentBoardId(newBoards[0].id!);
            } else {
                setCurrentBoardId(null);
            }
        } catch (err) {
            console.error("Failed to delete board:", err);
        }
    };

    if ((dataLoading || loading) && boards.length === 0) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const currentBoard = boards.find(b => b.id === currentBoardId);

    return (
        <PageWrapper>
            <PageHeader title="Tier Maker" subtitle={currentBoard ? currentBoard.name : "Create your tier rankings"} />
            <PageContent className="animate-fade-in tier-board-content">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    {/* Top Bar (PHASE 2) */}
                    <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                        {/* Board Selector */}
                        <div className="flex items-center gap-2">
                            <select
                                value={currentBoardId || ""}
                                onChange={e => {
                                    const val = e.target.value;
                                    setCurrentBoardId(isNaN(Number(val)) ? val : parseInt(val));
                                }}
                                className="px-4 py-2 bg-card border border-border rounded-lg"
                            >
                                {boards.map(board => (
                                    <option key={board.id} value={board.id}>
                                        {board.name}
                                    </option>
                                ))}
                            </select>
                            <button
                                onClick={handleCreateBoard}
                                className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                New Board
                            </button>
                            {currentBoardId && (
                                <>
                                    <button
                                        onClick={handleRenameBoard}
                                        className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 flex items-center gap-2"
                                        title="Rename Board"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleDuplicateBoard}
                                        className="px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 flex items-center gap-2"
                                        title="Duplicate Board"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleDeleteBoard}
                                        className="px-3 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 flex items-center gap-2"
                                        title="Delete Board"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowRankings(!showRankings)}
                                className={`p-2 rounded-lg transition-colors ${
                                    showRankings ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                                }`}
                                title="Show ranking badges"
                            >
                                <Type className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-2 rounded-lg transition-colors ${
                                    showFilters ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                                }`}
                                title="Filters"
                            >
                                <Filter className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => {
                                    /* PHASE 7: Export */
                                }}
                                className="p-2 hover:bg-secondary rounded-lg"
                                title="Export as Image"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-secondary rounded-lg" title="Settings">
                                <Settings className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Filter Panel (PHASE 4) */}
                    {showFilters && (
                        <div className="mb-6">
                            <FilterPanel
                                filters={filters}
                                onFiltersChange={setFilters}
                                allMedia={[...animeList, ...mangaList]}
                            />
                        </div>
                    )}

                    {/* Smart Tools & Analytics (PHASE 5 & 8) */}
                    <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <SmartTools
                            boardId={currentBoardId!}
                            tiers={tiers}
                            assignments={assignments}
                            allMedia={allMedia}
                            onAssignmentsUpdate={refreshAssignments}
                        />
                        {tiers.length > 0 && (
                            <TierAnalytics tiers={tiers} assignments={assignments} allMedia={allMedia} />
                        )}
                    </div>

                    {/* Tier Management */}
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Tiers</h3>
                        {currentBoardId && (
                            <button
                                onClick={async () => {
                                    const name = prompt("Tier name:");
                                    if (!name) return;
                                    const color = prompt("Color (hex):", "#FF6B6B");
                                    if (!color) return;

                                    try {
                                        const maxOrder = tiers.length > 0 ? Math.max(...tiers.map(t => t.order)) : -1;
                                        await createTier({
                                            boardId: currentBoardId,
                                            name,
                                            color,
                                            order: maxOrder + 1,
                                        });
                                        const updated = await getTiersForBoard(currentBoardId);
                                        setTiers(updated);
                                    } catch (err) {
                                        console.error("Failed to create tier:", err);
                                    }
                                }}
                                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2 text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Add Tier
                            </button>
                        )}
                    </div>

                    {/* Tier Rows */}
                    <div className="space-y-4">
                        {tiers.map(tier => (
                            <TierRow
                                key={tier.id}
                                tier={tier}
                                media={getMediaForTier(tier.id!)}
                                allMedia={allMedia}
                                boardId={currentBoardId}
                                assignments={assignments}
                                setAssignments={setAssignments}
                                tiers={tiers}
                                showRankings={showRankings}
                                onReorder={async (tierId: string | number, direction: "up" | "down") => {
                                    const tierToMove = tiers.find(t => t.id === tierId);
                                    const tierIndex = tiers.indexOf(tierToMove!);
                                    if (tierIndex === -1) return;

                                    const swapIndex = direction === "up" ? tierIndex - 1 : tierIndex + 1;
                                    if (swapIndex < 0 || swapIndex >= tiers.length) return;

                                    const tierToSwap = tiers[swapIndex];
                                    const tierToMoveOrder = tierToMove!.order;
                                    const tierToSwapOrder = tierToSwap.order;

                                    try {
                                        await Promise.all([
                                            updateTier(tierId, { order: tierToSwapOrder }),
                                            updateTier(tierToSwap.id!, { order: tierToMoveOrder }),
                                        ]);

                                        const updated = await getTiersForBoard(currentBoardId!);
                                        setTiers(updated);
                                    } catch (err) {
                                        console.error("Failed to reorder tier:", err);
                                    }
                                }}
                                onDelete={async () => {
                                    if (!tier.id) return;
                                    if (!confirm(`Delete tier "${tier.name}"? Items will move to unassigned.`)) return;
                                    try {
                                        await deleteTier(tier.id);
                                        const updated = await getTiersForBoard(currentBoardId!);
                                        setTiers(updated);
                                        await refreshAssignments();
                                    } catch (err) {
                                        console.error("Failed to delete tier:", err);
                                    }
                                }}
                            />
                        ))}
                    </div>

                    {/* Unassigned Pool (PHASE 2) */}
                    <div className="mt-8" id="pool">
                        <h3 className="text-lg font-semibold mb-4">Unassigned ({unassignedMedia.length})</h3>
                        <UnassignedPool
                            media={unassignedMedia}
                            boardId={currentBoardId}
                            assignments={assignments}
                            setAssignments={setAssignments}
                            showRankings={showRankings}
                        />
                    </div>

                    <DragOverlay>
                        {activeId ? <MediaCardPreview media={allMedia.find(m => m._entryId === activeId)!} /> : null}
                    </DragOverlay>
                </DndContext>
            </PageContent>
        </PageWrapper>
    );
}

// Tier Row Component
function TierRow({
    tier,
    media,
    allMedia,
    boardId,
    assignments,
    setAssignments,
    onDelete,
    onReorder,
    tiers,
    showRankings = false,
}: {
    tier: Tier;
    media: DisplayMedia[];
    allMedia: DisplayMedia[];
    boardId: string | number | null;
    assignments: TierAssignment[];
    setAssignments: (assignments: TierAssignment[]) => void;
    onDelete: () => void;
    onReorder: (tierId: string | number, direction: "up" | "down") => void;
    tiers: Tier[];
    showRankings?: boolean;
}) {
    const { getTitle } = useData();
    const [isRenamingTier, setIsRenamingTier] = useState(false);
    const [tierName, setTierName] = useState(tier.name);
    const [tierColor, setTierColor] = useState(tier.color);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [innerDragActive, setInnerDragActive] = useState<number | null>(null);

    const handleUpdateTierName = async () => {
        if (!tier.id || !tierName.trim()) return;
        try {
            await updateTier(tier.id, { name: tierName });
            setIsRenamingTier(false);
        } catch (err) {
            console.error("Failed to update tier name:", err);
            setTierName(tier.name);
        }
    };

    const handleUpdateTierColor = async (newColor: string) => {
        if (!tier.id) return;
        try {
            setTierColor(newColor);
            await updateTier(tier.id, { color: newColor });
            setShowColorPicker(false);
        } catch (err) {
            console.error("Failed to update tier color:", err);
            setTierColor(tier.color);
        }
    };

    const handleMoveItem = async (oldIndex: number, newIndex: number) => {
        if (!tier.id || !boardId) return;

        const tierAssignments = assignments
            .filter(a => a.tierId === tier.id && a.boardId === boardId)
            .sort((a, b) => a.position - b.position);

        if (newIndex < 0 || newIndex >= tierAssignments.length) return;

        const reordered = arrayMove(tierAssignments, oldIndex, newIndex);

        // Update positions
        for (let i = 0; i < reordered.length; i++) {
            await saveAssignment({
                ...reordered[i],
                position: i,
            });
        }

        const updated = await getAssignmentsForBoard(boardId);
        setAssignments(updated);
    };

    const colorPresets = [
        "#FF6B6B",
        "#4ECDC4",
        "#45B7D1",
        "#FFA07A",
        "#98D8C8",
        "#95A5A6",
        "#F7DC6F",
        "#BB8FCE",
        "#85C1E2",
        "#F8B88B",
        "#52BE80",
        "#E59866",
    ];

    const isFirstTier = tier.order === 0;
    const isLastTier = tier.order === tiers.length - 1;

    return (
        <div id={`tier-${tier.id}`} className="bg-card border border-border rounded-lg p-4">
            {/* Tier Header with Controls */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
                {/* Color Display & Picker */}
                <div className="relative">
                    <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="w-6 h-6 rounded border border-border hover:border-primary transition-colors"
                        style={{ backgroundColor: tierColor }}
                        title="Change color"
                    />
                    {showColorPicker && (
                        <div className="absolute top-8 left-0 z-50 bg-card border border-border rounded-lg p-3 shadow-lg">
                            <div className="grid grid-cols-6 gap-2">
                                {colorPresets.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => handleUpdateTierColor(color)}
                                        className={`w-6 h-6 rounded border-2 transition-all ${
                                            tierColor === color ? "border-primary" : "border-border"
                                        }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                            <div className="mt-2 flex gap-2">
                                <input
                                    type="color"
                                    value={tierColor}
                                    onChange={e => handleUpdateTierColor(e.target.value)}
                                    className="w-full h-8 rounded cursor-pointer"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Tier Name */}
                {isRenamingTier ? (
                    <input
                        value={tierName}
                        onChange={e => setTierName(e.target.value)}
                        onBlur={handleUpdateTierName}
                        onKeyDown={e => {
                            if (e.key === "Enter") handleUpdateTierName();
                            if (e.key === "Escape") {
                                setTierName(tier.name);
                                setIsRenamingTier(false);
                            }
                        }}
                        className="px-2 py-1 bg-background border border-border rounded font-semibold"
                        autoFocus
                    />
                ) : (
                    <h3
                        className="text-lg font-semibold cursor-pointer hover:text-primary transition-colors"
                        onClick={() => setIsRenamingTier(true)}
                        title="Click to rename"
                    >
                        {tier.name}
                    </h3>
                )}
                <span className="text-sm text-muted-foreground">({media.length})</span>

                {/* Action Buttons */}
                <div className="ml-auto flex items-center gap-2">
                    {/* Quick Sort Menu */}
                    <div className="relative group">
                        <button className="p-1 hover:bg-secondary rounded transition-colors" title="Quick sort options">
                            <SortDesc className="w-4 h-4" />
                        </button>
                        <div className="absolute right-0 top-8 z-50 bg-card border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap">
                            <button
                                onClick={async () => {
                                    if (!tier.id || !boardId) return;
                                    const tierAssignments = assignments
                                        .filter(a => a.tierId === tier.id && a.boardId === boardId)
                                        .sort((a, b) => a.position - b.position);

                                    const sorted = tierAssignments.sort((a, b) => {
                                        const mediaA = allMedia.find(m => m._entryId === a.mediaId);
                                        const mediaB = allMedia.find(m => m._entryId === b.mediaId);
                                        return (mediaB?.score || 0) - (mediaA?.score || 0);
                                    });

                                    for (let i = 0; i < sorted.length; i++) {
                                        await saveAssignment({ ...sorted[i], position: i });
                                    }
                                    const updated = await getAssignmentsForBoard(boardId!);
                                    setAssignments(updated);
                                }}
                                className="block w-full text-left px-3 py-2 hover:bg-secondary text-sm"
                            >
                                Sort by Score
                            </button>
                            <button
                                onClick={async () => {
                                    if (!tier.id || !boardId) return;
                                    const tierAssignments = assignments
                                        .filter(a => a.tierId === tier.id && a.boardId === boardId)
                                        .sort((a, b) => a.position - b.position);

                                    const sorted = tierAssignments.sort((a, b) => {
                                        const mediaA = allMedia.find(m => m._entryId === a.mediaId);
                                        const mediaB = allMedia.find(m => m._entryId === b.mediaId);
                                        const titleA = (
                                            mediaA?.title?.english ||
                                            mediaA?.title?.romaji ||
                                            ""
                                        ).toLowerCase();
                                        const titleB = (
                                            mediaB?.title?.english ||
                                            mediaB?.title?.romaji ||
                                            ""
                                        ).toLowerCase();
                                        return titleA.localeCompare(titleB);
                                    });

                                    for (let i = 0; i < sorted.length; i++) {
                                        await saveAssignment({ ...sorted[i], position: i });
                                    }
                                    const updated = await getAssignmentsForBoard(boardId!);
                                    setAssignments(updated);
                                }}
                                className="block w-full text-left px-3 py-2 hover:bg-secondary text-sm"
                            >
                                Sort A-Z
                            </button>
                            <button
                                onClick={async () => {
                                    if (!tier.id || !boardId) return;
                                    const tierAssignments = assignments
                                        .filter(a => a.tierId === tier.id && a.boardId === boardId)
                                        .sort((a, b) => a.position - b.position);

                                    tierAssignments.reverse();

                                    for (let i = 0; i < tierAssignments.length; i++) {
                                        await saveAssignment({ ...tierAssignments[i], position: i });
                                    }
                                    const updated = await getAssignmentsForBoard(boardId!);
                                    setAssignments(updated);
                                }}
                                className="block w-full text-left px-3 py-2 hover:bg-secondary text-sm"
                            >
                                Reverse Order
                            </button>
                            <button
                                onClick={async () => {
                                    if (!tier.id || !boardId) return;
                                    const tierAssignments = assignments
                                        .filter(a => a.tierId === tier.id && a.boardId === boardId)
                                        .sort((a, b) => a.position - b.position);

                                    // Fisher-Yates shuffle
                                    for (let i = tierAssignments.length - 1; i > 0; i--) {
                                        const j = Math.floor(Math.random() * (i + 1));
                                        [tierAssignments[i], tierAssignments[j]] = [
                                            tierAssignments[j],
                                            tierAssignments[i],
                                        ];
                                    }

                                    for (let i = 0; i < tierAssignments.length; i++) {
                                        await saveAssignment({ ...tierAssignments[i], position: i });
                                    }
                                    const updated = await getAssignmentsForBoard(boardId!);
                                    setAssignments(updated);
                                }}
                                className="block w-full text-left px-3 py-2 hover:bg-secondary text-sm"
                            >
                                Randomize
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => onReorder(tier.id!, "up")}
                        disabled={isFirstTier}
                        className="p-1 hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                        title="Move tier up"
                    >
                        <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onReorder(tier.id!, "down")}
                        disabled={isLastTier}
                        className="p-1 hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                        title="Move tier down"
                    >
                        <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsRenamingTier(true)}
                        className="p-1 hover:bg-secondary rounded transition-colors"
                        title="Rename Tier"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-1 hover:bg-destructive/20 rounded text-destructive transition-colors"
                        title="Delete Tier"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Tier Items Container */}
            <DroppableTier tierId={tier.id!}>
                <SortableContext items={media.map(m => m._entryId)} strategy={horizontalListSortingStrategy}>
                    <div className="flex flex-wrap gap-3 min-h-[120px] p-2 bg-secondary/20 rounded">
                        {media.length === 0 ? (
                            <div className="w-full text-center text-muted-foreground py-8 text-sm">Drop items here</div>
                        ) : (
                            media.map((item, index) => (
                                <SortableMediaCard
                                    key={item._entryId}
                                    media={item}
                                    index={index}
                                    totalItems={media.length}
                                    onMove={handleMoveItem}
                                    showRank={showRankings}
                                    tierName={tier.name}
                                />
                            ))
                        )}
                    </div>
                </SortableContext>
            </DroppableTier>
        </div>
    );
}

// Sortable Media Card
function SortableMediaCard({
    media,
    index,
    totalItems,
    onMove,
    showRank = false,
    tierName = "",
}: {
    media: DisplayMedia;
    index: number;
    totalItems: number;
    onMove?: (oldIndex: number, newIndex: number) => void;
    showRank?: boolean;
    tierName?: string;
}) {
    const { getTitle } = useData();
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
        id: media._entryId,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing group relative"
        >
            <MediaCardPreview media={media} />

            {/* Rank Badge */}
            {showRank && (
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg">
                    {index + 1}
                </div>
            )}

            {onMove && totalItems > 1 && (
                <div className="absolute -bottom-8 left-0 right-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-secondary rounded p-1">
                    <button
                        onClick={() => index > 0 && onMove(index, index - 1)}
                        disabled={index === 0}
                        className="p-0.5 hover:bg-primary/20 disabled:opacity-50 rounded text-xs"
                        title="Move left"
                    >
                        ←
                    </button>
                    <button
                        onClick={() => index < totalItems - 1 && onMove(index, index + 1)}
                        disabled={index === totalItems - 1}
                        className="p-0.5 hover:bg-primary/20 disabled:opacity-50 rounded text-xs"
                        title="Move right"
                    >
                        →
                    </button>
                </div>
            )}
        </div>
    );
}

// Media Card Preview
function MediaCardPreview({ media }: { media: DisplayMedia }) {
    const { getTitle } = useData();
    const title = getTitle(media);

    return (
        <div className="w-24 h-32 bg-secondary rounded-lg overflow-hidden group">
            {media.coverImage ? (
                <img src={media.coverImage} alt={title} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface-2">
                    <span className="text-xs text-muted-foreground text-center px-1">{title}</span>
                </div>
            )}
        </div>
    );
}

// Droppable Tier Wrapper
function DroppableTier({ tierId, children }: { tierId: string | number; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
        id: `tier-${tierId}`,
    });

    return (
        <div ref={setNodeRef} className={isOver ? "ring-2 ring-primary rounded-lg" : ""}>
            {children}
        </div>
    );
}

// Unassigned Pool
function UnassignedPool({
    media,
    boardId,
    assignments,
    setAssignments,
    showRankings = false,
}: {
    media: DisplayMedia[];
    boardId: string | number | null;
    assignments: TierAssignment[];
    setAssignments: (assignments: TierAssignment[]) => void;
    showRankings?: boolean;
}) {
    const { getTitle } = useData();

    if (!boardId) return null;

    const handleMovePoolItem = async (oldIndex: number, newIndex: number) => {
        if (newIndex < 0 || newIndex >= media.length) return;

        // Get pool assignments sorted by position
        const poolAssignments = assignments
            .filter(a => a.tierId === null && a.boardId === boardId)
            .sort((a, b) => a.position - b.position);

        const reordered = arrayMove(poolAssignments, oldIndex, newIndex);

        // Update positions
        for (let i = 0; i < reordered.length; i++) {
            await saveAssignment({
                ...reordered[i],
                position: i,
            });
        }

        const updated = await getAssignmentsForBoard(boardId);
        setAssignments(updated);
    };

    const { setNodeRef, isOver } = useDroppable({
        id: "pool",
    });

    return (
        <div
            ref={setNodeRef}
            className={`bg-secondary/50 rounded-lg p-4 min-h-[200px] border-2 border-dashed transition-colors ${
                isOver ? "border-primary bg-primary/10" : "border-border"
            }`}
        >
            <SortableContext items={media.map(m => m._entryId)} strategy={horizontalListSortingStrategy}>
                <div className="flex flex-wrap gap-3">
                    {media.length === 0 ? (
                        <div className="w-full text-center text-muted-foreground py-8 text-sm">
                            All items are ranked
                        </div>
                    ) : (
                        media.map((item, index) => (
                            <SortableMediaCard
                                key={item._entryId}
                                media={item}
                                index={index}
                                totalItems={media.length}
                                onMove={handleMovePoolItem}
                                showRank={showRankings}
                                tierName="Unranked"
                            />
                        ))
                    )}
                </div>
            </SortableContext>
        </div>
    );
}
