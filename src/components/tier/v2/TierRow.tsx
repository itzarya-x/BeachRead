import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { TierMediaCard } from "./TierMediaCard";
import type { DisplayMedia } from "@/types/display";
import type { Tier } from "@/lib/tierDatabase";
import { motion } from "framer-motion";

interface TierRowProps {
    tier: Tier;
    media: DisplayMedia[];
    onEditTier: (tier: Tier) => void;
    onRemoveItem: (mediaId: string | number) => void;
    isBulkMode?: boolean;
    selectedIds?: Set<string | number>;
    onToggleSelect?: (id: string | number) => void;
}

export function TierRow({ 
    tier, 
    media, 
    onEditTier, 
    onRemoveItem, 
    isBulkMode, 
    selectedIds, 
    onToggleSelect 
}: TierRowProps) {
    const { setNodeRef } = useDroppable({
        id: `tier-${tier.id}`,
    });

    return (
        <div className="flex flex-col md:flex-row gap-3 md:gap-6 items-stretch w-full max-w-full min-h-[140px] overflow-hidden">
            {/* Left: Tier Label */}
            <div 
                onClick={() => onEditTier(tier)}
                className="w-full md:w-36 shrink-0 flex flex-row md:flex-col items-center justify-between md:justify-center px-4 py-3 md:p-0 rounded-xl border border-white/10 cursor-pointer transition-all md:hover:scale-105 active:scale-95 shadow-depth1"
                style={{ backgroundColor: tier.color }}
            >
                <h2 className="font-black text-lg md:text-2xl text-white tracking-tighter drop-shadow-md uppercase">
                    {tier.name}
                </h2>
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em] md:mt-1">
                    {media.length} subjects
                </span>
            </div>

            {/* Right: Items Row */}
            <div 
                ref={setNodeRef}
                className="flex-1 min-w-0 bg-gradient-to-br from-card/80 to-card/40 border border-border/40 rounded-2xl p-3 md:p-4 overflow-hidden relative"
            >
                <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 touch-scroll snap-x snap-mandatory">
                    <SortableContext 
                        items={media.map(m => m._entryId)} 
                        strategy={horizontalListSortingStrategy}
                    >
                        {media.map((m) => (
                            <TierMediaCard 
                                key={String(m._entryId)} 
                                id={m._entryId} 
                                media={m} 
                                onRemove={onRemoveItem}
                                isBulkMode={isBulkMode}
                                isSelected={selectedIds?.has(m._entryId)}
                                onToggleSelect={onToggleSelect}
                            />
                        ))}
                    </SortableContext>
                    {media.length === 0 && (
                        <div className="flex-1 flex items-center justify-center text-white/20 text-[10px] font-black uppercase tracking-[0.2em] border-2 border-dashed border-white/5 rounded-xl min-h-[100px]">
                            Empty Protocol
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
