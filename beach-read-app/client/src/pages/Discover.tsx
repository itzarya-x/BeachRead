import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { publicApiClient } from '../lib/apiClient';
import { Loader2 } from 'lucide-react';
import type { MangaResult } from '../components/discover/types';
import { sanitizeCoverUrl } from '../lib/image';
import { FALLBACK_SEARCH_RESULTS } from '../lib/fallback-search';

import { DiscoverHeader } from '../components/discover/DiscoverHeader';
import { DiscoverFilters } from '../components/discover/DiscoverFilters';
import { DiscoverLedger } from '../components/discover/DiscoverLedger';
import { DiscoverGallery } from '../components/discover/DiscoverGallery';
import { DiscoverCarousel } from '../components/discover/DiscoverCarousel';

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
    const [searchParams, setSearchParams] = useSearchParams();

    const initialSearch = searchParams.get('q')?.trim() ?? '';
    const initialGenres = parseGenresParam(searchParams.get('genres'));
    const initialStatus = parseOptionalParam(searchParams.get('status'));
    const initialFormat = parseOptionalParam(searchParams.get('format'));
    const initialYear = parseOptionalParam(searchParams.get('year'));
    const initialMediaType = parseOptionalParam(searchParams.get('type'));
    const initialSort = parseOptionalParam(searchParams.get('sort')) || 'TRENDING_DESC';

    const [search, setSearch] = useState(initialSearch);
    const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

    // Filtering State
    const [activeGenres, setActiveGenres] = useState<string[]>(initialGenres);
    const [status, setStatus] = useState<string | null>(initialStatus);
    const [format, setFormat] = useState<string | null>(initialFormat);
    const [mediaType, setMediaType] = useState<string | null>(initialMediaType);
    const [year, setYear] = useState<string | null>(initialYear);
    const [sortBy, setSortBy] = useState(initialSort);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Filtering Results State
    const [mangaList, setMangaList] = useState<MangaResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageInfo, setPageInfo] = useState<any>(null);

    // Idle Hub State (Carousels)
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

    // Show Hub only when user specifically selects Popularity and no other filters are active
    const showHub = debouncedSearch === '' && activeGenres.length === 0 && status === null && format === null && mediaType === null && year === null && sortBy === 'POPULARITY_DESC';
    const isFiltering = !showHub;

    const fallbackPageInfo = {
        total: FALLBACK_SEARCH_RESULTS.length,
        perPage: FALLBACK_SEARCH_RESULTS.length,
        currentPage: 1,
        lastPage: 1,
        hasNextPage: false,
    };

    const fallbackResults = FALLBACK_SEARCH_RESULTS.map(item => ({
        ...item,
        coverUrl: sanitizeCoverUrl(item.coverUrl),
    })) as MangaResult[];

    // 1. Fetch Idle Hub Data (Simulating Anilist Home)
    useEffect(() => {
        const fetchHubData = async () => {
            setHubLoading(true);
            setHubError(null);
            try {
                const [trendingRes, popularRes, ratedRes] = await Promise.all([
                    publicApiClient.get<any>(`/search?sort=TRENDING_DESC&page=1&perPage=50`),
                    publicApiClient.get<any>(`/search?sort=POPULARITY_DESC&page=1&perPage=50`),
                    publicApiClient.get<any>(`/search?sort=SCORE_DESC&page=1&perPage=50`)
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
    }, []);

    // Keep URL query parameters aligned with Discover filter state.
    useEffect(() => {
        const next = new URLSearchParams(searchParams);
        const normalizedSearch = search.trim();

        const updateParam = (key: string, value: string | null | string[]) => {
            const nextVal = Array.isArray(value) ? (value.length > 0 ? value.join(',') : null) : value;
            if (nextVal) {
                if (next.get(key) !== nextVal) next.set(key, nextVal);
            } else {
                if (next.has(key)) next.delete(key);
            }
        };

        updateParam('q', normalizedSearch);
        updateParam('genres', activeGenres);
        updateParam('status', status);
        updateParam('format', format);
        updateParam('type', mediaType);
        updateParam('year', year);
        updateParam('sort', sortBy);

        const current = searchParams.toString();
        const upcoming = next.toString();
        if (current !== upcoming) {
            setSearchParams(next, { replace: true });
        }
    }, [search, activeGenres, status, format, mediaType, year, sortBy, searchParams, setSearchParams]);

    // Handle browser back/forward URL changes by hydrating state from query params.
    useEffect(() => {
        const nextSearch = searchParams.get('q')?.trim() ?? '';
        const nextGenres = parseGenresParam(searchParams.get('genres'));
        const nextStatus = parseOptionalParam(searchParams.get('status'));
        const nextFormat = parseOptionalParam(searchParams.get('format'));
        const nextMediaType = parseOptionalParam(searchParams.get('type'));
        const nextYear = parseOptionalParam(searchParams.get('year'));
        const nextSort = parseOptionalParam(searchParams.get('sort')) || 'TRENDING_DESC';

        const genresChanged =
            activeGenres.length !== nextGenres.length ||
            activeGenres.some((genre, index) => genre !== nextGenres[index]);

        if (search !== nextSearch) setSearch(nextSearch);
        if (debouncedSearch !== nextSearch) setDebouncedSearch(nextSearch);
        if (genresChanged) setActiveGenres(nextGenres);
        if (status !== nextStatus) setStatus(nextStatus);
        if (format !== nextFormat) setFormat(nextFormat);
        if (mediaType !== nextMediaType) setMediaType(nextMediaType);
        if (year !== nextYear) setYear(nextYear);
        if (sortBy !== nextSort) setSortBy(nextSort);

        if (
            search !== nextSearch ||
            genresChanged ||
            status !== nextStatus ||
            format !== nextFormat ||
            mediaType !== nextMediaType ||
            year !== nextYear ||
            sortBy !== nextSort
        ) {
            setPage(1);
            setMangaList([]);
        }
    }, [searchParams]);

    // 2. Fetch Filtered Data
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            // Reset page when explicitly changing search term
            if (search !== debouncedSearch) setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, debouncedSearch]);

    const fetchManga = useCallback(async (isLoadMore = false) => {
        if (!isFiltering && !isLoadMore) return; // Don't fetch the main list if idle and not loading more

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

            if (isLoadMore) {
                setMangaList(prev => [...prev, ...sanitizedResults]);
            } else {
                setMangaList(sanitizedResults);
            }
            setPageInfo(data.pageInfo);
        } catch (err: any) {
            if (err?.status === 502 || err?.status === 0) {
                setMangaList(fallbackResults);
                setPageInfo(fallbackPageInfo);
            } else {
                console.error('Search failed:', err);
            }
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, activeGenres, sortBy, status, format, mediaType, year, page, isFiltering]);

    useEffect(() => {
        // If sorting or filtering changed (and it's page 1), fetch and replace
        if (page === 1) {
            fetchManga(false);
        }
    }, [debouncedSearch, activeGenres, sortBy, status, format, mediaType, year, fetchManga]);

    useEffect(() => {
        // If simply paginating forward, fetch and append
        if (page > 1) {
            fetchManga(true);
        }
    }, [page, fetchManga]);

    const toggleGenre = (genre: string) => {
        setActiveGenres(prev => prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]);
        setPage(1);
    };

    const handleStatusChange = (value: string | null) => {
        setStatus(value);
        setPage(1);
    };

    const handleFormatChange = (value: string | null) => {
        setFormat(value);
        setPage(1);
    };

    const handleYearChange = (value: string | null) => {
        setYear(value);
        setPage(1);
    };

    const handleMediaTypeChange = (value: string | null) => {
        setMediaType(value);
        // If switching to Anime, clear format since our formats are currently Manga-centric
        if (value === 'ANIME') {
            setFormat(null);
        }
        setPage(1);
    };

    const clearFilters = () => {
        setActiveGenres([]);
        setStatus(null);
        setFormat(null);
        setMediaType(null);
        setYear(null);
        setSearch('');
        setSortBy('POPULARITY_DESC');
        setPage(1);
        setMangaList([]); // Clear list to return to idle hub
    };

    const handleSortChange = (val: string) => {
        setSortBy(val);
        setPage(1);
    };

    return (
        <div className="w-full min-h-screen bg-background text-foreground pb-20 font-sans selection:bg-foreground/10">

            <DiscoverHeader />

            <DiscoverFilters
                search={search}
                setSearch={setSearch}
                debouncedSearch={debouncedSearch}
                activeGenres={activeGenres}
                toggleGenre={toggleGenre}
                status={status}
                setStatus={handleStatusChange}
                format={format}
                setFormat={handleFormatChange}
                mediaType={mediaType}
                setMediaType={handleMediaTypeChange}
                year={year}
                setYear={handleYearChange}
                clearFilters={clearFilters}
                sortBy={sortBy}
                handleSortChange={handleSortChange}
                viewMode={viewMode}
                setViewMode={setViewMode}
                ALL_GENRES={ALL_GENRES}
                SORT_OPTIONS={SORT_OPTIONS}
                STATUS_OPTIONS={STATUS_OPTIONS}
                FORMAT_OPTIONS={FORMAT_OPTIONS}
                TYPE_OPTIONS={TYPE_OPTIONS}
                YEAR_OPTIONS={YEAR_OPTIONS}
                totalResults={isFiltering ? pageInfo?.total : undefined}
            />

            <main className="max-w-[1200px] mx-auto px-6 md:px-12 mt-12 min-h-[500px]">
                {hubError && showHub ? (
                    <div className="mb-8 border border-border/50 bg-muted/20 px-4 py-3 text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground">
                        {hubError}
                    </div>
                ) : null}

                {showHub ? (
                    // Idle Hub View (Anilist style)
                    <div className="animate-in fade-in duration-700">
                        <DiscoverCarousel
                            title="Trending This Season"
                            mangaList={hubTrending}
                            loading={hubLoading}
                            onViewAll={() => handleSortChange('TRENDING_DESC')}
                        />
                        <DiscoverCarousel
                            title="Most Popular"
                            mangaList={hubPopular}
                            loading={hubLoading}
                            onViewAll={() => handleSortChange('POPULARITY_DESC')}
                        />
                        <DiscoverCarousel
                            title="Top Rated"
                            mangaList={hubHighestRated}
                            loading={hubLoading}
                            onViewAll={() => handleSortChange('SCORE_DESC')}
                        />
                    </div>
                ) : (
                    // Active Search View
                    <div className="animate-in slide-in-from-bottom-4 duration-500 fade-in">
                        {viewMode === 'list' ? (
                            <DiscoverLedger mangaList={mangaList} loading={loading && page === 1} />
                        ) : (
                            <DiscoverGallery mangaList={mangaList} loading={loading && page === 1} />
                        )}

                        {/* Comick-style Load More Pagination */}
                        {pageInfo && pageInfo.hasNextPage && mangaList.length > 0 && (
                            <div className="mt-16 pt-8 flex justify-center border-t border-border/40">
                                <button
                                    disabled={loading}
                                    onClick={() => setPage(p => p + 1)}
                                    className="flex items-center gap-3 px-12 py-3 bg-muted/10 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-foreground hover:bg-foreground hover:text-background disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-border/60 hover:border-foreground rounded-sm"
                                >
                                    {loading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Retrieving</> : 'Load More Entries'}
                                </button>
                            </div>
                        )}

                        {!pageInfo?.hasNextPage && mangaList.length > 0 && !loading && (
                            <div className="mt-16 pt-8 flex justify-center border-t border-border/40">
                                <p className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase opacity-50">End of List</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
