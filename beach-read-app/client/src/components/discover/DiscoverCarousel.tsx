import { Link, useNavigate } from 'react-router-dom';
import { Bookmark, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import type { MangaResult } from './types';
import { handleCoverImageError, sanitizeCoverUrl } from '../../lib/image';
import { useLibrary } from '../../hooks/useLibrary';
import { useAuth } from '../../context/auth-context';
import { useRef, useState, useEffect } from 'react';

interface DiscoverCarouselProps {
    title: string;
    mangaList: MangaResult[];
    loading: boolean;
    onViewAll?: () => void;
}

export function DiscoverCarousel({ title, mangaList, loading, onViewAll }: DiscoverCarouselProps) {
    const { user } = useAuth();
    const { library, addToLibrary, removeFromLibrary } = useLibrary();
    const navigate = useNavigate();
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
    }, [mangaList]);

    if (loading) {
        return (
            <div className="w-full mb-16">
                <div className="h-4 w-48 bg-muted/20 animate-pulse mb-6 rounded-sm"></div>
                <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="min-w-[140px] md:min-w-[180px] aspect-[2/3] bg-muted/10 animate-pulse rounded-sm shrink-0"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!mangaList || mangaList.length === 0) return null;

    const handleToggle = async (e: React.MouseEvent, manga: MangaResult) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            navigate('/login');
            return;
        }

        const isInLibrary = library.some(item => item.id === manga.id);
        if (isInLibrary) {
            await removeFromLibrary(manga.id);
        } else {
            await addToLibrary({ id: manga.id, title: manga.title, coverUrl: manga.coverUrl, genres: manga.genres });
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current;
            const scrollAmount = direction === 'left' ? -clientWidth * 0.8 : clientWidth * 0.8;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className="w-full mb-16 relative group/carousel">
            <div className="flex items-end justify-between mb-6 border-b border-border/40 pb-2">
                <h3 className="text-sm font-serif font-black tracking-tight text-foreground uppercase">{title}</h3>
                {onViewAll && (
                    <button
                        onClick={onViewAll}
                        className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors hover:underline"
                    >
                        View All Titles
                    </button>
                )}
            </div>

            <div className="relative group/arrows">
                {showLeftArrow && (
                    <button 
                        onClick={() => scroll('left')}
                        className="absolute left-[-20px] top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-background/80 backdrop-blur-md border border-border/40 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/arrows:opacity-100 transition-opacity hover:bg-foreground hover:text-background"
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}
                
                {showRightArrow && (
                    <button 
                        onClick={() => scroll('right')}
                        className="absolute right-[-20px] top-1/2 -translate-y-1/2 z-30 w-10 h-10 bg-background/80 backdrop-blur-md border border-border/40 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover/arrows:opacity-100 transition-opacity hover:bg-foreground hover:text-background"
                    >
                        <ChevronRight size={20} />
                    </button>
                )}

                <div 
                    ref={scrollRef}
                    onScroll={checkScroll}
                    className="flex gap-4 md:gap-6 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-hide scroll-smooth" 
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {mangaList.map(manga => {
                        const isInLibrary = library.some(item => item.id === manga.id);
                        return (
                            <Link key={manga.id} to={`/manga/${manga.id}`} className="shrink-0 w-[140px] md:w-[180px] snap-start group relative flex flex-col cursor-pointer">
                                <div className="w-full aspect-[2/3] relative rounded-sm overflow-hidden mb-3 bg-muted/10 border border-border/40 shadow-sm">
                                    <img
                                        src={sanitizeCoverUrl(manga.coverUrl)}
                                        alt={manga.title}
                                        onError={handleCoverImageError}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out brightness-[0.95] group-hover:brightness-100"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    {manga.status && (
                                        <div className="absolute top-2 left-2 z-10 bg-background/95 backdrop-blur-md px-1.5 py-0.5 border border-border/40 flex items-center gap-1.5 shadow-sm group-hover:opacity-0 transition-opacity duration-300">
                                            <span className={`w-1 h-1 rounded-full ${manga.status === 'RELEASING' ? 'bg-green-600' : 'bg-muted-foreground'}`}></span>
                                            <span className="text-[8px] font-mono font-bold tracking-widest text-foreground uppercase pt-px">
                                                {manga.status === 'NOT_YET_RELEASED' ? 'Upcoming' : manga.status}
                                            </span>
                                        </div>
                                    )}

                                    <button
                                        onClick={(e) => handleToggle(e, manga)}
                                        className={`absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-20 ${isInLibrary ? 'opacity-100 text-primary bg-black/60' : 'text-white'}`}
                                    >
                                        {isInLibrary ? <Check size={28} /> : <Bookmark size={28} />}
                                    </button>

                                    {manga.score ? (
                                        <div className="absolute bottom-2 right-2 text-[10px] font-mono font-bold tracking-widest text-white/90 z-10">
                                            {(manga.score / 10).toFixed(1)}
                                        </div>
                                    ) : null}
                                </div>
                                <h4 className="text-xs font-serif font-black tracking-tight text-foreground leading-snug mb-0.5 group-hover:text-foreground/70 transition-colors line-clamp-2 px-0.5">
                                    {manga.title}
                                </h4>
                                <p className="text-[9px] font-mono uppercase tracking-[0.1em] text-muted-foreground truncate opacity-70 px-0.5">
                                    {(manga.genres || []).slice(0, 1).join('') || 'Uncatalogued'}
                                </p>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
