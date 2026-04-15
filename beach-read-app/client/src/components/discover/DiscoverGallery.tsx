import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { MangaResult } from './types';
import { handleCoverImageError, sanitizeCoverUrl } from '../../lib/image';

interface DiscoverGalleryProps {
    mangaList: MangaResult[];
    loading: boolean;
}

export function DiscoverGallery({ mangaList, loading }: DiscoverGalleryProps) {
    if (loading && mangaList.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 opacity-50">
                <Loader2 className="h-6 w-6 animate-spin text-foreground mb-4" />
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-foreground/70">Curating Gallery</p>
            </div>
        );
    }

    if (mangaList.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <p className="text-sm font-serif italic text-muted-foreground">The gallery is currently empty for these filters.</p>
            </div>
        );
    }

    return (
        <div className={`transition-opacity duration-700 ease-in-out ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-12">
                {mangaList.map((manga) => (
                    <Link key={manga.id} to={`/manga/${manga.id}`} className="group flex flex-col cursor-pointer relative">
                        <div className="w-full aspect-[2/3] relative rounded-sm overflow-hidden mb-4 bg-muted/10 border border-border/40 shadow-sm">
                            <img
                                src={sanitizeCoverUrl(manga.coverUrl)}
                                alt={manga.title}
                                onError={handleCoverImageError}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out brightness-[0.98] contrast-[1.02] group-hover:brightness-100"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Quick Info Badges (Comick style) */}
                            {manga.status && (
                                <div className="absolute top-2 left-2 z-10 bg-background/95 backdrop-blur-md px-1.5 py-0.5 border border-border/40 flex items-center gap-1.5 shadow-sm group-hover:opacity-0 transition-opacity duration-300">
                                    <span className={`w-1 h-1 rounded-full ${manga.status === 'RELEASING' ? 'bg-green-600' : manga.status === 'FINISHED' ? 'bg-foreground' : 'bg-muted-foreground'}`}></span>
                                    <span className="text-[8px] font-mono font-bold tracking-widest text-foreground uppercase pt-px">
                                        {manga.status === 'NOT_YET_RELEASED' ? 'Upcoming' : manga.status}
                                    </span>
                                </div>
                            )}

                            {/* Score overlay */}
                            {manga.score ? (
                                <div className="absolute bottom-3 right-3 text-[10px] font-mono font-bold tracking-widest text-white/90 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10">
                                    {(manga.score / 10).toFixed(1)}
                                </div>
                            ) : null}

                            {/* Anilist-style Hover Tooltip Overlay */}
                            <div className="absolute inset-0 z-20 bg-background/95 backdrop-blur-md p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between border border-border/50 scale-95 group-hover:scale-100 origin-center">
                                <div>
                                    <h4 className="text-xs font-serif font-black mb-2 line-clamp-2 text-foreground leading-tight tracking-tight">
                                        {manga.title}
                                    </h4>
                                    <p className="text-[10px] font-medium leading-relaxed text-muted-foreground line-clamp-[7]">
                                        {manga.description || 'No description available for this title.'}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1.5 mt-4 border-t border-border/40 pt-3 text-[9px] font-mono text-foreground uppercase tracking-widest">
                                    <div className="flex justify-between items-center">
                                        <span className="opacity-50">Format</span>
                                        <span className="font-bold">{manga.format || 'Unknown'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="opacity-50">Status</span>
                                        <span className="font-bold flex items-center gap-1.5">
                                            {manga.status === 'RELEASING' && <span className="w-1 h-1 rounded-full bg-green-600"></span>}
                                            {manga.status || 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="opacity-50">Year</span>
                                        <span className="font-bold">{manga.year || 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h3 className="text-sm font-serif font-black tracking-tight text-foreground leading-snug mb-1 group-hover:text-foreground/70 transition-colors line-clamp-2 px-1">
                            {manga.title}
                        </h3>
                        <p className="text-[9px] font-mono uppercase tracking-[0.1em] text-muted-foreground truncate opacity-70 px-1">
                            {(manga.genres || []).slice(0, 2).join(' • ') || 'Uncatalogued'}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
