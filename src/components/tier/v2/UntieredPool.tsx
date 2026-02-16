import { useDroppable } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { TierMediaCard } from "./TierMediaCard";
import type { DisplayMedia } from "@/types/display";

interface UntieredPoolProps {
    media: DisplayMedia[];
    isBulkMode?: boolean;
    selectedIds?: Set<string | number>;
    onToggleSelect?: (id: string | number) => void;
}

export function UntieredPool({ 
    media, 
    isBulkMode, 
    selectedIds, 
    onToggleSelect 
}: UntieredPoolProps) {
    const { setNodeRef } = useDroppable({
        id: "pool",
    });

    return (
        <div className="space-y-4 max-w-full overflow-hidden">
            <div className="flex items-center gap-4 px-2">
                <h3 className="text-xl font-black uppercase tracking-tighter text-white/80">
                    Untiered Pool
                </h3>
                <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black text-white/30 tracking-widest uppercase">
                    {media.length} PENDING
                </span>
            </div>

            <div 
                ref={setNodeRef}
                className="bg-card/40 border border-white/5 rounded-2xl p-6 min-h-[180px] min-w-0 overflow-hidden"
            >
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <SortableContext 
                        items={media.map(m => m._entryId)} 
                        strategy={horizontalListSortingStrategy}
                    >
                        {media.map((m) => (
                            <TierMediaCard 
                                key={String(m._entryId)} 
                                id={m._entryId} 
                                media={m} 
                                isBulkMode={isBulkMode}
                                isSelected={selectedIds?.has(m._entryId)}
                                onToggleSelect={onToggleSelect}
                            />
                        ))}
                    </SortableContext>
                    {media.length === 0 && (
                        <div className="flex-1 flex items-center justify-center text-white/10 text-sm font-black uppercase tracking-widest border-2 border-dashed border-white/5 rounded-xl py-12">
                            Archive Empty or All Items Ranked
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
