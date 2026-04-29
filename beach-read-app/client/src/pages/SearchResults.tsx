import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSearch } from '../features/manga/hooks/useSearch';
import { MangaCard } from '../features/manga/components/MangaCard';
import type { MediaType } from '../shared/types/types';
import { Search as SearchIcon, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { FiltersPanel } from '../features/manga/components/FiltersPanel';
import { GridSkeleton } from '../shared/ui/PageSkeletons';

const SearchResults: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [page, setPage] = useState(1);

    // Filter State
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [activeGenres, setActiveGenres] = useState<string[]>([]);
    const [status, setStatus] = useState<string | null>(null);
    const [format, setFormat] = useState<string | null>(null);
    const [year, setYear] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<string | null>(null);

    const { results, loading, error, search, pageInfo } = useSearch();

    const executeSearch = useCallback(() => {
        search(query, page, {
            genre: activeGenres,
            status: status || undefined,
            format: format || undefined,
            year: year || undefined,
            type: (mediaType as MediaType) || undefined
        });
    }, [query, page, activeGenres, status, format, year, mediaType, search]);

    useEffect(() => {
        executeSearch();
    }, [executeSearch]);

    const toggleGenre = (genre: string) => {
        setActiveGenres(prev =>
            prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
        );
        setPage(1);
    };

    const clearFilters = () => {
        setActiveGenres([]);
        setStatus(null);
        setFormat(null);
        setYear(null);
        setMediaType(null);
        setPage(1);
    };

    return (
        <div className="flex w-full flex-col items-center bg-background min-h-screen pt-[120px] pb-[110px]">
            <div className="w-full max-w-[1280px] px-[28px]">
                <div className="mb-[48px] flex flex-col gap-4 border-b border-border/70 pb-[24px]">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-[8px]">
                                <SearchIcon className="w-5 h-5 text-primary" />
                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Search Results</p>
                            </div>
                            <h1 className="text-[42px] font-black tracking-[-0.03em] text-foreground uppercase">
                                Results for <span className="text-primary italic">"{query}"</span>
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
                            {pageInfo && pageInfo.lastPage > 1 && (
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    Page {page} of {pageInfo.lastPage}
                                </span>
                            )}
                            <button
                                onClick={() => setIsFiltersOpen(true)}
                                className={`flex items-center gap-3 px-6 py-3 border rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${activeGenres.length > 0 || status || format || year || mediaType
                                    ? 'bg-primary border-primary text-background'
                                    : 'border-border/60 text-foreground hover:bg-foreground/5'
                                    }`}
                            >
                                <Filter size={14} />
                                Filters {(activeGenres.length > 0 || status || format || year || mediaType) && '• Active'}
                            </button>
                        </div>
                    </div>

                    {/* Active filter badges */}
                    {(activeGenres.length > 0 || status || format || year || mediaType) && (
                        <div className="flex flex-wrap gap-2">
                            {activeGenres.map(g => (
                                <span key={g} className="inline-flex items-center gap-1.5 px-3 py-1 border border-border/50 text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-muted/10 rounded-full">
                                    {g} <button onClick={() => toggleGenre(g)} className="opacity-40 hover:opacity-100 transition-opacity">✕</button>
                                </span>
                            ))}
                            {status && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-border/50 text-[9px] font-black uppercase tracking-widest text-primary bg-primary/5 rounded-full">
                                    {status} <button onClick={() => { setStatus(null); setPage(1); }} className="opacity-40 hover:opacity-100 transition-opacity">✕</button>
                                </span>
                            )}
                            {format && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-border/50 text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-muted/10 rounded-full">
                                    {format} <button onClick={() => { setFormat(null); setPage(1); }} className="opacity-40 hover:opacity-100 transition-opacity">✕</button>
                                </span>
                            )}
                            {year && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-border/50 text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-muted/10 rounded-full">
                                    {year} <button onClick={() => { setYear(null); setPage(1); }} className="opacity-40 hover:opacity-100 transition-opacity">✕</button>
                                </span>
                            )}
                            {mediaType && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-border/50 text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-muted/10 rounded-full">
                                    {mediaType} <button onClick={() => { setMediaType(null); setPage(1); }} className="opacity-40 hover:opacity-100 transition-opacity">✕</button>
                                </span>
                            )}
                            <button onClick={clearFilters} className="px-3 py-1 text-[9px] font-black uppercase tracking-widest text-destructive hover:underline transition-colors">
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                {loading ? (
                    <GridSkeleton />
                ) : error ? (
                    <div className="py-24 text-center border-2 border-dashed border-destructive/20 rounded-3xl bg-destructive/5 px-6">
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                            <SearchIcon className="text-destructive w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-foreground uppercase mb-2">Search Interrupted</h3>
                        <p className="text-muted-foreground text-sm italic max-w-md mx-auto">{error}</p>
                    </div>
                ) : results.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 gap-x-[24px] gap-y-[64px] md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                            {results.map((manga) => (
                                <MangaCard
                                    key={manga.id}
                                    id={manga.id}
                                    title={manga.title}
                                    coverUrl={manga.coverUrl}
                                    genres={manga.genres}
                                    mediaType={manga.mediaType}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pageInfo && pageInfo.lastPage > 1 && (
                            <div className="mt-16 pt-12 border-t border-border/40 flex items-center justify-between">
                                <button
                                    disabled={page === 1}
                                    onClick={() => {
                                        setPage(p => p - 1);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="flex items-center gap-3 px-8 py-4 bg-muted/20 rounded-2xl text-[11px] font-black uppercase tracking-widest text-foreground hover:bg-muted/40 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} /> Previous
                                </button>

                                <div className="flex items-center gap-4">
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">Page</span>
                                    <span className="w-12 h-12 flex items-center justify-center bg-foreground text-background rounded-xl text-sm font-black">{page}</span>
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">of {pageInfo.lastPage}</span>
                                </div>

                                <button
                                    disabled={!pageInfo.hasNextPage}
                                    onClick={() => {
                                        setPage(p => p + 1);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="flex items-center gap-3 px-8 py-4 bg-foreground text-background rounded-2xl text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-40 text-center border-2 border-dashed border-border/50 rounded-3xl bg-muted/5 group">
                        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110">
                            <SearchIcon className="w-10 h-10 text-muted-foreground opacity-30" />
                        </div>
                        <h3 className="text-3xl font-black text-foreground mb-4 uppercase tracking-tight">No Results Found</h3>
                        <p className="text-muted-foreground text-base max-w-md italic mb-12">
                            We couldn't find any results for this search. Try refining your filters or explore trending titles.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={clearFilters}
                                className="px-10 py-4 border border-border text-foreground text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-muted/30 transition-all"
                            >
                                Clear Filters
                            </button>
                            <button
                                onClick={() => window.location.href = '/discover'}
                                className="px-10 py-4 bg-foreground text-background text-[11px] font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all"
                            >
                                Return to Discover
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <FiltersPanel
                isOpen={isFiltersOpen}
                onClose={() => setIsFiltersOpen(false)}
                activeGenres={activeGenres}
                toggleGenre={toggleGenre}
                status={status}
                setStatus={(s) => { setStatus(s); setPage(1); }}
                format={format}
                setFormat={(f) => { setFormat(f); setPage(1); }}
                year={year}
                setYear={(y) => { setYear(y); setPage(1); }}
                mediaType={mediaType}
                setMediaType={(t) => { setMediaType(t); setPage(1); }}
                clearFilters={clearFilters}
            />
        </div>
    );
};

export default SearchResults;
