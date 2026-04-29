import { Link } from 'react-router-dom';
import { Bookmark, Check, Loader2, Plus, Minus, MoreHorizontal, Play, Book } from 'lucide-react';
import { useAuth } from '../../auth/context/auth-context';
import { useLibrary } from '../../library/hooks/useLibrary';
import { useState, useEffect, useRef } from 'react';
import { handleCoverImageError, sanitizeCoverUrl } from '../../../shared/utils/image';
import { FastActionSurface } from './FastActionSurface';
import { useToast } from '../../../app/providers/ToastContext';
import { Badge } from '../../../shared/ui/Badge';
import { Button } from '../../../shared/ui/Button';

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
    const { showToast } = useToast();
    const [actionLoading, setActionLoading] = useState(false);
    const [showFastActions, setShowFastActions] = useState(false);
    const [localProgress, setLocalProgress] = useState<number | null>(null);
    const debounceTimer = useRef<number | null>(null);

    const handleSearchMedia = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const query = mediaType === 'ANIME' ? `${title} watch online` : `${title} read online`;
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    };

    const libraryItem = library.find(item => item.id === id);
    const isInLibrary = !!libraryItem;

    useEffect(() => {
        if (libraryItem && debounceTimer.current === null) {
            setLocalProgress(libraryItem.progress || 0);
        }
    }, [libraryItem]);

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

    const handleQuickUpdate = (e: React.MouseEvent, increment: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (!libraryItem || localProgress === null) return;

        const nextProgress = Math.max(0, localProgress + increment);
        setLocalProgress(nextProgress);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = window.setTimeout(async () => {
            setActionLoading(true);
            showToast('Syncing progress...', 'info');
            try {
                await updateLibraryItem(id, { progress: nextProgress });
            } catch (err) {
                showToast('Failed to sync progress', 'error');
            } finally {
                setActionLoading(false);
                debounceTimer.current = null;
            }
        }, 500);
    };

    return (
        <div className="group relative flex flex-col gap-3">
            <Link to={`/manga/${id}`} className="block">
                <div className="relative aspect-[2/3.2] w-full overflow-hidden rounded-2xl border border-border/40 bg-muted/20 shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:-translate-y-1.5">
                    {coverUrl ? (
                        <img
                            src={sanitizeCoverUrl(coverUrl)}
                            alt={title}
                            onError={handleCoverImageError}
                            className="h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted/30">
                            <span className="text-muted-foreground/30 text-[9px] font-bold uppercase tracking-widest">No Data</span>
                        </div>
                    )}

                    {/* Status Indicator */}
                    {isInLibrary && (
                        <div className="absolute top-4 left-4 z-20">
                            <Badge variant={libraryItem.status?.toLowerCase() as any}>
                                {libraryItem.status}
                            </Badge>
                        </div>
                    )}

                    {/* Fast Actions Trigger */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowFastActions(!showFastActions);
                        }}
                        className="absolute top-4 right-4 z-40 p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-foreground hover:text-background"
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

                    {/* Quick Actions Overlay */}
                    {!showFastActions && (
                        <div className="absolute inset-0 z-30 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-4 translate-y-2 group-hover:translate-y-0">
                            <div className="flex justify-end gap-2">
                                <Button
                                    onClick={handleSearchMedia}
                                    variant="ghost"
                                    size="icon"
                                    className="bg-white/10 border-white/20 text-white backdrop-blur-md hover:bg-white/20"
                                    title={mediaType === 'ANIME' ? 'Watch' : 'Read'}
                                >
                                    {mediaType === 'ANIME' ? <Play size={16} fill="currentColor" /> : <Book size={16} />}
                                </Button>
                                <Button
                                    onClick={handleLibraryToggle}
                                    disabled={actionLoading}
                                    variant="ghost"
                                    size="icon"
                                    className={`backdrop-blur-md border transition-all ${isInLibrary
                                        ? 'bg-foreground border-foreground text-background shadow-lg'
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
                                </Button>
                            </div>

                            {isInLibrary && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between text-white mb-1 px-1">
                                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Progress</span>
                                        <span className="text-[11px] font-bold">{mediaType === 'ANIME' ? 'EP' : 'CH'} {localProgress}</span>
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

            <div className="px-0.5 space-y-1">
                <h3 className="line-clamp-2 text-[14px] font-bold tracking-tight text-foreground transition-colors group-hover:text-muted-foreground leading-snug">
                    {title}
                </h3>
                {genres && genres.length > 0 && (
                    <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest truncate">
                        {(genres || [])[0]}
                    </p>
                )}
            </div>
        </div>
    );
}
