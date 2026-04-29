import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { publicApiClient } from '../shared/api/apiClient';
import { Loader2, LayoutGrid, List as ListIcon, Wind, SlidersHorizontal } from 'lucide-react';
import type { MangaResult } from '../features/discover/components/types';
import { sanitizeCoverUrl } from '../shared/utils/image';
import { FALLBACK_SEARCH_RESULTS } from '../features/manga/api/fallback-search';

import { DiscoverHeader } from '../features/discover/components/DiscoverHeader';
import { DiscoverFilters } from '../features/discover/components/DiscoverFilters';
import { DiscoverGallery } from '../features/discover/components/DiscoverGallery';
import { DiscoverCarousel } from '../features/discover/components/DiscoverCarousel';
import { TheReadingRoom } from '../features/discover/components/TheReadingRoom';
import { useAuth } from '../features/auth/context/auth-context';
import { EmptyState } from '../shared/ui/EmptyState';
import { AnimatePresence, motion } from 'framer-motion';

function parseGenresParam(value: string | null): string[] {
    if (!value) return [];
    const normalized = value
        .split(',')
        .map((genre) => genre.trim())
        .filter(Boolean);
    return Array.from(new Set(normalized));
}

function parseOptionalParam(value: string | null): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

export default function Discover() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const topRef = useRef<HTMLDivElement>(null);

    const initialSearch = searchParams.get('q')?.trim() ?? '';
    const initialGenres = parseGenresParam(searchParams.get('genres'));
    const initialStatus = parseOptionalParam(searchParams.get('status'));
    const initialFormat = parseOptionalParam(searchParams.get('format'));
    const initialYear = parseOptionalParam(searchParams.get('year'));
    
    const globalFilter = user?.preferences?.globalMediaFilter || localStorage.getItem('beachread_global_filter') || 'ALL';
    const initialMediaType = parseOptionalParam(searchParams.get('type')) || (globalFilter === 'ALL' ? null : globalFilter);
    const initialSort = parseOptionalParam(searchParams.get('sort')) || 'TRENDING_DESC';

    const [search, setSearch] = useState(initialSearch);
    const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

    const [activeGenres, setActiveGenres] = useState<string[]>(initialGenres);
    const [status, setStatus] = useState<string | null>(initialStatus);
    const [format, setFormat] = useState<string | null>(initialFormat);
    const [mediaType, setMediaType] = useState<string | null>(initialMediaType);
    const [year, setYear] = useState<string | null>(initialYear);
    const [sortBy, setSortBy] = useState(initialSort);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    // Lock body scroll when drawer is open
    useEffect(() => {
        if (isFilterDrawerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isFilterDrawerOpen]);

    const [mangaList, setMangaList] = useState<MangaResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageInfo, setPageInfo] = useState<any>(null);

    const [hubTrending, setHubTrending] = useState<MangaResult[]>([]);
    const [hubPopular, setHubPopular] = useState<MangaResult[]>([]);
    const [hubHighestRated, setHubHighestRated] = useState<MangaResult[]>([]);
    const [hubLoading, setHubLoading] = useState(true);
    const [hubError, setHubError] = useState<string | null>(null);

    const ALL_GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'];
    const SORT_OPTIONS = [
        { label: 'Most Popular', value: 'POPULARITY_DESC' },
        { label: 'Trending', value: 'TRENDING_DESC' },
        { label: 'Highest Rated', value: 'SCORE_DESC' },
        { label: 'Newest Addition', value: 'ID_DESC' },
    ];
    const STATUS_OPTIONS = [
        { label: 'Releasing', value: 'RELEASING' },
        { label: 'Finished', value: 'FINISHED' },
        { label: 'Upcoming', value: 'NOT_YET_RELEASED' },
        { label: 'Hiatus', value: 'HIATUS' },
        { label: 'Cancelled', value: 'CANCELLED' }
    ];
    const FORMAT_OPTIONS = [
        { label: 'Manga', value: 'MANGA' },
        { label: 'Manhwa', value: 'MANHWA' },
        { label: 'Manhua', value: 'MANHUA' },
        { label: 'Novel', value: 'NOVEL' },
        { label: 'One-Shot', value: 'ONE_SHOT' }
    ];
    const TYPE_OPTIONS = [
        { label: 'Anime', value: 'ANIME' },
        { label: 'Manga', value: 'MANGA' }
    ];

    const currentYear = new Date().getFullYear();
    const YEAR_OPTIONS = Array.from({ length: currentYear - 1990 + 2 }, (_, i) => (currentYear + 1 - i).toString());

    const showHub = debouncedSearch === '' && activeGenres.length === 0 && status === null && format === null && mediaType === (globalFilter === 'ALL' ? null : globalFilter) && year === null && sortBy === 'TRENDING_DESC';
    const isFiltering = !showHub;
    const hasActiveFilters = isFiltering && (debouncedSearch !== '' || activeGenres.length > 0 || status || format || mediaType || year);

    const fallbackResults = FALLBACK_SEARCH_RESULTS.map(item => ({
        ...item,
        mediaType: item.mediaType || (item as any).type,
        coverUrl: sanitizeCoverUrl(item.coverUrl),
    })) as MangaResult[];

    useEffect(() => {
        const fetchHubData = async () => {
            setHubLoading(true);
            setHubError(null);
            try {
                const typeParam = mediaType ? `&type=${mediaType}` : '';
                const [trendingRes, popularRes, ratedRes] = await Promise.all([
                    publicApiClient.get<any>(`/search?sort=TRENDING_DESC&page=1&perPage=50${typeParam}`),
                    publicApiClient.get<any>(`/search?sort=POPULARITY_DESC&page=1&perPage=50${typeParam}`),
                    publicApiClient.get<any>(`/search?sort=SCORE_DESC&page=1&perPage=50${typeParam}`)
                ]);

                const sanitize = (list: any[]) => (list || []).map(item => ({
                    ...item,
                    mediaType: item.mediaType || item.type,
                    coverUrl: sanitizeCoverUrl(item.coverUrl)
                }));
                setHubTrending(sanitize(trendingRes.results));
                setHubPopular(sanitize(popularRes.results));
                setHubHighestRated(sanitize(ratedRes.results));
            } catch (err: any) {
                if (err?.status === 502 || err?.status === 0) {
                    setHubTrending(fallbackResults);
                    setHubPopular(fallbackResults);
                    setHubHighestRated(fallbackResults);
                    setHubError('Discover service is temporarily unavailable. Showing cached fallback titles.');
                } else {
                    console.error("Hub fetch failed", err);
                    setHubError('Failed to load discovery hub.');
                }
            } finally {
                setHubLoading(false);
            }
        };
        fetchHubData();
    }, [mediaType]);

    useEffect(() => {
        const next = new URLSearchParams(searchParams);
        const normalizedSearch = search.trim();
        const updateParam = (key: string, value: string | null | string[]) => {
            const nextVal = Array.isArray(value) ? (value.length > 0 ? value.join(',') : null) : value;
            if (nextVal) { if (next.get(key) !== nextVal) next.set(key, nextVal); }
            else { if (next.has(key)) next.delete(key); }
        };
        updateParam('q', normalizedSearch);
        updateParam('genres', activeGenres);
        updateParam('status', status);
        updateParam('format', format);
        updateParam('type', mediaType);
        updateParam('year', year);
        updateParam('sort', sortBy);
        if (searchParams.toString() !== next.toString()) setSearchParams(next, { replace: true });
    }, [search, activeGenres, status, format, mediaType, year, sortBy, searchParams, setSearchParams]);

    useEffect(() => {
        const nextSearch = searchParams.get('q')?.trim() ?? '';
        const nextGenres = parseGenresParam(searchParams.get('genres'));
        const nextStatus = parseOptionalParam(searchParams.get('status'));
        const nextFormat = parseOptionalParam(searchParams.get('format'));
        const nextMediaType = parseOptionalParam(searchParams.get('type'));
        const nextYear = parseOptionalParam(searchParams.get('year'));
        const nextSort = parseOptionalParam(searchParams.get('sort')) || 'TRENDING_DESC';

        if (search !== nextSearch) setSearch(nextSearch);
        if (debouncedSearch !== nextSearch) setDebouncedSearch(nextSearch);
        if (JSON.stringify(activeGenres) !== JSON.stringify(nextGenres)) setActiveGenres(nextGenres);
        if (status !== nextStatus) setStatus(nextStatus);
        if (format !== nextFormat) setFormat(nextFormat);
        if (mediaType !== nextMediaType) setMediaType(nextMediaType);
        if (year !== nextYear) setYear(nextYear);
        if (sortBy !== nextSort) setSortBy(nextSort);
    }, [searchParams]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            if (search !== debouncedSearch) setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, debouncedSearch]);

    const fetchManga = useCallback(async (isLoadMore = false) => {
        if (!isFiltering && !isLoadMore) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (debouncedSearch) params.append('query', debouncedSearch);
            if (activeGenres.length > 0) params.append('genre', activeGenres.join(','));
            if (sortBy) params.append('sort', sortBy);
            if (status) params.append('status', status);
            if (format) params.append('format', format);
            if (mediaType) params.append('type', mediaType);
            if (year) params.append('year', year);
            params.append('page', page.toString());
            const data = await publicApiClient.get<any>(`/search?${params.toString()}`);
            const sanitizedResults = (data.results || []).map((item: MangaResult) => ({
                ...item,
                mediaType: item.mediaType || (item as any).type,
                coverUrl: sanitizeCoverUrl(item.coverUrl)
            }));
            if (isLoadMore) setMangaList(prev => [...prev, ...sanitizedResults]);
            else setMangaList(sanitizedResults);
            setPageInfo(data.pageInfo);
        } catch (err: any) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, activeGenres, sortBy, status, format, mediaType, year, page, isFiltering]);

    useEffect(() => { if (page === 1) fetchManga(false); }, [debouncedSearch, activeGenres, sortBy, status, format, mediaType, year, fetchManga]);
    useEffect(() => { if (page > 1) fetchManga(true); }, [page, fetchManga]);

    const toggleGenre = (genre: string) => { setActiveGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]); setPage(1); };
    const handleStatusChange = (value: string | null) => { setStatus(value); setPage(1); };
    const handleFormatChange = (value: string | null) => { setFormat(value); setPage(1); };
    const handleYearChange = (value: string | null) => { setYear(value); setPage(1); };
    const handleMediaTypeChange = (value: string | null) => { setMediaType(value); if (value === 'ANIME') setFormat(null); setPage(1); };
    const clearFilters = () => { setActiveGenres([]); setStatus(null); setFormat(null); setMediaType(globalFilter === 'ALL' ? null : globalFilter); setYear(null); setSearch(''); setSortBy('TRENDING_DESC'); setPage(1); setMangaList([]); };
    const handleSortChange = (val: string) => { setSortBy(val); setPage(1); };
    const scrollToTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth' });

    const sharedFilterProps = {
        debouncedSearch, activeGenres, toggleGenre, status, setStatus: handleStatusChange,
        format, setFormat: handleFormatChange, mediaType, setMediaType: handleMediaTypeChange,
        year, setYear: handleYearChange, clearFilters, sortBy, handleSortChange,
        ALL_GENRES, SORT_OPTIONS, STATUS_OPTIONS, FORMAT_OPTIONS, TYPE_OPTIONS, YEAR_OPTIONS
    };

    return (
        <div className="w-full min-h-screen bg-background text-foreground pb-20 font-sans selection:bg-muted-foreground selection:text-white relative">
            <div className="fixed inset-0 z-[0] pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }}
            />
            <DiscoverHeader />
            <div ref={topRef} className="max-w-[1400px] mx-auto px-6 md:px-12 mt-8 relative z-10">
                <div className="lg:hidden mb-6">
                    <button onClick={() => setIsFilterDrawerOpen(true)} className="w-full h-14 bg-foreground text-background rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all cursor-pointer">
                        <SlidersHorizontal size={18} />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Refine Reflections</span>
                        {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                    </button>
                </div>
                <div className="flex flex-col lg:flex-row gap-16">
                    <div className="hidden lg:block w-[260px] shrink-0">
                        <div className="sticky top-8 max-h-[calc(100vh-40px)] overflow-y-auto pr-2 no-scrollbar">
                            <DiscoverFilters {...sharedFilterProps} />
                        </div>
                    </div>
                    <main className="flex-1 min-w-0 min-h-[500px]">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
                            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                                {isFiltering && pageInfo?.total !== undefined ? <>{pageInfo.total.toLocaleString()} <span className="opacity-50">Reflections</span></> : <span className="opacity-50">Discovery Collection</span>}
                            </div>
                            <div className="flex items-center gap-3 bg-background border border-border p-1 rounded-full shadow-sm">
                                <button onClick={() => setViewMode('list')} className={`p-2 rounded-full transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ${viewMode === 'list' ? 'text-background bg-foreground' : 'text-muted-foreground hover:bg-muted'}`}><ListIcon size={14} /></button>
                                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-full transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary ${viewMode === 'grid' ? 'text-background bg-foreground' : 'text-muted-foreground hover:bg-muted'}`}><LayoutGrid size={14} /></button>
                            </div>
                        </div>

                        {hubError && showHub && (
                            <div className="mb-12">
                                <EmptyState title="The Sanctuary is currently unreachable" description={hubError} icon={<Wind size={32} className="text-status-error/40" />} />
                            </div>
                        )}

                        {showHub ? (
                            <div className="animate-in fade-in duration-1000 space-y-20">
                                <DiscoverCarousel title="Current Seasonal Reflections" mangaList={hubTrending} loading={hubLoading} onViewAll={() => handleSortChange('TRENDING_DESC')} />
                                <DiscoverCarousel title="Universal Favorites" mangaList={hubPopular} loading={hubLoading} onViewAll={() => handleSortChange('POPULARITY_DESC')} />
                                <DiscoverCarousel title="Enduring Masterpieces" mangaList={hubHighestRated} loading={hubLoading} onViewAll={() => handleSortChange('SCORE_DESC')} />
                            </div>
                        ) : (
                            <div className="animate-in slide-in-from-bottom-4 duration-700 fade-in">
                                {viewMode === 'list' ? <TheReadingRoom mangaList={mangaList} loading={loading && page === 1} /> : <DiscoverGallery mangaList={mangaList} loading={loading && page === 1} onClearFilters={clearFilters} />}
                                {pageInfo && pageInfo.hasNextPage && mangaList.length > 0 && (
                                    <div className="mt-20 pt-12 flex justify-center border-t border-border">
                                        <button disabled={loading} onClick={() => setPage(p => p + 1)} className="flex items-center gap-4 px-16 py-4 bg-background text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground hover:bg-muted-foreground hover:text-white disabled:opacity-30 transition-all border border-border rounded-full shadow-sm hover:shadow-lg focus:ring-2 focus:ring-primary">
                                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Gathering</> : 'Expand Collection'}
                                        </button>
                                    </div>
                                )}
                                {!pageInfo?.hasNextPage && mangaList.length > 0 && !loading && ( <div className="mt-20 pt-12 flex justify-center border-t border-border"><p className="text-[10px] font-bold tracking-[0.4em] text-muted-foreground/40 uppercase">The End of the Shelf</p></div> )}
                            </div>
                        )}
                        {mangaList.length > 12 && (
                            <div className="mt-12 flex justify-center">
                                <button onClick={scrollToTop} className="flex items-center gap-3 px-8 py-3 text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground rounded-full transition-all hover:bg-background shadow-sm focus:ring-2 focus:ring-primary">
                                    <Wind size={12} className="animate-pulse" /> Return to Top
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
            <AnimatePresence>
                {isFilterDrawerOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFilterDrawerOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[6000]" />
                        <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 bg-background rounded-t-[40px] z-[7000] max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl">
                            <DiscoverFilters isMobile onClose={() => setIsFilterDrawerOpen(false)} {...sharedFilterProps} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
