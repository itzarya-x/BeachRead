import React, { useState, useEffect, useMemo } from 'react';
import { useLibrary } from '../hooks/useLibrary';
import { Loader2, Book, Trash2, ArrowUpDown, LayoutGrid, List as ListIcon, Search, Heart, MoreHorizontal } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { handleCoverImageError, sanitizeCoverUrl } from '../lib/image';
import { FastActionSurface } from '../components/manga/FastActionSurface';

type SortOption = 'TITLE' | 'PROGRESS' | 'SCORE' | 'RECENT';

function toTitle(value: unknown): string {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        const v = value as Record<string, unknown>;
        if (typeof v.english === 'string') return v.english;
        if (typeof v.romaji === 'string') return v.romaji;
        if (typeof v.userPreferred === 'string') return v.userPreferred;
    }
    return '';
}

function toTimestamp(value?: string | null): number {
    if (!value) return 0;
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? 0 : timestamp;
}

const Library: React.FC<{ mediaTypeOverride?: 'ANIME' | 'MANGA' | 'NOVEL' }> = ({ mediaTypeOverride }) => {
    const { library, loading, removeFromLibrary } = useLibrary();
    const location = useLocation();
    const [filter, setFilter] = useState<string>('ALL');
    const [mediaFilter, setMediaFilter] = useState<'ALL' | 'ANIME' | 'MANGA' | 'NOVEL'>(mediaTypeOverride || 'ALL');
    const [sortBy, setSortBy] = useState<SortOption>('RECENT');
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFastActions, setActiveFastActions] = useState<string | null>(null);
    const normalizedQuery = searchQuery.toLowerCase();

    // Extract all unique custom lists from the library
    const availableCustomLists = useMemo(() => {
        const lists = new Set<string>();
        library.forEach(item => {
            (item.customLists || []).forEach(list => lists.add(list));
        });
        return Array.from(lists).sort();
    }, [library]);

    useEffect(() => {
        if (mediaTypeOverride) {
            setMediaFilter(mediaTypeOverride);
            return;
        }
        const params = new URLSearchParams(location.search);
        const f = params.get('filter');
        const mf = params.get('type') as any;
        if (f) setFilter(f);
        if (mf && ['ALL', 'ANIME', 'MANGA', 'NOVEL'].includes(mf)) setMediaFilter(mf);
    }, [location.search, mediaTypeOverride]);

    const filteredLibrary = library.filter(item => {
        const safeTitle = toTitle(item.title);
        
        const filterUpper = filter.toUpperCase();
        let matchesFilter = filterUpper === 'ALL';
        if (!matchesFilter) {
            if (filterUpper === 'FAVOURITES') {
                matchesFilter = !!item.isFavourite;
            } else if (['READING', 'COMPLETED', 'PLANNING', 'DROPPED', 'PAUSED'].includes(filterUpper)) {
                matchesFilter = item.status === filterUpper;
            } else {
                // Custom list filter - try exact match first, then case-insensitive if needed
                matchesFilter = (item.customLists || []).includes(filter) || 
                               (item.customLists || []).some(l => l.toUpperCase() === filterUpper);
            }
        }

        const matchesMediaFilter = mediaFilter === 'ALL' || item.mediaType === mediaFilter;
        const matchesSearch = safeTitle.toLowerCase().includes(normalizedQuery);
        return matchesFilter && matchesMediaFilter && matchesSearch;
    }).sort((a, b) => {
        const aTitle = toTitle(a.title);
        const bTitle = toTitle(b.title);
        if (sortBy === 'TITLE') return aTitle.localeCompare(bTitle);
        if (sortBy === 'PROGRESS') return (b.progress || 0) - (a.progress || 0);
        if (sortBy === 'SCORE') return (b.score || 0) - (a.score || 0);
        const recentDiff = toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt);
        if (recentDiff !== 0) return recentDiff;
        return aTitle.localeCompare(bTitle);
    });

    if (loading && library.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-background pb-20 px-6 md:px-[64px]">
            <div className="max-w-[1400px] mx-auto">
                <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-10 mb-16">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4">Personal Collection</p>
                        <h1 className="text-6xl md:text-7xl font-black tracking-[-0.04em] text-foreground uppercase leading-[0.85]">Reading<br/>Library</h1>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                        {/* Media Type Filters */}
                        <div className="flex bg-muted/20 p-1 rounded-2xl border border-border/40">
                            {(['ALL', 'ANIME', 'MANGA', 'NOVEL'] as const).map((mf) => (
                                <button
                                    key={mf}
                                    onClick={() => setMediaFilter(mf)}
                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                        mediaFilter === mf 
                                            ? 'bg-background text-primary shadow-sm' 
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {mf === 'ALL' ? 'Total' : mf}
                                </button>
                            ))}
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full md:w-64 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text"
                                placeholder="Search collection..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-muted/10 border border-border/40 rounded-2xl pl-12 pr-4 py-3 text-xs font-bold text-foreground outline-none focus:bg-background focus:border-primary/50 transition-all"
                            />
                        </div>

                        {/* Status Filters */}
                        <div className="flex bg-muted/20 p-1 rounded-2xl border border-border/40 overflow-x-auto hide-scrollbar max-w-full md:max-w-md lg:max-w-xl">
                            {['ALL', 'READING', 'COMPLETED', 'PLANNING', 'FAVOURITES', ...availableCustomLists].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                        filter === f 
                                            ? 'bg-background text-foreground shadow-sm' 
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-2 px-4 py-3 bg-muted/20 border border-border/40 rounded-2xl relative">
                            <ArrowUpDown size={14} className="text-muted-foreground" />
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="bg-transparent text-[10px] font-black uppercase tracking-widest text-foreground outline-none cursor-pointer pr-4"
                            >
                                <option value="RECENT">Recent</option>
                                <option value="TITLE">Title</option>
                                <option value="PROGRESS">Progress</option>
                                <option value="SCORE">Score</option>
                            </select>
                        </div>

                        {/* View Toggles */}
                        <div className="flex bg-muted/20 p-1 rounded-2xl border border-border/40">
                            <button 
                                onClick={() => setViewMode('GRID')}
                                className={`p-2.5 rounded-xl transition-all ${viewMode === 'GRID' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button 
                                onClick={() => setViewMode('LIST')}
                                className={`p-2.5 rounded-xl transition-all ${viewMode === 'LIST' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground'}`}
                            >
                                <ListIcon size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {filteredLibrary.length === 0 ? (
                    <div className="py-40 flex flex-col items-center justify-center text-center border-2 border-dashed border-border/50 rounded-[48px] bg-muted/5 group">
                        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-8 transition-all duration-500 group-hover:scale-110">
                            <Book className="w-10 h-10 text-muted-foreground opacity-30 group-hover:text-primary transition-colors" />
                        </div>
                        <h3 className="text-3xl font-black text-foreground mb-4 uppercase tracking-tight">List Empty</h3>
                        <p className="text-muted-foreground text-base max-w-sm italic mb-12">
                            {searchQuery ? "No results found matching your query." : "You haven't added any manga to this category yet. Start exploring."}
                        </p>
                        <Link 
                            to="/discover"
                            className="px-12 py-5 bg-foreground text-background text-[11px] font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all shadow-xl"
                        >
                            Explore Global Collection
                        </Link>
                    </div>
                ) : viewMode === 'GRID' ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-8">
                        {filteredLibrary.map((item) => (
                            <div key={item.id} className="group relative">
                                <div className="block aspect-[2/3.2] rounded-[32px] overflow-hidden bg-muted/20 border border-white/5 shadow-2xl transition-all duration-700 group-hover:scale-[1.03] group-hover:shadow-primary/20 relative">
                                    <Link to={`/manga/${item.id}`} className="block w-full h-full">
                                        <img 
                                            src={sanitizeCoverUrl(item.coverUrl)}
                                            alt={toTitle(item.title)}
                                            onError={handleCoverImageError}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />
                                    </Link>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                    
                                    {/* Action Overlays */}
                                    <div className="absolute top-4 right-4 flex flex-col gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-75 z-20">
                                        <button 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setActiveFastActions(activeFastActions === item.id ? null : item.id);
                                            }}
                                            className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 text-white rounded-2xl flex items-center justify-center hover:bg-primary transition-colors shadow-lg"
                                        >
                                            <MoreHorizontal size={16} />
                                        </button>
                                        <button 
                                            onClick={(e) => {
                                                e.preventDefault();
                                                removeFromLibrary(item.id);
                                            }}
                                            className="w-10 h-10 bg-destructive/80 backdrop-blur-md text-white rounded-2xl flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {activeFastActions === item.id && (
                                        <div className="absolute inset-0 z-30 p-2 flex items-end">
                                            <FastActionSurface 
                                                id={item.id}
                                                title={toTitle(item.title)}
                                                coverUrl={item.coverUrl}
                                                genres={item.genres || []}
                                                mediaType={item.mediaType}
                                                onClose={() => setActiveFastActions(null)}
                                            />
                                        </div>
                                    )}

                                    <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none">
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {(item.genres || []).slice(0, 2).map(g => (
                                                <span key={g} className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[8px] font-black uppercase text-white tracking-widest">
                                                    {g}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-6 space-y-2 px-2">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                                            item.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' :
                                            item.status === 'READING' ? 'bg-primary/10 text-primary' :
                                            'bg-muted/40 text-muted-foreground'
                                        }`}>
                                            {item.status}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <span className="text-[10px] font-black">{item.mediaType === 'ANIME' ? 'EP' : 'CH'} {item.progress}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-[15px] font-black text-foreground truncate uppercase tracking-tight group-hover:text-primary transition-colors duration-300">{toTitle(item.title)}</h3>
                                    {item.score > 0 && (
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < Math.round(item.score / 2) ? 'bg-primary' : 'bg-muted'}`} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* List View */
                    <div className="space-y-4">
                        {filteredLibrary.map((item) => (
                            <div key={item.id} className="group flex items-center gap-8 p-6 rounded-[32px] bg-muted/5 border border-border/40 hover:bg-muted/10 hover:border-primary/20 transition-all">
                                <Link to={`/manga/${item.id}`} className="w-16 h-24 rounded-2xl overflow-hidden shadow-lg shrink-0">
                                    <img src={sanitizeCoverUrl(item.coverUrl)} onError={handleCoverImageError} className="w-full h-full object-cover" alt="" />
                                </Link>
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">{toTitle(item.title)}</h3>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
                                            item.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' :
                                            item.status === 'READING' ? 'bg-primary/10 text-primary' :
                                            'bg-muted/40 text-muted-foreground'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Progress</span>
                                            <span className="text-sm font-black text-foreground">{item.mediaType === 'ANIME' ? 'Episode' : 'Chapter'} {item.progress}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Score</span>
                                            <span className="text-sm font-black text-foreground">{item.score > 0 ? `${item.score}/10` : '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {(item.genres || []).slice(0, 3).map(g => (
                                                <span key={g} className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{g}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    {item.isFavourite && (
                                        <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 shadow-sm">
                                            <Heart size={18} fill="currentColor" />
                                        </div>
                                    )}
                                    <button 
                                        onClick={() => removeFromLibrary(item.id)}
                                        className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive hover:text-white transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Library;
