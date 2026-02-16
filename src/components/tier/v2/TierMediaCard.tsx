import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import type { DisplayMedia } from "@/types/display";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, X, Star } from "lucide-react";

interface TierMediaCardProps {
    media: DisplayMedia;
    id: string | number;
    overlay?: boolean;
    onRemove?: (id: string | number) => void;
    isSelected?: boolean;
    isBulkMode?: boolean;
    onToggleSelect?: (id: string | number) => void;
}

export function TierMediaCard({ 
    media, 
    id, 
    overlay, 
    onRemove, 
    isSelected, 
    isBulkMode, 
    onToggleSelect 
}: TierMediaCardProps) {
    const { getTitle } = useData();
    const title = getTitle(media);
    
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 50 : undefined,
    };

    const handleClick = () => {
        if (isBulkMode && onToggleSelect) {
            onToggleSelect(id);
        }
    };

    const cardContent = (
        <div className={cn(
            "relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-md transition-all duration-300",
            isSelected && "ring-4 ring-primary ring-offset-2 ring-offset-background",
            !overlay && "hover:scale-105"
        )}>
            {media.coverImage ? (
                <img 
                    src={media.coverImage} 
                    alt={title} 
                    className="h-full w-full object-cover" 
                    loading="lazy"
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center bg-secondary/50">
                    <Trophy className="h-6 w-6 text-muted-foreground/30" />
                </div>
            )}

            {/* Score Badge */}
            {media.score > 0 && (
                <div className="absolute left-1 top-1 flex items-center gap-0.5 rounded bg-black/60 px-1 py-0.5 text-[8px] font-black text-white backdrop-blur-md">
                    <Star className="h-2 w-2 text-yellow-400 fill-yellow-400" />
                    {media.score}
                </div>
            )}

            {/* Remove Button (Hover only, not in bulk mode) */}
            {!isBulkMode && onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(id);
                    }}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 opacity-0 transition-opacity hover:bg-destructive group-hover:opacity-100"
                >
                    <X className="h-3 w-3 text-white" />
                </button>
            )}

            {/* Bulk Selection Overlay */}
            {isBulkMode && (
                <div className={cn(
                    "absolute inset-0 flex items-center justify-center bg-black/20 transition-colors",
                    isSelected ? "bg-primary/20" : "hover:bg-black/40"
                )}>
                    <div className={cn(
                        "h-5 w-5 rounded-full border-2 border-white flex items-center justify-center transition-colors",
                        isSelected ? "bg-primary border-primary" : "bg-transparent"
                    )}>
                        {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                </div>
            )}
        </div>
    );

    if (overlay) {
        return (
            <div className="w-28 cursor-grabbing">
                {cardContent}
            </div>
        );
    }

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...(isBulkMode ? {} : listeners)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "group relative w-28 shrink-0 cursor-grab active:cursor-grabbing",
                isBulkMode && "cursor-pointer"
            )}
            onClick={handleClick}
            title={title}
        >
            {cardContent}
        </motion.div>
    );
}
