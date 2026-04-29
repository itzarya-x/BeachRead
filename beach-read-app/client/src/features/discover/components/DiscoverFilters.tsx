import { useState } from 'react';
import { X, ChevronDown, ChevronRight, Wind, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../shared/utils/cn';

interface FilterSectionProps {
    title: string;
    hint?: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    badge?: string | number | null;
}

const FilterSection = ({ title, hint, isOpen, onToggle, children, badge }: FilterSectionProps) => (
    <div className="border-b border-border/10 last:border-b-0">
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between py-5 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
        >
            <span className="flex flex-col gap-0.5 items-start">
                <span className="flex items-center gap-2 font-serif italic normal-case tracking-normal text-base group-hover:text-primary transition-colors">
                    {title}
                    {badge && (
                        <span className="ml-2 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                </span>
                {hint && (
                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-40 not-italic">
                        {hint}
                    </span>
                )}
            </span>
            {isOpen ? <ChevronDown size={14} className="opacity-40" /> : <ChevronRight size={14} className="opacity-40" />}
        </button>
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="overflow-hidden"
                >
                    <div className="pb-8 pt-2">
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

interface DiscoverFiltersProps {
    debouncedSearch: string;
    activeGenres: string[]; toggleGenre: (genre: string) => void;
    status: string | null; setStatus: (val: string | null) => void;
    format: string | null; setFormat: (val: string | null) => void;
    mediaType: string | null; setMediaType: (val: string | null) => void;
    year: string | null; setYear: (val: string | null) => void;
    clearFilters: () => void;
    sortBy: string; handleSortChange: (val: string) => void;

    ALL_GENRES: string[];
    SORT_OPTIONS: { label: string, value: string }[];
    STATUS_OPTIONS: { label: string, value: string }[];
    FORMAT_OPTIONS: { label: string, value: string }[];
    TYPE_OPTIONS: { label: string, value: string }[];
    YEAR_OPTIONS: string[];

    // Mobile props
    isMobile?: boolean;
    onClose?: () => void;
}

export function DiscoverFilters({
    debouncedSearch,
    activeGenres, toggleGenre,
    status, setStatus,
    format,
    mediaType, setMediaType,
    year, setYear,
    clearFilters,
    sortBy, handleSortChange,
    ALL_GENRES, SORT_OPTIONS, STATUS_OPTIONS, TYPE_OPTIONS, YEAR_OPTIONS,
    isMobile, onClose
}: DiscoverFiltersProps) {
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        genres: true,
        sort: true,
        status: false,
        format: false,
        type: false,
        year: false,
    });

    const hasActiveFilters = activeGenres.length > 0 || debouncedSearch !== '' || status || format || mediaType || year;

    const toggleSection = (key: string) =>
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

    return (
        <aside className={cn("w-full space-y-0", isMobile && "px-6 py-10")}>
            {/* Sidebar Header */}
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border/20">
                <Wind size={16} className="text-primary opacity-60" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground">Refine Reflections</span>
                
                <div className="ml-auto flex items-center gap-4">
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                        >
                            Reset
                        </button>
                    )}
                    {isMobile && (
                        <button onClick={onClose} className="p-2 -mr-2 text-muted-foreground hover:text-foreground">
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Active Filters Badges */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mb-8 pb-6 border-b border-border/10 max-h-[120px] overflow-y-auto no-scrollbar">
                    {activeGenres.map(g => (
                        <span key={g} className="inline-flex items-center gap-2 px-3 py-1.5 border border-border/40 text-[9px] font-bold uppercase tracking-widest text-muted-foreground bg-background rounded-full shadow-sm">
                            {g} <button onClick={() => toggleGenre(g)} className="opacity-40 hover:opacity-100 text-foreground transition-opacity cursor-pointer"><X size={10} /></button>
                        </span>
                    ))}
                    {status && (
                        <span key="status" className="inline-flex items-center gap-2 px-3 py-1.5 border border-primary/20 text-[9px] font-bold uppercase tracking-widest text-primary bg-primary/5 rounded-full shadow-sm">
                            {STATUS_OPTIONS.find(s => s.value === status)?.label} <button onClick={() => setStatus(null)} className="opacity-40 hover:opacity-100 cursor-pointer"><X size={10} /></button>
                        </span>
                    )}
                    {mediaType && (
                        <span key="type" className="inline-flex items-center gap-2 px-3 py-1.5 border border-foreground/20 text-[9px] font-bold uppercase tracking-widest text-foreground bg-foreground/5 rounded-full shadow-sm">
                            {TYPE_OPTIONS.find(t => t.value === mediaType)?.label} <button onClick={() => setMediaType(null)} className="opacity-40 hover:opacity-100 cursor-pointer"><X size={10} /></button>
                        </span>
                    )}
                    {debouncedSearch && (
                        <span key="search" className="inline-flex items-center gap-2 px-3 py-1.5 border border-border/40 text-[9px] font-serif italic text-muted-foreground bg-background rounded-full shadow-sm">
                            <Search size={10} className="opacity-40" /> "{debouncedSearch}"
                        </span>
                    )}
                </div>
            )}

            {/* Sort By */}
            <FilterSection title="Sequence" hint="sort by" isOpen={openSections.sort} onToggle={() => toggleSection('sort')}>
                <div className="grid grid-cols-1 gap-1.5">
                    {SORT_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => handleSortChange(opt.value)}
                            className={cn(
                                "text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all cursor-pointer",
                                sortBy === opt.value 
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10" 
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </FilterSection>

            {/* Genres */}
            <FilterSection title="Thematic Threads" hint="genre" isOpen={openSections.genres} onToggle={() => toggleSection('genres')} badge={activeGenres.length > 0 ? activeGenres.length : null}>
                <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto pr-2 no-scrollbar">
                    {ALL_GENRES.map(genre => (
                        <button
                            key={genre}
                            onClick={() => toggleGenre(genre)}
                            className={cn(
                                "px-4 py-2 text-[9px] font-bold uppercase tracking-widest border rounded-full transition-all cursor-pointer",
                                activeGenres.includes(genre) 
                                    ? "bg-foreground text-background border-foreground shadow-md" 
                                    : "bg-transparent text-muted-foreground border-border hover:border-muted-foreground/40 hover:text-foreground"
                            )}
                        >
                            {genre}
                        </button>
                    ))}
                </div>
            </FilterSection>

            {/* Status & Rest */}
            <FilterSection title="Status" hint="state of being" isOpen={openSections.status} onToggle={() => toggleSection('status')} badge={status ? '*' : null}>
                <div className="grid grid-cols-1 gap-1.5">
                    {STATUS_OPTIONS.map(s => (
                        <button
                            key={s.value}
                            onClick={() => setStatus(status === s.value ? null : s.value)}
                            className={cn(
                                "text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all cursor-pointer",
                                status === s.value 
                                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/10" 
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Origin" hint="media type" isOpen={openSections.type} onToggle={() => toggleSection('type')} badge={mediaType ? '*' : null}>
                <div className="grid grid-cols-1 gap-1.5">
                    {TYPE_OPTIONS.map(t => (
                        <button
                            key={t.value}
                            onClick={() => setMediaType(mediaType === t.value ? null : t.value)}
                            className={cn(
                                "text-left px-5 py-3 text-[10px] font-bold uppercase tracking-widest rounded-2xl transition-all cursor-pointer",
                                mediaType === t.value 
                                    ? "bg-foreground text-background shadow-md shadow-foreground/10" 
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </FilterSection>

            <FilterSection title="Chronology" hint="year" isOpen={openSections.year} onToggle={() => toggleSection('year')} badge={year || null}>
                <div className="grid grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-2 no-scrollbar">
                    {YEAR_OPTIONS.map(y => (
                        <button
                            key={y}
                            onClick={() => setYear(year === y ? null : y)}
                            className={cn(
                                "text-center py-3 text-[10px] font-bold rounded-2xl border transition-all cursor-pointer",
                                year === y 
                                    ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/10" 
                                    : "border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            {y}
                        </button>
                    ))}
                </div>
            </FilterSection>
            
            {isMobile && (
                <div className="mt-12">
                    <button 
                        onClick={onClose}
                        className="w-full h-14 bg-foreground text-background text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl active:scale-95 transition-all"
                    >
                        Apply Reflections
                    </button>
                </div>
            )}
        </aside>
    );
}
