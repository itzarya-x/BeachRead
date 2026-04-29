import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Bookmark, Check } from 'lucide-react';
import type { MangaResult } from './types';
import { handleCoverImageError, sanitizeCoverUrl } from '../../../shared/utils/image';
import { useAuth } from '../../auth/context/auth-context';
import { useLibrary } from '../../library/hooks/useLibrary';
import { STAGGER_CONTAINER, STAGGER_ITEM } from '../../../shared/utils/motion-variants';

interface TheReadingRoomProps {
    mangaList: MangaResult[];
    loading: boolean;
}

export function TheReadingRoom({ mangaList, loading }: TheReadingRoomProps) {
    const { user } = useAuth();
    const { library, addToLibrary, removeFromLibrary } = useLibrary();
    const navigate = useNavigate();

    if (loading && mangaList.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 opacity-50">
                <Loader2 className="h-6 w-6 animate-spin text-foreground mb-4" />
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-foreground/70">Accessing Records</p>
            </div>
        );
    }

    if (mangaList.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <p className="text-sm font-serif italic text-muted-foreground">We couldn't find any manga matching your specific criteria.</p>
            </div>
        );
    }

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
            await addToLibrary({
                id: manga.id,
                title: manga.title,
                coverUrl: manga.coverUrl,
                genres: manga.genres,
                mediaType: manga.mediaType
            });
        }
    };

    return (
        <div className={`transition-opacity duration-700 ease-in-out ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex w-full items-center justify-between pb-3 border-b border-foreground/10 mb-2 px-2">
                <span className="w-[10%] text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60 hidden sm:block">Ref</span>
                <span className="w-full sm:w-[60%] text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60">Title / Subject</span>
                <span className="w-[30%] text-[10px] font-mono tracking-widest uppercase text-muted-foreground/60 text-right hidden lg:block">Classification</span>
            </div>

            <motion.div 
                variants={STAGGER_CONTAINER}
                initial="hidden"
                animate="visible"
                className="flex flex-col group/list"
            >
                {mangaList.map((manga, idx) => {
                    const isInLibrary = library.some(item => item.id === manga.id);
                    return (
                        <motion.div
                            key={manga.id}
                            variants={STAGGER_ITEM}
                        >
                            <Link
                                to={`/manga/${manga.id}`}
                                className="group flex items-center py-4 px-2 border-b border-border/30 hover:bg-muted/10 transition-colors duration-300 relative"
                            >
                                <div className="w-[10%] shrink-0 text-[10px] font-mono tracking-widest text-muted-foreground/40 font-medium hidden sm:block group-hover:text-foreground/60 transition-colors">
                                    {(idx + 1).toString().padStart(4, '0')}
                                </div>

                                <div className="w-full sm:w-[60%] flex gap-5 items-center">
                                    <div className="w-12 h-16 sm:w-16 sm:h-24 shrink-0 overflow-hidden rounded bg-muted/20 border border-border/50 relative">
                                        <motion.img
                                            layoutId={`media-image-${manga.id}`}
                                            src={sanitizeCoverUrl(manga.coverUrl)}
                                            alt={manga.title}
                                            onError={handleCoverImageError}
                                            className="w-full h-full object-cover filter grayscale-[20%] group-hover:grayscale-0 transition-all duration-500 will-change-transform group-hover:scale-105"
                                        />

                                        {/* Library Toggle Overlay */}
                                        <button
                                            onClick={(e) => handleToggle(e, manga)}
                                            className={`absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${isInLibrary ? 'opacity-100 text-primary' : 'text-white'}`}
                                            aria-label={isInLibrary ? "Remove from library" : "Add to library"}
                                        >
                                            {isInLibrary ? <Check size={20} /> : <Bookmark size={20} />}
                                        </button>
                                    </div>
                                    <div className="flex flex-col justify-center min-w-0 pr-4">
                                        <motion.h3 
                                            layoutId={`media-title-${manga.id}`}
                                            className="text-base sm:text-lg font-serif font-black tracking-tight text-foreground truncate group-hover:text-foreground/80 transition-colors"
                                        >
                                            {manga.title}
                                        </motion.h3>
                                        <div className="flex items-center gap-3 mt-1.5 opacity-80">
                                            {manga.score ? (
                                                <p className="text-[11px] font-mono font-medium text-foreground tracking-widest">
                                                    {(manga.score / 10).toFixed(1)} / 10
                                                </p>
                                            ) : null}
                                            {manga.score && <span className="text-[10px] text-muted-foreground/40">•</span>}
                                            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.15em] text-muted-foreground truncate">
                                                {(manga.genres || []).slice(0, 2).join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-[30%] shrink-0 text-right hidden lg:flex flex-col justify-center items-end opacity-70 group-hover:opacity-100 transition-opacity">
                                    <div className="flex gap-2 flex-wrap justify-end">
                                        {mangaList[idx].genres.map(g => (
                                            <span key={g} className="text-[9px] border border-border/60 px-2 py-0.5 text-muted-foreground uppercase tracking-widest font-mono">
                                                {g}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Subtle interactive styling line */}
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-foreground scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center opacity-70"></div>
                            </Link>
                        </motion.div>
                    );
                })}
            </motion.div>
        </div>
    );
}
