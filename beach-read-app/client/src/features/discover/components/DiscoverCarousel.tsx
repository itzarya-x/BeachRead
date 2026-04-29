import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { MangaResult } from './types';
import { MediaCard } from '../../../shared/ui/MediaCard';
import { Skeleton } from '../../../shared/ui/Skeleton';

interface DiscoverCarouselProps {
    title: string;
    mangaList: MangaResult[];
    loading: boolean;
    onViewAll?: () => void;
}

export function DiscoverCarousel({ title, mangaList, loading, onViewAll }: DiscoverCarouselProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [mangaList, loading]);

    if (loading) {
        return (
            <div className="w-full mb-16">
                <div className="flex items-end justify-between mb-6 border-b border-border/40 pb-2">
                    <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex gap-6 overflow-hidden">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="min-w-[180px] space-y-3">
                            <Skeleton className="aspect-[2/3] w-full rounded-2xl" />
                            <Skeleton className="h-3 w-3/4" />
                            <Skeleton className="h-2 w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!mangaList || mangaList.length === 0) return null;

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current;
            const scrollAmount = direction === 'left' ? -clientWidth * 0.8 : clientWidth * 0.8;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className="w-full mb-12 relative group/carousel">
            <div className="flex items-end justify-between mb-6 border-b border-border/40 pb-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-foreground/80">{title}</h3>
                {onViewAll && (
                    <button
                        onClick={onViewAll}
                        className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all hover:underline decoration-sakura-brand underline-offset-4"
                    >
                        View Collection
                    </button>
                )}
            </div>

            <div className="relative">
                <AnimatePresence>
                    {showLeftArrow && (
                        <motion.button 
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            onClick={() => scroll('left')}
                            className="absolute left-[-20px] top-[40%] -translate-y-1/2 z-30 w-11 h-11 bg-background/90 backdrop-blur-md border border-border/40 rounded-full flex items-center justify-center shadow-diffuse text-foreground hover:bg-foreground hover:text-background transition-all active:scale-90"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft size={20} />
                        </motion.button>
                    )}
                </AnimatePresence>
                
                <AnimatePresence>
                    {showRightArrow && (
                        <motion.button 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            onClick={() => scroll('right')}
                            className="absolute right-[-20px] top-[40%] -translate-y-1/2 z-30 w-11 h-11 bg-background/90 backdrop-blur-md border border-border/40 rounded-full flex items-center justify-center shadow-diffuse text-foreground hover:bg-foreground hover:text-background transition-all active:scale-90"
                            aria-label="Scroll right"
                        >
                            <ChevronRight size={20} />
                        </motion.button>
                    )}
                </AnimatePresence>

                <div 
                    ref={scrollRef}
                    onScroll={checkScroll}
                    className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide scroll-smooth" 
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {mangaList.map((manga, index) => (
                        <div key={manga.id} className="shrink-0 w-[160px] md:w-[200px] snap-start">
	                            <MediaCard
	                                id={manga.id}
	                                title={manga.title}
	                                coverUrl={manga.coverUrl}
	                                status={manga.status}
	                                mediaType={manga.mediaType === 'ANIME' ? 'ANIME' : 'MANGA'}
	                                index={index}
	                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
