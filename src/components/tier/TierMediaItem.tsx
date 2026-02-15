import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import type { DisplayMedia } from "@/types/display";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

interface TierMediaItemProps {
    media: DisplayMedia;
    id: string | number;
    overlay?: boolean;
    compact?: boolean;
}

export function TierMediaItem({ media, id, overlay, compact }: TierMediaItemProps) {
    const { getTitle } = useData();
    const title = getTitle(media);
    
    // Sortable hooks
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 50 : undefined,
    };

    if (overlay) {
        return (
            <motion.div 
                initial={{ scale: 0.9, rotate: -5 }}
                animate={{ scale: 1.1, rotate: 5 }}
                className={cn(
                    "relative group cursor-grabbing overflow-hidden rounded-xl border border-primary/40 shadow-md",
                    compact ? "w-16 h-24 md:w-20 md:h-28" : "w-24 h-36 md:w-28 md:h-40"
                )}
            >
                {media.coverImage ? (
                    <img src={media.coverImage} alt={title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-muted-foreground" />
                    </div>
                )}
            </motion.div>
        );
    }

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
                "relative group cursor-grab overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md active:cursor-grabbing",
                compact ? "w-16 h-24 md:w-20 md:h-28" : "w-24 h-36 md:w-28 md:h-40"
            )}
            title={title}
        >
            {media.coverImage ? (
                <img 
                    src={media.coverImage} 
                    alt={title} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                    loading="lazy"
                />
            ) : (
                <div className="w-full h-full bg-secondary/50 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-muted-foreground/30" />
                </div>
            )}
            
            {/* Hover Info */}
            <motion.div 
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/75 via-black/10 to-transparent p-2"
            >
                <span className="text-[10px] md:text-xs font-extrabold text-white line-clamp-2 leading-tight tracking-tight">
                    {title}
                </span>
                {media.score > 0 && (
                    <motion.span 
                        initial={{ x: -10, opacity: 0 }}
                        whileHover={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-primary-foreground/85"
                    >
                        ★ {media.score}
                    </motion.span>
                )}
            </motion.div>
        </motion.div>
    );
}
