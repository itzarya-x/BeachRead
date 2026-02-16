import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import type { DisplayMedia } from "@/types/display";
import { motion } from "framer-motion";
import { BookOpen, Edit2, Play, Star } from "lucide-react";
import { Link } from "react-router-dom";

const cardEase = [0.16, 1, 0.3, 1] as const;
const hoverEase = [0.23, 1, 0.32, 1] as const;

interface MediaCardProps {
    media: DisplayMedia;
    isSelected?: boolean;
    onToggleSelect?: (id: number) => void;
    index?: number;
}

export function MediaCard({ media, isSelected, onToggleSelect, index = 0 }: MediaCardProps) {
    const { getTitle } = useData();
    const title = getTitle(media);
    const linkPath = `/${media.mediaType.toLowerCase()}/${media._seriesId}`;

    const progressLabel =
        media.mediaType === "ANIME"
            ? `${media.progress}${media.episodes ? `/${media.episodes}` : ""}`
            : `${media.progress}${media.chapters ? `/${media.chapters}` : ""}`;

    const progressPercent =
        media.episodes || media.chapters
            ? Math.min(100, (media.progress / (media.episodes || media.chapters || 1)) * 100)
            : 0;

    const isHydrated = media._enriched;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
                duration: 0.45,
                ease: cardEase,
                delay: index * 0.03
            }}
            whileHover={isHydrated ? { 
                y: -6, 
                scale: 1.02, 
                transition: { duration: 0.16, ease: hoverEase } 
            } : {}}
            className={cn(
                "group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300",
                isHydrated && "md:hover:border-primary/35 md:hover:shadow-md", // Hover only on MD+
                isSelected ? "ring-2 ring-primary/35" : ""
            )}
        >
            <Link to={isHydrated ? linkPath : "#"} className="block min-h-[44px]">
                {/* Cover Image Container */}
                <div className="relative aspect-[2/3] overflow-hidden bg-muted">
                    {media?.coverImage ? (
                        <motion.img
                            src={media.coverImage}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-700 md:group-hover:scale-[1.08]"
                            loading="lazy"
                            transition={{ duration: 0.8, ease: cardEase }}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground/20">
                            {media?.mediaType === "ANIME" ? 
                                <Play className={cn("w-12 h-12 opacity-20", !isHydrated && "animate-spin")} /> : 
                                <BookOpen className={cn("w-12 h-12 opacity-20", !isHydrated && "animate-pulse")} />
                            }
                        </div>
                    )}

                    {!isHydrated && <div className="absolute inset-0 animate-pulse bg-muted/40" />}

                    {/* Tier Ribbon */}
                    {media.tierId && isHydrated && (
                        <div className="absolute top-0 right-0 z-20 overflow-hidden w-20 h-20 pointer-events-none">
                            <div className="absolute top-4 -right-6 w-24 rotate-45 border-y border-primary/35 bg-primary px-4 py-1 text-center text-[8px] font-black uppercase tracking-[0.2em] text-primary-foreground shadow-sm">
                                {media.tierId}
                            </div>
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    {isHydrated && (
                        <>
                            <motion.div 
                                initial={{ opacity: 0.35 }}
                                whileHover={{ opacity: 0.6 }}
                                transition={{ duration: 0.3 }}
                                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-primary/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        </>
                    )}

                    {/* Score Badge */}
                    {media.score > 0 && isHydrated && (
                        <motion.div 
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", delay: 0.1 + index * 0.03 }}
                            className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-lg border border-border/80 bg-card/95 px-2 py-1"
                        >
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-bold text-foreground">{media.score}</span>
                        </motion.div>
                    )}

                    {/* Selection Checkbox */}
                    {onToggleSelect && (
                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onToggleSelect(media._entryId as number);
                            }}
                            className={cn(
                                "absolute top-2 right-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all z-10",
                                isSelected
                                    ? "bg-primary border-primary"
                                    : "border-border bg-card/90 hover:border-primary/35"
                            )}
                        >
                            {isSelected && (
                                <motion.svg
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-3 h-3 text-primary-foreground"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                >
                                    <motion.path d="M5 13l4 4L19 7" />
                                </motion.svg>
                            )}
                        </motion.button>
                    )}

                    {/* Quick Actions */}
                    {isHydrated && (
                        <motion.div 
                            initial={{ x: 20, opacity: 0 }}
                            whileHover={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className="absolute bottom-2 right-2 z-10 flex gap-2"
                        >
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                className="rounded-lg border border-border/80 bg-card/95 p-2 text-foreground transition-colors hover:border-primary/30 hover:bg-accent"
                                title="Edit"
                            >
                                <Edit2 className="w-4 h-4" />
                            </motion.button>
                        </motion.div>
                    )}

                    {/* Progress Bar & Info */}
                    {(media.progress > 0 || isHydrated) && (
                        <motion.div 
                            initial={isHydrated ? { y: 20, opacity: 0 } : { y: 0, opacity: 1 }}
                            whileHover={isHydrated ? { y: 0, opacity: 1 } : {}}
                            transition={{ duration: 0.3 }}
                            className="absolute bottom-0 left-0 right-0 p-3 space-y-2"
                        >
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-medium text-white/90">
                                    <span>Progress</span>
                                    <span>{progressLabel}</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-white/30">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                        className="h-full rounded-full bg-primary"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Title & Info */}
                <div className="space-y-1.5 p-3.5">
                    <h3 className={cn(
                        "h-10 line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-foreground transition-colors",
                        isHydrated ? "group-hover:text-primary" : "animate-pulse rounded bg-muted text-transparent"
                    )}>
                        {title}
                    </h3>
                    <div className="flex items-center justify-between">
                        <span className={cn(
                            "text-[10px] font-semibold uppercase tracking-[0.14em]",
                            isHydrated ? "text-muted-foreground" : "animate-pulse rounded bg-muted text-transparent"
                        )}>
                            {media?.format || "ASSET"}
                        </span>
                        {isHydrated && (
                            <div className="flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 text-primary/55" />
                                <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">{media.score || "??"}</span>
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
