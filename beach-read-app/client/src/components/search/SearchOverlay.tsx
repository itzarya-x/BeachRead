import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Command, TrendingUp, History, Star, ArrowRight, Loader2 } from 'lucide-react';
import { useSearch } from '../../hooks/useSearch';
import { handleCoverImageError, sanitizeCoverUrl } from '../../lib/image';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const { results, search, loading } = useSearch();
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [isOpen]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length > 1) {
                search(query);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query, search]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'Enter' && query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query)}`);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex flex-col items-center bg-background/80 backdrop-blur-xl animate-in fade-in duration-300">
            {/* Header / Close Button */}
            <div className="w-full max-w-[1200px] flex justify-end p-8">
                <button 
                    onClick={onClose}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-muted/20 hover:bg-muted/40 text-foreground transition-all group"
                >
                    <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
            </div>

            {/* Search Input Container */}
            <div className="w-full max-w-[800px] px-6 mt-12">
                <div className="relative group">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6 group-focus-within:text-primary transition-colors" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search for manga, authors, or genres..."
                        className="w-full h-[88px] bg-muted/10 border-2 border-border/50 rounded-[32px] pl-20 pr-32 text-2xl font-black text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50 focus:bg-background transition-all shadow-2xl"
                    />
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/20 rounded-xl border border-border/40 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            <Command size={12} /> Enter
                        </div>
                    </div>
                </div>

                {/* Results Area */}
                <div className="mt-12 w-full max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Searching Library</p>
                        </div>
                    ) : query.trim().length > 1 ? (
                        <div className="space-y-4 pb-20">
                            <div className="flex items-center justify-between mb-6 px-4">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Search Results</h3>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{results.length} results</span>
                            </div>
                            
                            {results.length > 0 ? (
                                results.map((manga) => (
                                    <button
                                        key={manga.id}
                                        onClick={() => {
                                            navigate(`/manga/${manga.id}`);
                                            onClose();
                                        }}
                                        className="w-full flex items-center gap-6 p-4 rounded-[24px] hover:bg-muted/30 border border-transparent hover:border-border/40 transition-all text-left group"
                                    >
                                        <div className="w-16 h-24 rounded-xl overflow-hidden shadow-lg shrink-0">
                                            <img 
                                                src={sanitizeCoverUrl(manga.coverUrl)} 
                                                onError={handleCoverImageError}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                                alt="" 
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-lg font-black text-foreground truncate uppercase tracking-tight">{manga.title}</h4>
                                                {manga.score && (
                                                    <div className="flex items-center gap-1 text-primary">
                                                        <Star size={12} fill="currentColor" />
                                                        <span className="text-xs font-black">{manga.score / 10}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {(manga.genres || []).slice(0, 3).map(genre => (
                                                    <span key={genre} className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{genre}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <ArrowRight className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-20 bg-muted/5 rounded-[32px] border-2 border-dashed border-border/40">
                                    <p className="text-muted-foreground italic text-sm">We couldn't find any manga matching your search.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Recent / Trending Section */
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pb-20">
                            <div>
                                <div className="flex items-center gap-3 mb-8 px-4">
                                    <History className="w-4 h-4 text-primary" />
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground">Recent Expeditions</h3>
                                </div>
                                <div className="space-y-2">
                                    {['Berserk', 'One Piece', 'Chainsaw Man'].map(item => (
                                        <button key={item} className="w-full text-left px-6 py-4 rounded-2xl hover:bg-muted/20 text-muted-foreground hover:text-foreground text-sm font-bold transition-all flex items-center justify-between group">
                                            {item}
                                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-8 px-4">
                                    <TrendingUp className="w-4 h-4 text-primary" />
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground">Active Trending</h3>
                                </div>
                                <div className="space-y-2">
                                    {['Dandadan', 'Solo Leveling', 'Vagabond'].map(item => (
                                        <button key={item} className="w-full text-left px-6 py-4 rounded-2xl hover:bg-muted/20 text-muted-foreground hover:text-foreground text-sm font-bold transition-all flex items-center justify-between group">
                                            {item}
                                            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
