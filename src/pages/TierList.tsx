import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { useData } from "@/context/DataContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { DisplayMedia } from "@/types/display";
import {
    DndContext,
    DragOverlay,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from "@dnd-kit/core";
import { GripVertical, Plus, RotateCcw, Trash2, Trophy } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

interface TierConfig {
    id: string;
    name: string;
    color: string;
    items: number[];
}

const DEFAULT_TIERS: TierConfig[] = [
    { id: "s", name: "S", color: "var(--tier-s)", items: [] },
    { id: "a", name: "A", color: "var(--tier-a)", items: [] },
    { id: "b", name: "B", color: "var(--tier-b)", items: [] },
    { id: "c", name: "C", color: "var(--tier-c)", items: [] },
    { id: "d", name: "D", color: "var(--tier-d)", items: [] },
    { id: "f", name: "F", color: "var(--tier-f)", items: [] },
];

function autoAssignTiers(items: DisplayMedia[]): TierConfig[] {
    const scored = items.filter(i => i.score > 0 && i.status === "COMPLETED");
    const tiers = DEFAULT_TIERS.map(t => ({ ...t, items: [] as number[] }));
    for (const item of scored) {
        const s = item.score;
        if (s >= 90) tiers[0].items.push(item._seriesId);
        else if (s >= 80) tiers[1].items.push(item._seriesId);
        else if (s >= 70) tiers[2].items.push(item._seriesId);
        else if (s >= 60) tiers[3].items.push(item._seriesId);
        else if (s >= 50) tiers[4].items.push(item._seriesId);
        else tiers[5].items.push(item._seriesId);
    }
    return tiers;
}

const TierList = () => {
    const { animeList, mangaList, getTitle, loading } = useData();
    const allMedia = useMemo(() => [...animeList, ...mangaList], [animeList, mangaList]);
    const mediaMap = useMemo(() => {
        const m = new Map<number, DisplayMedia>();
        allMedia.forEach(item => m.set(item._seriesId, item));
        return m;
    }, [allMedia]);

    const [tiers, setTiers] = useLocalStorage<TierConfig[]>("tier-config", []);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [editingTier, setEditingTier] = useState<string | null>(null);

    // Initialize tiers on first load
    const initialized = tiers.length > 0;

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor),
    );

    const assignedIds = useMemo(() => {
        const ids = new Set<number>();
        tiers.forEach(t => t.items.forEach(id => ids.add(id)));
        return ids;
    }, [tiers]);

    const untieredItems = useMemo(() => {
        return allMedia.filter(i => i.score > 0 && i.status === "COMPLETED" && !assignedIds.has(i._seriesId));
    }, [allMedia, assignedIds]);

    const handleAutoAssign = useCallback(() => {
        setTiers(autoAssignTiers(allMedia));
    }, [allMedia, setTiers]);

    const handleReset = useCallback(() => {
        setTiers(DEFAULT_TIERS.map(t => ({ ...t, items: [] })));
    }, [setTiers]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as number);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const itemId = active.id as number;
        const targetTierId = over.id as string;

        setTiers(prev => {
            const updated = prev.map(t => ({
                ...t,
                items: t.items.filter(id => id !== itemId),
            }));
            const targetTier = updated.find(t => t.id === targetTierId);
            if (targetTier) {
                targetTier.items.push(itemId);
            }
            return updated;
        });
    };

    const renameTier = (tierId: string, newName: string) => {
        setTiers(prev => prev.map(t => (t.id === tierId ? { ...t, name: newName } : t)));
        setEditingTier(null);
    };

    const removeTier = (tierId: string) => {
        setTiers(prev => prev.filter(t => t.id !== tierId));
    };

    const addTier = () => {
        const id = `custom-${Date.now()}`;
        setTiers(prev => [...prev, { id, name: "New Tier", color: "var(--muted-foreground)", items: [] }]);
    };

    const activeMedia = activeId ? mediaMap.get(activeId) : null;

    // Show loading only if we have no data at all
    if (loading && allMedia.length === 0) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <PageWrapper>
            <PageHeader title="Tier List" subtitle="Rank your completed media" />
            <PageContent className="animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex gap-2">
                        <button
                            onClick={handleAutoAssign}
                            className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Auto-assign
                        </button>
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1.5 px-3 py-2 bg-surface-3 text-muted-foreground rounded-xl text-sm font-medium hover:bg-surface-3/80 transition-colors"
                        >
                            Reset
                        </button>
                        <button
                            onClick={addTier}
                            className="flex items-center gap-1.5 px-3 py-2 bg-surface-3 text-muted-foreground rounded-xl text-sm font-medium hover:bg-surface-3/80 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Tier
                        </button>
                    </div>
                </div>

                {!initialized ? (
                    <div className="text-center py-20">
                        <Trophy className="w-12 h-12 text-accent/30 mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">No tiers configured yet</p>
                        <button
                            onClick={handleAutoAssign}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                        >
                            Auto-assign from scores
                        </button>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="space-y-2">
                            {tiers.map(tier => (
                                <TierRow
                                    key={tier.id}
                                    tier={tier}
                                    mediaMap={mediaMap}
                                    getTitle={getTitle}
                                    editingTier={editingTier}
                                    onStartEdit={setEditingTier}
                                    onRename={renameTier}
                                    onRemove={removeTier}
                                />
                            ))}
                        </div>

                        {/* Untiered pool */}
                        {untieredItems.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                                    Unranked ({untieredItems.length})
                                </h3>
                                <div className="flex flex-wrap gap-2 bg-surface-1 rounded-xl p-3 border border-border/30 min-h-[80px]">
                                    {untieredItems.map(item => (
                                        <DraggableItem key={item._seriesId} media={item} getTitle={getTitle} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <DragOverlay>
                            {activeMedia && (
                                <div className="w-16 h-24 rounded-lg overflow-hidden shadow-2xl ring-2 ring-primary opacity-90">
                                    {activeMedia.coverImage ? (
                                        <img
                                            src={activeMedia.coverImage}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-surface-2" />
                                    )}
                                </div>
                            )}
                        </DragOverlay>
                    </DndContext>
                )}
            </PageContent>
        </PageWrapper>
    );
};

function TierRow({
    tier,
    mediaMap,
    getTitle,
    editingTier,
    onStartEdit,
    onRename,
    onRemove,
}: {
    tier: TierConfig;
    mediaMap: Map<number, DisplayMedia>;
    getTitle: (m: DisplayMedia) => string;
    editingTier: string | null;
    onStartEdit: (id: string | null) => void;
    onRename: (id: string, name: string) => void;
    onRemove: (id: string) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: tier.id });
    const [editName, setEditName] = useState(tier.name);

    return (
        <div
            ref={setNodeRef}
            className={`tier-row transition-all duration-200 ${isOver ? "ring-2 ring-primary/50 bg-primary/5" : ""}`}
        >
            {/* Tier label */}
            <div
                className="tier-label rounded-l-lg cursor-pointer relative group"
                style={{
                    backgroundColor: `hsl(${tier.color})`,
                    color: "hsl(0 0% 100%)",
                }}
                onDoubleClick={() => {
                    onStartEdit(tier.id);
                    setEditName(tier.name);
                }}
            >
                {editingTier === tier.id ? (
                    <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onBlur={() => onRename(tier.id, editName)}
                        onKeyDown={e => e.key === "Enter" && onRename(tier.id, editName)}
                        className="w-14 bg-transparent text-center text-lg font-bold outline-none"
                    />
                ) : (
                    tier.name
                )}
                <button
                    onClick={() => onRemove(tier.id)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Trash2 className="w-3 h-3 text-destructive-foreground" />
                </button>
            </div>

            {/* Items */}
            <div className="flex-1 flex flex-wrap gap-2 bg-surface-1 rounded-r-lg p-2 border border-border/30 min-h-[80px] items-start">
                {tier.items.map(itemId => {
                    const media = mediaMap.get(itemId);
                    if (!media) return null;
                    return <DraggableItem key={itemId} media={media} getTitle={getTitle} />;
                })}
                {tier.items.length === 0 && (
                    <span className="text-xs text-muted-foreground/40 self-center mx-auto">Drop items here</span>
                )}
            </div>
        </div>
    );
}

function DraggableItem({ media, getTitle }: { media: DisplayMedia; getTitle: (m: DisplayMedia) => string }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: media._seriesId });

    const style = transform
        ? {
              transform: `translate(${transform.x}px, ${transform.y}px)`,
              zIndex: isDragging ? 50 : undefined,
              opacity: isDragging ? 0.5 : 1,
          }
        : undefined;

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style}
            className="w-14 h-20 md:w-16 md:h-24 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing group relative shrink-0"
            title={getTitle(media)}
        >
            {media.coverImage ? (
                <img
                    src={media.coverImage}
                    alt={getTitle(media)}
                    className="w-full h-full object-cover"
                    loading="lazy"
                />
            ) : (
                <div className="w-full h-full bg-surface-2 flex items-center justify-center">
                    <GripVertical className="w-4 h-4 text-muted-foreground/30" />
                </div>
            )}
        </div>
    );
}

export default TierList;
