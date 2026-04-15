import React from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';

interface FiltersPanelProps {
    isOpen: boolean;
    onClose: () => void;
    activeGenres: string[];
    toggleGenre: (genre: string) => void;
    status: string | null;
    setStatus: (status: string | null) => void;
    format: string | null;
    setFormat: (format: string | null) => void;
    year: string | null;
    setYear: (year: string | null) => void;
    clearFilters: () => void;
}

const ALL_GENRES = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'];
const STATUS_OPTIONS = [
    { label: 'Releasing', value: 'RELEASING' },
    { label: 'Finished', value: 'FINISHED' },
    { label: 'Upcoming', value: 'NOT_YET_RELEASED' },
    { label: 'Hiatus', value: 'HIATUS' }
];
const FORMAT_OPTIONS = [
    { label: 'Manga', value: 'MANGA' },
    { label: 'Manhwa', value: 'MANHWA' },
    { label: 'Manhua', value: 'MANHUA' },
    { label: 'One-Shot', value: 'ONE_SHOT' }
];
const YEAR_OPTIONS = Array.from({ length: 35 }, (_, i) => (new Date().getFullYear() + 1 - i).toString());

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
    isOpen,
    onClose,
    activeGenres,
    toggleGenre,
    status,
    setStatus,
    format,
    setFormat,
    year,
    setYear,
    clearFilters
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex justify-end">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-background/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative w-full max-w-[400px] h-full bg-background border-l border-border/50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                <div className="flex items-center justify-between p-8 border-b border-border/40">
                    <div className="flex items-center gap-3">
                        <Filter size={18} className="text-primary" />
                        <h2 className="text-lg font-black uppercase tracking-tight text-foreground">Filter Matrix</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-muted/20 rounded-xl transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
                    {/* Genres */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Genres</h3>
                        <div className="flex flex-wrap gap-2">
                            {ALL_GENRES.map(genre => (
                                <button
                                    key={genre}
                                    onClick={() => toggleGenre(genre)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                                        activeGenres.includes(genre)
                                            ? 'bg-primary text-background'
                                            : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'
                                    }`}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Publication Status</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {STATUS_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setStatus(status === opt.value ? null : opt.value)}
                                    className={`px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all text-left ${
                                        status === opt.value
                                            ? 'bg-foreground text-background shadow-lg'
                                            : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Format */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Format</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {FORMAT_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setFormat(format === opt.value ? null : opt.value)}
                                    className={`px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all text-left ${
                                        format === opt.value
                                            ? 'bg-foreground text-background shadow-lg'
                                            : 'bg-muted/20 text-muted-foreground hover:bg-muted/40'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Year */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Year</h3>
                        <select 
                            value={year || ''} 
                            onChange={(e) => setYear(e.target.value || null)}
                            className="w-full bg-muted/20 border border-border/40 rounded-xl px-4 py-3 text-xs font-bold text-foreground outline-none focus:border-primary/50 transition-all appearance-none"
                        >
                            <option value="">Any Year</option>
                            {YEAR_OPTIONS.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="p-8 border-t border-border/40 bg-muted/5 flex gap-4">
                    <button 
                        onClick={clearFilters}
                        className="flex-1 h-14 rounded-2xl border border-border/40 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted/20 transition-all"
                    >
                        <RotateCcw size={14} />
                        Reset
                    </button>
                    <button 
                        onClick={onClose}
                        className="flex-[2] h-14 rounded-2xl bg-foreground text-background flex items-center justify-center text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};
