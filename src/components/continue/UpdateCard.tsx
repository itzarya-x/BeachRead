import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import type { DisplayMedia } from "@/types/display";
import { motion } from "framer-motion";
import { BookOpen, Check, Play, Plus, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/YuraButton";
import { formatDistanceToNow } from "date-fns";

interface UpdateCardProps {
    media: DisplayMedia;
    onIncrement: (id: number, current: number) => void;
    onComplete: (id: number) => void;
}

export function UpdateCard({ media, onIncrement, onComplete }: UpdateCardProps) {
    const { getTitle } = useData();
    const title = getTitle(media);
    const linkPath = `/${media.mediaType.toLowerCase()}/${media._seriesId}`;

    const total = media.episodes || media.chapters || 0;
    const current = media.progress || 0;
    const hasUpdate = total > current;
    const diff = total - current;
    
    // Progress calculation
    const progressPercent = total > 0 ? Math.min(100, (current / total) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative flex overflow-hidden rounded-2xl border border-white/5 bg-card/40 hover:bg-card/60 transition-colors"
        >
            {/* Cover Image */}
            <Link to={linkPath} className="shrink-0 w-[80px] md:w-[100px] relative">
                {media.coverImage ? (
                    <img 
                        src={media.coverImage} 
                        alt={title} 
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        loading="lazy"
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center bg-white/5 text-white/10">
                        {media.mediaType === "ANIME" ? <Play className="w-8 h-8" /> : <BookOpen className="w-8 h-8" />}
                    </div>
                )}
                
                {/* Type Badge */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/60">
                        {media.format || media.mediaType}
                    </span>
                </div>
            </Link>

            {/* Content */}
            <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                        <Link to={linkPath} className="block group-hover:text-primary transition-colors">
                            <h3 className="text-sm font-bold leading-tight line-clamp-2 text-white/90">
                                {title}
                            </h3>
                        </Link>
                        
                        {/* New Update Badge */}
                        {hasUpdate && (
                            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-[9px] font-black uppercase tracking-wide text-primary shadow-glow-sm">
                                {diff > 1 ? `+${diff} New` : "New"}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-medium text-white/40">
                        <span>
                            {media.mediaType === "ANIME" ? "Ep" : "Ch"} {current}
                            {total > 0 && <span className="opacity-50"> / {total}</span>}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span>{formatDistanceToNow(new Date(media.updatedAt), { addSuffix: true })}</span>
                    </div>
                </div>

                <div className="space-y-3 mt-3">
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className={cn(
                                "h-full rounded-full",
                                hasUpdate ? "bg-primary shadow-glow-sm" : "bg-white/30"
                            )}
                        />
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            {media.score > 0 && (
                                <div className="flex items-center gap-1 text-[10px] font-black text-yellow-500">
                                    <Star className="w-3 h-3 fill-current" />
                                    {media.score}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onComplete(Number(media._entryId))}
                                className="h-8 px-2 text-white/40 hover:text-green-400 hover:bg-green-400/10"
                                title="Mark Complete"
                            >
                                <Check className="w-4 h-4" />
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => onIncrement(Number(media._entryId), current)}
                                className="h-8 px-3 gap-1 bg-white/10 hover:bg-primary hover:text-white border-transparent text-white/80"
                            >
                                <Plus className="w-3 h-3" />
                                1
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
