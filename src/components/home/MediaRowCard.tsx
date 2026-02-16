import { ScoreDisplay } from "@/components/media/ScoreDisplay";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import type { DisplayMedia } from "@/types/display";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

interface MediaRowCardProps {
    media: DisplayMedia;
    index?: number;
    className?: string;
    variant?: "continue" | "updated" | "trending" | "standard";
}

export function MediaRowCard({ media, index = 0, className, variant = "standard" }: MediaRowCardProps) {
    const { user, getTitle } = useData();
    const title = getTitle(media);
    const scoreFormat = user?.scoreFormat || "POINT_10";
    const linkPath = `/${media.mediaType.toLowerCase()}/${media._seriesId}`;

    const progressPercent =
        media.episodes || media.chapters
            ? Math.min(100, (media.progress / (media.episodes || media.chapters || 1)) * 100)
            : 0;

    const timeSince = useMemo(() => {
        const diff = Date.now() - new Date(media.updatedAt).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        return "Just now";
    }, [media.updatedAt]);

    const isHydrated = media._enriched;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
                duration: 0.45, 
                delay: index * 0.05,
                ease: [0.23, 1, 0.32, 1]
            }}
            whileHover={isHydrated ? { y: -6 } : {}}
            className={cn(
                "shrink-0 group/card snap-start", 
                variant === "continue" ? "w-[240px] md:w-[420px]" : "w-[160px] md:w-[320px]",
                className
            )}
        >
            <div className="relative flex flex-col gap-3">
                <Link 
                    to={isHydrated ? linkPath : "#"} 
                    className={cn(
                        "relative aspect-[2/3] overflow-hidden rounded-xl border border-border bg-muted shadow-sm transition-all duration-300",
                        isHydrated ? "group-hover/card:border-primary/35 group-hover/card:shadow-md" : "animate-pulse"
                    )}
                >
                    {/* Cover Image */}
                    {media?.coverImage ? (
                        <motion.img
                            src={media.coverImage}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-[1.08]"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                            <Play className={cn("w-12 h-12 text-muted-foreground/30", !isHydrated && "animate-spin")} />
                        </div>
                    )}

                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70" />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-primary/20 to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />

                    {/* Resume Action */}
                    {isHydrated && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-300 z-30">
                             <div className="flex h-14 w-14 scale-75 items-center justify-center rounded-full border border-primary/25 bg-primary text-primary-foreground shadow-sm transition-transform duration-300 group-hover/card:scale-100">
                                <Play className="w-7 h-7 fill-current translate-x-0.5" />
                             </div>
                        </div>
                    )}

                    {/* Progress Bar */}
                    {(variant === "continue" || progressPercent > 0) && (
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/15 z-20">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                className="h-full bg-primary"
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        </div>
                    )}

                    {/* Float Indicators */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-20 pointer-events-none">
                         {variant === "updated" && (
                            <div className="rounded-lg border border-primary/30 bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                                UPDATED
                            </div>
                         )}
                         {media.score > 0 && variant !== "trending" && (
                            <div className="ml-auto rounded-lg border border-border/80 bg-card/95 px-2.5 py-1">
                                <ScoreDisplay score={media.score} format={scoreFormat} size="xs" />
                            </div>
                         )}
                    </div>

                    {isHydrated && (
                        <div className="absolute inset-x-3 bottom-3 z-20 pointer-events-none opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                            <div className="inline-flex items-center rounded-md border border-border/80 bg-card/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground/80">
                                Open details
                            </div>
                        </div>
                    )}
                </Link>

                {/* Info Display */}
                <div className="space-y-1.5 px-1">
                    <h3 className={cn(
                        "line-clamp-1 text-base font-semibold tracking-tight text-foreground transition-colors md:text-lg",
                        isHydrated ? "group-hover/card:text-primary" : "w-3/4 animate-pulse rounded-md bg-muted text-transparent"
                    )}>
                        {title || "Unknown Title"}
                    </h3>
                    
                    <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground transition-colors group-hover/card:text-foreground/80">
                        <div className="flex items-center gap-3">
                             {variant === "continue" && (
                                <span className="text-primary/80">
                                    {media?.mediaType === "ANIME" ? "EP" : "CH"} {media?.progress ?? 0} / {media?.episodes || media?.chapters || "?"}
                                </span>
                             )}
                             {variant === "updated" && (
                                <span className="text-primary/80">
                                    {media?.mediaType === "ANIME" ? `EP ${media?.progress ?? 0}` : `CH ${media?.progress ?? 0}`}
                                </span>
                             )}
                             {variant !== "continue" && variant !== "updated" && (
                                <span className={!isHydrated ? "rounded bg-muted px-2" : ""}>
                                    {media?.format || (isHydrated ? "FEATURE" : "LOADING")}
                                </span>
                             )}
                        </div>
                        
                        {variant === "updated" && isHydrated && (
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                                <span>{timeSince}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
