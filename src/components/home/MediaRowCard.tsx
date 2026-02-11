import { ScoreDisplay } from "@/components/media/ScoreDisplay";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import type { DisplayMedia } from "@/types/display";
import { motion } from "framer-motion";
import { Edit2, Heart, Play } from "lucide-react";
import { Link } from "react-router-dom";

interface MediaRowCardProps {
    media: DisplayMedia;
    index?: number;
    className?: string;
}

export function MediaRowCard({ media, index = 0, className }: MediaRowCardProps) {
    const { user, getTitle } = useData();
    const title = getTitle(media);
    const scoreFormat = user?.scoreFormat || "POINT_10";
    const linkPath = `/${media.mediaType.toLowerCase()}/${media._seriesId}`;

    const progressPercent =
        media.episodes || media.chapters
            ? Math.min(100, (media.progress / (media.episodes || media.chapters || 1)) * 100)
            : 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
                duration: 0.4, 
                delay: index * 0.03,
                ease: [0.23, 1, 0.32, 1]
            }}
            whileHover={{ y: -8 }}
            className={cn("shrink-0", className || "w-[150px] md:w-[200px]")}
        >
            <Link to={linkPath} className="group flex flex-col gap-3">
                <div className="relative aspect-[2/3] rounded-[1.5rem] overflow-hidden bg-surface-2 shadow-sm group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-500 ring-1 ring-white/5 group-hover:ring-primary/40">
                    {/* Cover Image */}
                    {media.coverImage ? (
                        <motion.img
                            src={media.coverImage}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-elevated2">
                            <Play className="w-10 h-10 text-muted-foreground/20" />
                        </div>
                    )}

                    {/* Progress Bar (Task 4) */}
                    {progressPercent > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40 backdrop-blur-sm z-20">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                className="h-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.8)]"
                            />
                        </div>
                    )}

                    {/* Score Badge (Task 4) */}
                    {media.score > 0 && (
                        <div className="absolute top-3 right-3 z-20">
                            <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-xl px-2.5 py-1 shadow-2xl">
                                <ScoreDisplay score={media.score} format={scoreFormat} size="sm" />
                            </div>
                        </div>
                    )}

                    {/* Hover Overlay with Quick Actions (Task 4) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-center items-center gap-3">
                        <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/20"
                            onClick={(e) => {
                                e.preventDefault();
                                // TODO: Quick play action
                            }}
                        >
                            <Play className="w-6 h-6 fill-current translate-x-0.5" />
                        </motion.button>
                        
                        <div className="flex gap-2">
                            <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                                <Heart className="w-5 h-5" />
                            </button>
                            <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all">
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Info */}
                <div className="space-y-1 px-1">
                    <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
                            {media.mediaType === "ANIME" ? "Motion" : "Print"}
                        </span>
                        {media.format && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                <span className="text-[10px] font-bold text-muted-foreground/60">{media.format}</span>
                            </>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

