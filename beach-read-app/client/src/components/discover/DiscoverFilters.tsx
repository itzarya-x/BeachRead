import { useState } from 'react';
import { Search, X, LayoutGrid, List as ListIcon, ChevronDown } from 'lucide-react';

interface FilterDropdownProps {
    title: string;
    activeValue: string | null | boolean;
    onClear: () => void;
    children: React.ReactNode;
    menuId: string;
    openMenu: string | null;
    toggleMenu: (menu: string) => void;
    setOpenMenu: (menu: string | null) => void;
}

const FilterDropdown = ({ title, activeValue, onClear, children, menuId, openMenu, toggleMenu, setOpenMenu }: FilterDropdownProps) => (
    <div className="relative">
        <button
            onClick={() => toggleMenu(menuId)}
            className={`flex items-center gap-2 text-[10px] font-mono tracking-[0.15em] uppercase transition-colors px-2 py-1.5 rounded-sm ${openMenu === menuId || activeValue ? 'text-background bg-foreground' : 'text-foreground hover:bg-muted/30'}`}
        >
            {title} {activeValue && activeValue !== true && '*'}
            <ChevronDown size={12} className={`transition-transform duration-300 ${openMenu === menuId ? 'rotate-180' : ''}`} />
        </button>
        {openMenu === menuId && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-background border border-border/60 shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-2">
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Select</span>
                    {activeValue && activeValue !== true && (
                        <button onClick={() => { onClear(); setOpenMenu(null); }} className="text-[9px] text-foreground hover:underline uppercase tracking-widest font-mono">
                            Clear
                        </button>
                    )}
                </div>
                {children}
            </div>
        )}
    </div>
);

interface DiscoverFiltersProps {
    search: string; setSearch: (val: string) => void; debouncedSearch: string;
    activeGenres: string[]; toggleGenre: (genre: string) => void;
    status: string | null; setStatus: (val: string | null) => void;
    format: string | null; setFormat: (val: string | null) => void;
    mediaType: string | null; setMediaType: (val: string | null) => void;
    year: string | null; setYear: (val: string | null) => void;
    clearFilters: () => void;
    sortBy: string; handleSortChange: (val: string) => void;
    viewMode: 'grid' | 'list'; setViewMode: (mode: 'grid' | 'list') => void;

    ALL_GENRES: string[];
    SORT_OPTIONS: { label: string, value: string }[];
    STATUS_OPTIONS: { label: string, value: string }[];
    FORMAT_OPTIONS: { label: string, value: string }[];
    TYPE_OPTIONS: { label: string, value: string }[];
    YEAR_OPTIONS: string[];
    totalResults?: number;
}

export function DiscoverFilters({
    search, setSearch, debouncedSearch,
    activeGenres, toggleGenre,
    status, setStatus,
    format, setFormat,
    mediaType, setMediaType,
    year, setYear,
    clearFilters,
    sortBy, handleSortChange,
    viewMode, setViewMode,
    ALL_GENRES, SORT_OPTIONS, STATUS_OPTIONS, FORMAT_OPTIONS, TYPE_OPTIONS, YEAR_OPTIONS,
    totalResults
}: DiscoverFiltersProps) {
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    const hasActiveFilters = activeGenres.length > 0 || debouncedSearch !== '' || status || format || mediaType || year;

    const toggleMenu = (menu: string) => setOpenMenu(openMenu === menu ? null : menu);

    return (
        <div className="sticky top-[73px] z-40 bg-background/95 backdrop-blur-md border-b border-border/40 pb-4 pt-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-[1200px] mx-auto px-6 md:px-12">

                <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
                    {/* Search */}
                    <div className="relative group w-full md:w-56 shrink-0 bg-muted/10 rounded-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-60 group-focus-within:opacity-100 transition-opacity" />
                        <input
                            type="text"
                            placeholder="Search manga..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-8 bg-transparent pl-9 pr-4 text-[11px] font-mono focus:outline-none transition-colors placeholder:text-muted-foreground/60"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    <div className="hidden md:block w-px h-5 bg-border/40 mx-2"></div>

                    {/* Filter Menus */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Genres */}
                        <div className="relative">
                            <button
                                onClick={() => toggleMenu('genres')}
                                className={`flex items-center gap-2 text-[10px] font-mono tracking-[0.15em] uppercase transition-colors px-2 py-1.5 rounded-sm ${openMenu === 'genres' || activeGenres.length > 0 ? 'text-background bg-foreground' : 'text-foreground hover:bg-muted/30'}`}
                            >
                                Genres {activeGenres.length > 0 && `(${activeGenres.length})`}
                                <ChevronDown size={12} className={`transition-transform duration-300 ${openMenu === 'genres' ? 'rotate-180' : ''}`} />
                            </button>
                            {openMenu === 'genres' && (
                                <div className="absolute top-full left-0 mt-2 w-64 bg-background border border-border/60 shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-2">
                                        <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">Select Tags</span>
                                        {activeGenres.length > 0 && <button onClick={() => { activeGenres.forEach(g => toggleGenre(g)); setOpenMenu(null); }} className="text-[9px] hover:underline uppercase tracking-widest font-mono text-foreground">Clear</button>}
                                    </div>
                                    <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                                        {ALL_GENRES.map(genre => (
                                            <button key={genre} onClick={() => toggleGenre(genre)} className={`px-2 py-1 text-[9px] uppercase tracking-widest font-mono border transition-colors ${activeGenres.includes(genre) ? 'bg-foreground text-background border-foreground' : 'bg-transparent text-muted-foreground border-border/40 hover:border-foreground/50 hover:text-foreground'}`}>
                                                {genre}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Year */}
                        <FilterDropdown title="Year" activeValue={year} onClear={() => setYear(null)} menuId="year" openMenu={openMenu} toggleMenu={toggleMenu} setOpenMenu={setOpenMenu}>
                            <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto pr-1">
                                {YEAR_OPTIONS.map(y => (
                                    <button key={y} onClick={() => { setYear(y); setOpenMenu(null); }} className={`text-left px-2 py-1 text-[10px] font-mono transition-colors ${year === y ? 'bg-muted/30 font-bold text-foreground' : 'text-muted-foreground hover:bg-muted/10 hover:text-foreground'}`}>
                                        {y}
                                    </button>
                                ))}
                            </div>
                        </FilterDropdown>

                        {/* Status */}
                        <FilterDropdown title="Status" activeValue={status} onClear={() => setStatus(null)} menuId="status" openMenu={openMenu} toggleMenu={toggleMenu} setOpenMenu={setOpenMenu}>
                            <div className="flex flex-col gap-1">
                                {STATUS_OPTIONS.map(s => (
                                    <button key={s.value} onClick={() => { setStatus(s.value); setOpenMenu(null); }} className={`text-left px-2 py-1.5 text-[10px] font-mono transition-colors ${status === s.value ? 'bg-muted/30 font-bold text-foreground' : 'text-muted-foreground hover:bg-muted/10 hover:text-foreground'}`}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </FilterDropdown>

                        {/* Format */}
                        <FilterDropdown title="Format" activeValue={format} onClear={() => setFormat(null)} menuId="format" openMenu={openMenu} toggleMenu={toggleMenu} setOpenMenu={setOpenMenu}>
                            <div className="flex flex-col gap-1">
                                {FORMAT_OPTIONS.map(f => (
                                    <button key={f.value} onClick={() => { setFormat(f.value); setOpenMenu(null); }} className={`text-left px-2 py-1.5 text-[10px] font-mono transition-colors ${format === f.value ? 'bg-muted/30 font-bold text-foreground' : 'text-muted-foreground hover:bg-muted/10 hover:text-foreground'}`}>
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </FilterDropdown>

                        {/* Media Type */}
                        <FilterDropdown title="Type" activeValue={mediaType} onClear={() => setMediaType(null)} menuId="type" openMenu={openMenu} toggleMenu={toggleMenu} setOpenMenu={setOpenMenu}>
                            <div className="flex flex-col gap-1">
                                {TYPE_OPTIONS.map(t => (
                                    <button key={t.value} onClick={() => { setMediaType(t.value); setOpenMenu(null); }} className={`text-left px-2 py-1.5 text-[10px] font-mono transition-colors ${mediaType === t.value ? 'bg-muted/30 font-bold text-foreground' : 'text-muted-foreground hover:bg-muted/10 hover:text-foreground'}`}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </FilterDropdown>

                        {/* Sort */}
                        <FilterDropdown title="Sort By" activeValue={true} onClear={() => { }} menuId="sort" openMenu={openMenu} toggleMenu={toggleMenu} setOpenMenu={setOpenMenu}>
                            <div className="flex flex-col gap-1">
                                {SORT_OPTIONS.map(opt => (
                                    <button key={opt.value} onClick={() => { handleSortChange(opt.value); setOpenMenu(null); }} className={`text-left px-2 py-1.5 text-[10px] font-mono transition-colors ${sortBy === opt.value ? 'bg-muted/30 font-bold text-foreground' : 'text-muted-foreground hover:bg-muted/10 hover:text-foreground'}`}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </FilterDropdown>
                    </div>
                </div>

                {/* Right side: Results count & View Toggle */}
                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border/40">
                    {totalResults !== undefined && (
                        <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-muted-foreground">
                            {totalResults.toLocaleString()} <span className="opacity-50">Entries</span>
                        </div>
                    )}
                    <div className="hidden md:block w-px h-4 bg-border/40"></div>
                    <div className="flex items-center gap-3 bg-muted/10 px-2 py-1 rounded-sm border border-border/30">
                        <button onClick={() => setViewMode('list')} className={`p-1.5 transition-all ${viewMode === 'list' ? 'text-foreground' : 'text-muted-foreground opacity-50 hover:opacity-100'}`}><ListIcon size={14} /></button>
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 transition-all ${viewMode === 'grid' ? 'text-foreground' : 'text-muted-foreground opacity-50 hover:opacity-100'}`}><LayoutGrid size={14} /></button>
                    </div>
                </div>
            </div>

            {/* Active Filters Display */}
            <div className={`transition-all duration-300 overflow-hidden ${hasActiveFilters ? 'max-h-20 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0 pointer-events-none'}`}>
                <div className="max-w-[1200px] mx-auto px-6 md:px-12 flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-mono tracking-widest text-muted-foreground/60 uppercase mr-2 border-r border-border/40 pr-2">Active Rules</span>
                    {activeGenres.map(g => (
                        <span key={g} className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-border/40 text-[9px] uppercase tracking-widest font-mono text-foreground/80 bg-muted/5">
                            {g} <button onClick={() => toggleGenre(g)} className="opacity-40 hover:opacity-100 text-foreground transition-opacity"><X size={9} strokeWidth={3} /></button>
                        </span>
                    ))}
                    {year && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-border/40 text-[9px] uppercase tracking-widest font-mono text-foreground/80 bg-muted/5">
                            Year: {year} <button onClick={() => setYear(null)} className="opacity-40 hover:opacity-100"><X size={9} strokeWidth={3} /></button>
                        </span>
                    )}
                    {status && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-border/40 text-[9px] uppercase tracking-widest font-mono text-foreground/80 bg-muted/5">
                            Status: {STATUS_OPTIONS.find(s => s.value === status)?.label} <button onClick={() => setStatus(null)} className="opacity-40 hover:opacity-100"><X size={9} strokeWidth={3} /></button>
                        </span>
                    )}
                    {format && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-border/40 text-[9px] uppercase tracking-widest font-mono text-foreground/80 bg-muted/5">
                            Format: {FORMAT_OPTIONS.find(f => f.value === format)?.label} <button onClick={() => setFormat(null)} className="opacity-40 hover:opacity-100"><X size={9} strokeWidth={3} /></button>
                        </span>
                    )}
                    {mediaType && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-border/40 text-[9px] uppercase tracking-widest font-mono text-foreground/80 bg-muted/5">
                            Type: {TYPE_OPTIONS.find(t => t.value === mediaType)?.label} <button onClick={() => setMediaType(null)} className="opacity-40 hover:opacity-100"><X size={9} strokeWidth={3} /></button>
                        </span>
                    )}
                    {debouncedSearch && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border border-border/40 text-[9px] uppercase tracking-widest font-mono text-foreground/80 bg-muted/5">
                            Query: "{debouncedSearch}" <button onClick={() => setSearch('')} className="opacity-40 hover:opacity-100 text-foreground transition-opacity"><X size={9} strokeWidth={3} /></button>
                        </span>
                    )}
                    <button onClick={clearFilters} className="text-[9px] font-mono tracking-widest text-muted-foreground uppercase ml-2 hover:text-foreground hover:underline transition-colors border-b border-transparent hover:border-foreground pb-0.5">
                        Reset Filters
                    </button>
                </div>
            </div>
        </div>
    );
}
