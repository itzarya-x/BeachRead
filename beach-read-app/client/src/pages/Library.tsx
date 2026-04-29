import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { useLibrary } from '../features/library/hooks/useLibrary';
import {
    LayoutGrid, List as ListIcon, Search, Heart,
    Play, BookOpen, Edit3, Wind, Coffee, SlidersHorizontal,
    Layers, Star
} from 'lucide-react';

import { Link, useLocation } from 'react-router-dom';
import { handleCoverImageError, sanitizeCoverUrl } from '../shared/utils/image';
import { FastActionSurface } from '../features/manga/components/FastActionSurface';
import { LibrarySkeleton } from '../shared/ui/PageSkeletons';
import BulkManagement from '../features/library/components/BulkManagement';
import { useAuth } from '../features/auth/context/auth-context';
import { useToast } from '../app/providers/ToastContext';
import { MediaCard } from '../shared/ui/MediaCard';
import { Surface } from '../shared/ui/Surface';
import { Button } from '../shared/ui/Button';
import { EmptyState } from '../shared/ui/EmptyState';

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

/* ── Status colour helper ── */
const STATUS_COLORS: Record<string, string> = {
    READING: 'status-badge-reading',
    COMPLETED: 'status-badge-completed',
    PLANNING: 'status-badge-planning',
    PAUSED: 'status-badge-paused',
    DROPPED: 'status-badge-dropped',
    FAVOURITES: 'text-primary bg-muted border-primary/30',
};
const statusStyle = (s: string) =>
    STATUS_COLORS[s.toUpperCase()] || 'text-muted-foreground bg-muted border-border';

/* ── Pill button (reusable, DRY) ── */
const Pill = ({
    active, onClick, children, accent = 'dark'
}: { active: boolean; onClick: () => void; children: React.ReactNode; accent?: 'dark' | 'warm' }) => (
    <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-pressed={active}
        className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap border outline-none focus-visible:ring-2 focus-visible:ring-primary ${active
                ? accent === 'warm'
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                    : 'bg-foreground text-white border-foreground shadow-lg shadow-foreground/20'
                : 'bg-background text-muted-foreground border-border/60 hover:border-foreground/40 hover:text-foreground'
            }`}
    >
        {children}
    </motion.button>
);

const Library: React.FC<{ mediaTypeOverride?: 'ANIME' | 'MANGA' | 'NOVEL' }> = ({ mediaTypeOverride }) => {
    const { user } = useAuth();
    const { library, loading, updateLibraryItem, refreshLibrary } = useLibrary();
    const { showToast } = useToast();
    const location = useLocation();

    const [filter, setFilter] = useState<string>('ALL');
    const [mediaFilter, setMediaFilter] = useState<'ALL' | 'ANIME' | 'MANGA' | 'NOVEL'>(mediaTypeOverride || 'ALL');
    const [sortBy, setSortBy] = useState<SortOption>('RECENT');
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');
    const [activeFastActions, setActiveFastActions] = useState<string | null>(null);
    const [isBulkManaging, setIsBulkManaging] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);

    // Sync state from URL
    useEffect(() => {
        if (mediaTypeOverride) { setMediaFilter(mediaTypeOverride); return; }
        const params = new URLSearchParams(location.search);
        const f = params.get('filter');
        const mf = params.get('type') as any;
        const vm = params.get('view') as any;
        const sort = params.get('sort') as any;
        
        if (f) setFilter(f);
        if (mf && ['ALL', 'ANIME', 'MANGA', 'NOVEL'].includes(mf)) setMediaFilter(mf);
        if (vm && ['GRID', 'LIST'].includes(vm)) setViewMode(vm);
        if (sort) setSortBy(sort);
    }, [location.search, mediaTypeOverride]);

    // Derived URL syncing for Search Query
    const searchQuery = new URLSearchParams(location.search).get('q') || '';
    const setSearchQuery = (q: string) => {
        const params = new URLSearchParams(location.search);
        if (q) params.set('q', q);
        else params.delete('q');
        window.history.replaceState({}, '', `${location.pathname}?${params.toString()}`);
    };

    const normalizedQuery = searchQuery.toLowerCase();

    const handleSearchMedia = (e: React.MouseEvent, item: any) => {
        e.preventDefault(); e.stopPropagation();
        const q = item.mediaType === 'ANIME'
            ? `${toTitle(item.title)} watch online`
            : `${toTitle(item.title)} read online`;
        window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, '_blank');
    };

    const filteredLibrary = library.filter(item => {
        const safeTitle = toTitle(item.title);
        const filterUpper = filter.toUpperCase();
        let matchesFilter = filterUpper === 'ALL';
        if (!matchesFilter) {
            if (filterUpper === 'FAVOURITES') matchesFilter = !!item.isFavourite;
            else if (['READING', 'COMPLETED', 'PLANNING', 'DROPPED', 'PAUSED'].includes(filterUpper))
                matchesFilter = item.status === filterUpper;
            else
                matchesFilter = (item.customLists || []).includes(filter) ||
                    (item.customLists || []).some(l => l.toUpperCase() === filterUpper);
        }
        const matchesMedia = mediaFilter === 'ALL' || item.mediaType === mediaFilter;
        const matchesSearch = safeTitle.toLowerCase().includes(normalizedQuery);
        return matchesFilter && matchesMedia && matchesSearch;
    }).sort((a, b) => {
        const aT = toTitle(a.title), bT = toTitle(b.title);
        if (sortBy === 'TITLE') return aT.localeCompare(bT);
        if (sortBy === 'PROGRESS') return (b.progress || 0) - (a.progress || 0);
        if (sortBy === 'SCORE') return (b.score || 0) - (a.score || 0);
        const d = toTimestamp(b.updatedAt) - toTimestamp(a.updatedAt);
        return d !== 0 ? d : aT.localeCompare(bT);
    });

    if (loading && library.length === 0) return <LibrarySkeleton />;

    return (
        <div className="w-full min-h-screen pb-24 selection:bg-muted-foreground selection:text-white relative bg-background pt-32 text-left">
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />

            {isBulkManaging && user && (
                <BulkManagement
                    userId={user.id}
                    items={filteredLibrary}
                    onClose={() => setIsBulkManaging(false)}
                    onComplete={() => void refreshLibrary()}
                />
            )}

            <div className="max-w-[1400px] mx-auto px-6 md:px-[64px] pt-16 relative z-10">

                {/* ── PAGE HEADER ── */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <Wind className="w-4 h-4 opacity-60" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Personal Collection</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif italic text-foreground leading-none tracking-tight">
                            The <span className="text-primary">Archive</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground opacity-40 group-focus-within:opacity-100 transition-opacity" aria-hidden="true" />
                            <input
                                type="text"
                                placeholder="Locate memory..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                aria-label="Search library"
                                className="pl-10 pr-6 py-3 bg-card border border-border rounded-full text-xs font-serif italic text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/20 w-[240px] shadow-sm transition-all"
                            />
                        </div>
                        <Button
                            onClick={() => setIsBulkManaging(true)}
                            variant="outline"
                            size="icon"
                            className="h-10 w-10"
                            title="Bulk Management"
                            aria-label="Bulk Management"
                        >
                            <Edit3 size={18} />
                        </Button>
                    </div>
                </div>

                {/* ── FILTERS & TOOLS ── */}
                <div className="flex flex-col gap-6 mb-12">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                        <div className="flex flex-wrap items-center gap-2" role="tablist">
                            <Pill active={filter === 'ALL'} onClick={() => setFilter('ALL')}>Universal</Pill>
                            <Pill active={filter === 'READING'} onClick={() => setFilter('READING')}>Current</Pill>
                            <Pill active={filter === 'FAVOURITES'} onClick={() => setFilter('FAVOURITES')} accent="warm">Cherished</Pill>
                            <Pill active={filter === 'COMPLETED'} onClick={() => setFilter('COMPLETED')}>Finished</Pill>
                            <Pill active={filter === 'PLANNING'} onClick={() => setFilter('PLANNING')}>Intentions</Pill>
                            <Button
                                onClick={() => setFilterOpen(!filterOpen)}
                                variant={filterOpen ? 'primary' : 'outline'}
                                size="icon"
                                aria-label="Toggle advanced filters"
                                aria-expanded={filterOpen}
                                className="h-9 w-9"
                            >
                                <SlidersHorizontal size={14} />
                            </Button>
                        </div>

                        <Surface variant="glass" withPadding={false} className="flex items-center gap-4 p-1.5 rounded-full border-border/40">
                            <div className="flex bg-muted/20 rounded-full p-1">
                                <button
                                    onClick={() => setViewMode('GRID')}
                                    aria-label="Grid view"
                                    aria-pressed={viewMode === 'GRID'}
                                    className={`p-2 rounded-full transition-all active:scale-90 focus-visible:ring-2 focus-visible:ring-primary outline-none ${viewMode === 'GRID' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
                                >
                                    <LayoutGrid size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('LIST')}
                                    aria-label="List view"
                                    aria-pressed={viewMode === 'LIST'}
                                    className={`p-2 rounded-full transition-all active:scale-90 focus-visible:ring-2 focus-visible:ring-primary outline-none ${viewMode === 'LIST' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
                                >
                                    <ListIcon size={16} />
                                </button>
                            </div>
                            <div className="h-5 w-px bg-border/40" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                aria-label="Sort library by"
                                className="bg-transparent text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground outline-none cursor-pointer pr-6 hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                            >
                                <option value="RECENT">Last Read</option>
                                <option value="TITLE">Title</option>
                                <option value="PROGRESS">Progress</option>
                                <option value="SCORE">Rating</option>
                            </select>
                        </Surface>
                    </div>

                    <AnimatePresence>
                        {filterOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <Surface variant="paper" className="p-8 space-y-8">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">Format Classification</h4>
                                        <div className="flex flex-wrap gap-3">
                                            {['ALL', 'ANIME', 'MANGA', 'NOVEL'].map(f => (
                                                <button
                                                    key={f}
                                                    onClick={() => setMediaFilter(f as any)}
                                                    aria-pressed={mediaFilter === f}
                                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all focus-visible:ring-2 focus-visible:ring-primary outline-none ${mediaFilter === f ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-muted/10 text-muted-foreground hover:bg-muted/20 border border-border/40'}`}
                                                >
                                                    {f}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </Surface>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── CONTENT ── */}
                <AnimatePresence mode="wait">
                    {filteredLibrary.length === 0 ? (
                        <EmptyState
                            title={searchQuery ? "Memory not found" : "Quiet Shelves"}
                            description={searchQuery
                                ? "This specific reflection seems lost in the folds of time. Try a different term?"
                                : "The pages are currently empty. Start your journey by exploring the collective consciousness."}
                            icon={<Coffee size={32} className="text-primary/40" />}
                            action={
                                <Button
                                    as={Link}
                                    to="/discover"
                                    variant="primary"
                                    size="lg"
                                    className="px-12"
                                >
                                    Open the Global Collection
                                </Button>
                            }
                        />
                    ) : viewMode === 'GRID' ? (
                        <motion.div 
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6 md:gap-8"
                        >
                            {filteredLibrary.map((item, index) => (
                                <motion.div 
                                    key={item.id} 
                                    className="group flex flex-col gap-3 relative"
                                    drag="x"
                                    dragConstraints={{ left: 0, right: 100 }}
                                    dragElastic={0.1}
                                    onDragEnd={(_e: any, info: PanInfo) => {
                                        if (info.offset.x > 80) {
                                            updateLibraryItem(item.id, { 
                                                progress: (item.progress || 0) + 1,
                                                status: 'READING'
                                            });
                                            showToast(`Logged ${item.mediaType === 'ANIME' ? 'Episode' : 'Chapter'} ${(item.progress || 0) + 1}`, 'success', 1500);
                                        }
                                    }}
                                >
	                                    <MediaCard 
	                                        id={item.id}
	                                        title={toTitle(item.title)}
	                                        coverUrl={item.coverUrl}
	                                        mediaType={item.mediaType === 'ANIME' ? 'ANIME' : 'MANGA'}
	                                        status={item.status}
	                                        progress={item.progress}
	                                        index={index}
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-4 gap-3 z-20 pointer-events-none rounded-2xl">
                                        <div className="flex gap-2 justify-center pointer-events-auto">
                                            <button
                                                onClick={(e) => handleSearchMedia(e, item)}
                                                className="w-10 h-10 bg-white text-primary rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl outline-none focus-visible:ring-2 focus-visible:ring-white"
                                                title={item.mediaType === 'ANIME' ? 'Watch' : 'Read'}
                                                aria-label={item.mediaType === 'ANIME' ? `Watch ${toTitle(item.title)} online` : `Read ${toTitle(item.title)} online`}
                                            >
                                                {item.mediaType === 'ANIME' ? <Play size={16} fill="currentColor" /> : <BookOpen size={16} />}
                                            </button>
                                            <button
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveFastActions(activeFastActions === item.id ? null : item.id); }}
                                                className="w-10 h-10 bg-white text-foreground rounded-xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl outline-none focus-visible:ring-2 focus-visible:ring-white"
                                                title="Quick edit"
                                                aria-label={`Quick edit ${toTitle(item.title)}`}
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {activeFastActions === item.id && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="absolute inset-0 z-50 p-2 flex items-end"
                                            >
                                                <FastActionSurface
                                                    id={item.id}
                                                    title={toTitle(item.title)}
                                                    coverUrl={item.coverUrl}
                                                    genres={item.genres || []}
                                                    mediaType={item.mediaType}
                                                    onClose={() => setActiveFastActions(null)}
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {item.isFavourite && (
                                        <div className="absolute top-3 right-3 z-10 w-6 h-6 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg border border-white/20" aria-label="In cherished collection">
                                            <Heart size={12} fill="currentColor" className="text-primary" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>

                    ) : (
                        <motion.div 
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-2"
                        >
                            {filteredLibrary.map((item, idx) => (
                                <motion.div 
                                    key={item.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                >
                                    <Surface
                                        variant="paper"
                                        withPadding={false}
                                        className="group flex items-center gap-6 p-4 transition-all hover:border-primary/40 hover:shadow-lg"
                                    >
                                        <Link to={`/manga/${item.id}`} className="w-16 h-24 rounded-xl overflow-hidden shadow-md shrink-0 border border-border/40 relative group/img outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`View ${toTitle(item.title)}`}>
                                            <img src={sanitizeCoverUrl(item.coverUrl)} onError={handleCoverImageError} className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" alt={`Cover for ${toTitle(item.title)}`} />
                                            {item.isFavourite && (
                                                <div className="absolute top-1.5 right-1.5 z-10">
                                                    <Heart size={10} fill="currentColor" className="text-primary drop-shadow-md" />
                                                </div>
                                            )}
                                        </Link>

                                        <div className="flex-1 min-w-0 text-left">
                                            <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                                <h3 className="text-lg font-serif italic text-foreground tracking-tight group-hover:text-primary transition-colors truncate">
                                                    {toTitle(item.title)}
                                                </h3>
                                                <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border shrink-0 ${statusStyle(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-5 text-[9px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
                                                <div className="flex items-center gap-2">
                                                    <Layers size={10} />
                                                    <span>{item.mediaType === 'ANIME' ? 'Episode' : 'Chapter'} {item.progress || 0}</span>
                                                </div>
                                                {item.score > 0 && (
                                                    <div className="flex items-center gap-2 text-primary">
                                                        <Star size={10} fill="currentColor" />
                                                        <span>Refined Score: {item.score}/10</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all px-4">
                                            <Button
                                                onClick={(e) => handleSearchMedia(e, item)}
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-xl"
                                                title={item.mediaType === 'ANIME' ? 'Watch' : 'Read'}
                                                aria-label={item.mediaType === 'ANIME' ? `Watch ${toTitle(item.title)} online` : `Read ${toTitle(item.title)} online`}
                                            >
                                                {item.mediaType === 'ANIME' ? <Play size={16} fill="currentColor" /> : <BookOpen size={16} />}
                                            </Button>
                                            <Button
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveFastActions(activeFastActions === item.id ? null : item.id); }}
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-xl"
                                                aria-label={`Quick edit ${toTitle(item.title)}`}
                                            >
                                                <Edit3 size={16} />
                                            </Button>
                                        </div>
                                    </Surface>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Library;
