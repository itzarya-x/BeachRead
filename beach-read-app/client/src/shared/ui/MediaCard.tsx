import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Star, Play, BookOpen, Clock } from 'lucide-react';
import { cn } from '../utils/cn';
import { Badge } from './Badge';
import { STAGGER_ITEM, CARD_FEEDBACK } from '../utils/motion-variants';

export interface MediaCardProps {
    id: string;
    title: string;
    coverUrl: string;
    mediaType: 'ANIME' | 'MANGA';
    status?: string;
    score?: number;
    episodes?: number;
    chapters?: number;
    progress?: number;
    className?: string;
    onClick?: () => void;
    index?: number;
}

const MediaCard: React.FC<MediaCardProps> = ({
    id,
    title,
    coverUrl,
    mediaType,
    status,
    score,
    episodes,
    chapters,
    className,
    onClick
}) => {
    const statusColorMap: Record<string, string> = {
        READING: 'var(--color-status-info)',
        COMPLETED: 'var(--color-status-success)',
        PLANNING: 'var(--color-status-neutral)',
        PAUSED: 'var(--color-status-warning)',
        DROPPED: 'var(--color-status-error)',
    };

    const currentStatusColor = status ? (statusColorMap[status.toUpperCase()] || 'var(--color-primary)') : 'var(--color-primary)';

    return (
        <motion.div
            variants={STAGGER_ITEM}
            initial="hidden"
            animate="show"
            {...CARD_FEEDBACK}
            className={cn("group relative flex flex-col gap-4 cursor-pointer", className)}
            onClick={onClick}
        >
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[32px] border border-border/40 bg-muted/20 shadow-sm transition-all duration-500 group-hover:shadow-2xl">
                <Link to={`/${(mediaType || 'ANIME').toLowerCase()}/${id}`} className="block h-full w-full">
                    {coverUrl ? (
                        <img
                            src={coverUrl}
                            alt={title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-muted-foreground/20" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    
                    {/* Hover Play/Read Icon */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                        <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-white shadow-2xl">
                            {mediaType === 'ANIME' ? <Play fill="currentColor" size={24} className="ml-1" /> : <BookOpen size={24} />}
                        </div>
                    </div>

                    {/* Score Badge */}
                    {score && (
                        <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-xl rounded-full border border-white/20">
                            <Star size={10} fill="#FFD700" className="text-[#FFD700]" />
                            <span className="text-[10px] font-black text-white tracking-tighter">{(score / 10).toFixed(1)}</span>
                        </div>
                    )}
                </Link>
                
                {status && (
                    <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-full z-10" style={{
                        background: currentStatusColor
                    }} />
                )}
            </div>

            <div className="px-1.5 space-y-2 text-left">
                <div className="flex items-center justify-between">
                    {status && (
                        <Badge variant={status.toLowerCase() as any} className="rounded-full px-2.5 py-0.5 border-none bg-primary/10 text-primary font-black text-[8px] uppercase flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                            {status.replace(/_/g, ' ')}
                        </Badge>
                    )}
                    {(episodes || chapters) && (
                        <span className="text-[9px] text-muted-foreground/60 font-black uppercase tracking-widest flex items-center gap-1">
                            <Clock size={8} />
                            {episodes ? `${episodes} Eps` : `${chapters} Chs`}
                        </span>
                    )}
                </div>

                <Link to={`/${(mediaType || 'ANIME').toLowerCase()}/${id}`}>
                    <h3 
                        className="text-[12px] font-black text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors uppercase tracking-tight"
                        title={title}
                    >
                        {title}
                    </h3>
                </Link>
            </div>
        </motion.div>
    );
};

export const MediaCardSkeleton: React.FC = () => (
    <div className="flex flex-col gap-4 w-full">
        <div className="aspect-[2/3] w-full skeleton-pulse rounded-[32px] border border-border/10" />
        <div className="px-1.5 space-y-2">
            <div className="flex justify-between items-center">
                <div className="w-16 h-4 skeleton-pulse rounded-full" />
                <div className="w-10 h-3 skeleton-pulse rounded-full" />
            </div>
            <div className="w-full h-4 skeleton-pulse rounded-md" />
            <div className="w-2/3 h-4 skeleton-pulse rounded-md" />
        </div>
    </div>
);

export { MediaCard };
