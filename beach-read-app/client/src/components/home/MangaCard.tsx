import { Link } from 'react-router-dom';
import { Bookmark, Check, Loader2, Plus, Minus, ArrowUpRight, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import { useLibrary } from '../../hooks/useLibrary';
import { useState } from 'react';
import { handleCoverImageError, sanitizeCoverUrl } from '../../lib/image';
import { FastActionSurface } from '../manga/FastActionSurface';

interface MangaCardProps {
    id: string;
    title: string;
    coverUrl: string;
    genres: string[];
    mediaType?: 'ANIME' | 'MANGA' | 'NOVEL';
}

export function MangaCard({ id, title, coverUrl, genres, mediaType = 'MANGA' }: MangaCardProps) {
    const { user } = useAuth();
    const { library, addToLibrary, removeFromLibrary, updateLibraryItem } = useLibrary();
    const [actionLoading, setActionLoading] = useState(false);
    const [showFastActions, setShowFastActions] = useState(false);

    if (id === 'view-all') {
        return (
            <Link to="/discover" className="flex aspect-[2/3] flex-col items-center justify-center rounded-2xl bg-[#011425] border border-white/5 shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-primary/20 group">
                <div className="mb-4 p-4 rounded-full bg-white/5 group-hover:bg-primary/20 transition-colors">
                    <ArrowUpRight className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-white text-sm font-black uppercase tracking-widest">Explore</span>
                <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] mt-2">View Details</span>
            </Link>
        );
    }

    const libraryItem = library.find(item => item.id === id);
    const isInLibrary = !!libraryItem;

    const handleLibraryToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!user) {
            window.location.href = '/login';
            return;
        }

        setActionLoading(true);
        try {
            if (isInLibrary) {
                await removeFromLibrary(id);
            } else {
                await addToLibrary({ id, title, coverUrl, genres, mediaType });
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleQuickUpdate = async (e: React.MouseEvent, increment: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (!libraryItem) return;
        
        setActionLoading(true);
        try {
            const newProgress = Math.max(0, (libraryItem.progress || 0) + increment);
            await updateLibraryItem(id, { progress: newProgress });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="group relative flex flex-col">
            <Link to={`/manga/${id}`} className="block">
                <div className="relative mb-5 aspect-[2/3.2] w-full overflow-hidden rounded-[24px] border border-border/40 bg-muted/20 shadow-xl transition-all duration-700 group-hover:shadow-2xl group-hover:shadow-primary/10 group-hover:-translate-y-1">
                    {coverUrl ? (
                        <img
                            src={sanitizeCoverUrl(coverUrl)}
                            alt={title}
                            onError={handleCoverImageError}
                            className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted/30">
                            <span className="text-muted-foreground/30 text-[9px] font-black uppercase tracking-[0.2em]">No Data</span>
                        </div>
                    )}
                    
                    {/* Status Indicator */}
                    {isInLibrary && (
                        <div className="absolute top-4 left-4 z-20">
                             <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border backdrop-blur-md ${
                                libraryItem.status === 'COMPLETED' 
                                    ? 'bg-green-500/20 border-green-500/40 text-green-400' 
                                    : 'bg-primary/20 border-primary/40 text-primary'
                             }`}>
                                {libraryItem.status}
                             </div>
                        </div>
                    )}

                    {/* Fast Actions Trigger */}
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowFastActions(!showFastActions);
                        }}
                        className="absolute top-4 right-4 z-40 p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:border-primary"
                    >
                        <MoreHorizontal size={16} />
                    </button>

                    {/* Fast Action Surface Overlay */}
                    {showFastActions && (
                        <div className="absolute inset-0 z-50 flex items-end justify-center p-2" onClick={(e) => e.stopPropagation()}>
                            <div className="w-full max-w-full">
                                <FastActionSurface 
                                    id={id} 
                                    title={title} 
                                    coverUrl={coverUrl} 
                                    genres={genres} 
                                    mediaType={mediaType}
                                    onClose={() => setShowFastActions(false)} 
                                />
                            </div>
                        </div>
                    )}

                    {/* Legacy Quick Actions Overlay (Hidden if FastActions is shown) */}
                    {!showFastActions && (
                        <div className="absolute inset-0 z-30 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-4 translate-y-2 group-hover:translate-y-0">
                            <div className="flex justify-end">
                                <button 
                                    onClick={handleLibraryToggle}
                                    disabled={actionLoading}
                                    className={`p-2.5 rounded-xl backdrop-blur-md border transition-all duration-300 hover:scale-110 active:scale-90 ${
                                        isInLibrary 
                                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/40' 
                                            : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                    }`}
                                >
                                    {actionLoading ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : isInLibrary ? (
                                        <Check size={16} />
                                    ) : (
                                        <Bookmark size={16} />
                                    )}
                                </button>
                            </div>

                            {isInLibrary && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-white mb-1">
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Progress</span>
                                        <span className="text-[11px] font-black">{mediaType === 'ANIME' ? 'EP' : 'CH'} {libraryItem.progress}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={(e) => handleQuickUpdate(e, -1)}
                                            className="flex-1 h-10 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl flex items-center justify-center transition-all active:scale-95"
                                        >
                                            <Minus size={14} className="text-white" />
                                        </button>
                                        <button 
                                            onClick={(e) => handleQuickUpdate(e, 1)}
                                            className="flex-1 h-10 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl flex items-center justify-center transition-all active:scale-95"
                                        >
                                            <Plus size={14} className="text-white" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Link>

            <div className="px-2 space-y-1.5">
                <h3 className="line-clamp-1 text-[13.5px] font-black uppercase tracking-tight text-foreground transition-colors group-hover:text-primary leading-none">
                    {title}
                </h3>
                {genres && genres.length > 0 && (
                    <div className="flex items-center gap-2">
                        <div className="h-px w-3 bg-primary/40" />
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest truncate">
                            {(genres || [])[0]}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
