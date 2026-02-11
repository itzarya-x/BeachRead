import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import ds from "@/styles/design-system";
import type { DisplayMedia } from "@/types/display";
import { motion } from "framer-motion";
import { BookOpen, Edit2, Play, Star } from "lucide-react";
import { Link } from "react-router-dom";

interface MediaCardProps {
    media: DisplayMedia;
    isSelected?: boolean;
    onToggleSelect?: (id: number) => void;
    index?: number;
}

export function MediaCard({ media, isSelected, onToggleSelect, index = 0 }: MediaCardProps) {
    const { user, getTitle } = useData();
    const title = getTitle(media);
    const scoreFormat = user?.scoreFormat || "POINT_10";
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
            {...ds.animations.cardEntry}
            transition={{ 
                ...ds.animations.cardEntry.transition,
                ease: ds.animations.cardEntry.transition.ease as any,
                delay: index * 0.03
            }}
            whileHover={isHydrated ? ds.animations.hover as any : {}}
            className={cn(
                "group relative bg-surface-elevated1 rounded-2xl overflow-hidden transition-all duration-500",
                "ring-1 ring-white/5 shadow-depth1",
                isHydrated && "hover:ring-primary/40 hover:shadow-depth2 hover:shadow-primary/5",
                isSelected ? "ring-2 ring-primary shadow-glow" : ""
            )}
        >
            <Link to={isHydrated ? linkPath : "#"} className="block">
                {/* Cover Image Container */}
                <div className="relative aspect-[2/3] overflow-hidden bg-surface-base">
                    {media?.coverImage ? (
                        <motion.img
                            src={media.coverImage}
                            alt={title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            whileHover={isHydrated ? { scale: 1.05 } : {}}
                            transition={{ duration: 0.8, ease: ds.motion.easing.default as any }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/10">
                            {media?.mediaType === "ANIME" ? 
                                <Play className={cn("w-12 h-12 opacity-20", !isHydrated && "animate-spin")} /> : 
                                <BookOpen className={cn("w-12 h-12 opacity-20", !isHydrated && "animate-pulse")} />
                            }
                        </div>
                    )}

                    {!isHydrated && <div className="absolute inset-0 bg-white/5 animate-pulse" />}

                    {/* Tier Ribbon */}
                    {media.tierId && isHydrated && (
                        <div className="absolute top-0 right-0 z-20 overflow-hidden w-20 h-20 pointer-events-none">
                            <div className="absolute top-4 -right-6 w-24 bg-primary px-4 py-1 rotate-45 text-[8px] font-black text-white text-center shadow-lg border-y border-white/20 tracking-[0.2em] uppercase">
                                {media.tierId}
                            </div>
                        </div>
                    )}

                    {/* Rarity Glow */}
                    {media.score >= 80 && isHydrated && (
                        <div 
                            className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-0" 
                            style={{ 
                                boxShadow: media.score >= 95 ? ds.rarity.sss.glow : 
                                           media.score >= 90 ? ds.rarity.ss.glow  : 
                                           ds.rarity.s.glow 
                            }}
                        />
                    )}

                    {/* Gradient Overlay */}
                    {isHydrated && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"
                        />
                    )}

                    {/* Score Badge */}
                    {media.score > 0 && isHydrated && (
                        <motion.div 
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", delay: 0.1 + index * 0.03 }}
                            className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 shadow-lg z-10"
                        >
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-bold text-white">{media.score}</span>
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
                                    : "bg-black/40 border-white/40 backdrop-blur-sm hover:border-white/60"
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
                            className="absolute bottom-2 right-2 flex gap-2 z-10"
                        >
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                className="p-2 rounded-lg bg-black/60 hover:bg-primary text-white backdrop-blur-md transition-colors shadow-lg"
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
                                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercent}%` }}
                                        transition={{ duration: 0.5, delay: 0.2 }}
                                        className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Title & Info */}
                <div className="p-4 space-y-1.5 bg-surface-elevated1">
                    <h3 className={cn(
                        "font-bold text-sm line-clamp-2 leading-snug transition-colors h-10",
                        isHydrated ? "group-hover:text-primary" : "bg-white/5 rounded text-transparent animate-pulse"
                    )}>
                        {title}
                    </h3>
                    <div className="flex items-center justify-between">
                        <span className={cn(
                            "text-[10px] font-black tracking-widest uppercase",
                            isHydrated ? "text-muted-foreground/40" : "bg-white/5 text-transparent rounded animate-pulse"
                        )}>
                            {media?.format || "ASSET"}
                        </span>
                        {isHydrated && (
                            <div className="flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 text-primary/50" />
                                <span className="text-[10px] font-bold tabular-nums text-muted-foreground/60">{media.score || "??"}</span>
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
