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

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
                duration: 0.8, 
                delay: index * 0.05,
                ease: [0.23, 1, 0.32, 1]
            }}
            whileHover={{ y: -12 }}
            className={cn("shrink-0 group/card", className || "w-[200px] md:w-[320px]")}
        >
            <div className="relative flex flex-col gap-5">
                <Link to={linkPath} className="relative aspect-[2/3] rounded-[1.5rem] overflow-hidden bg-[#101827] shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-500 ring-1 ring-white/5 group-hover/card:ring-primary/50 group-hover/card:shadow-[0_40px_80px_rgba(0,0,0,0.8)]">
                    {/* Cover Image */}
                    {media.coverImage ? (
                        <motion.img
                            src={media.coverImage}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                            <Play className="w-12 h-12 text-white/10" />
                        </div>
                    )}

                    {/* Gradient Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                    {/* Resume Action (Always available on hover for discovery) */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-300 z-30">
                         <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground shadow-glow flex items-center justify-center scale-75 group-hover/card:scale-100 transition-transform duration-500">
                            <Play className="w-10 h-10 fill-current translate-x-1" />
                         </div>
                    </div>

                    {/* Progress Bar (Always visible for Continue variant, or if progress > 0) */}
                    {(variant === "continue" || progressPercent > 0) && (
                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/10 z-20">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                className="h-full bg-primary shadow-glow"
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        </div>
                    )}

                    {/* Float Indicators */}
                    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-20 pointer-events-none">
                         {variant === "updated" && (
                            <div className="backdrop-blur-xl bg-primary/20 border border-primary/30 rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary shadow-2xl">
                                UPDATED
                            </div>
                         )}
                         {media.score > 0 && variant !== "trending" && (
                            <div className="ml-auto backdrop-blur-xl bg-black/40 border border-white/10 rounded-xl px-2.5 py-1">
                                <ScoreDisplay score={media.score} format={scoreFormat} size="xs" />
                            </div>
                         )}
                    </div>
                </Link>

                {/* Info Display (Minimal Reading) */}
                <div className="space-y-2 px-1">
                    <h3 className="text-lg md:text-xl font-black text-white line-clamp-1 tracking-tight group-hover/card:text-primary transition-colors">
                        {title}
                    </h3>
                    
                    <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.2em] text-white/20 group-hover/card:text-white/40 transition-colors">
                        <div className="flex items-center gap-3">
                             {variant === "continue" && (
                                <span className="text-primary/60">
                                    {media.mediaType === "ANIME" ? "EP" : "CH"} {media.progress} / {media.episodes || media.chapters || "?"}
                                </span>
                             )}
                             {variant === "updated" && (
                                <span className="text-primary/60">
                                    {media.mediaType === "ANIME" ? `EP ${media.progress}` : `CH ${media.progress}`}
                                </span>
                             )}
                             {variant !== "continue" && variant !== "updated" && (
                                <span>{media.format || "FEATURE"}</span>
                             )}
                        </div>
                        
                        {variant === "updated" && (
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-white/10" />
                                <span>{timeSince}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

