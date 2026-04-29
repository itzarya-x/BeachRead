import React from 'react';
import { X, Filter, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Surface } from '../../../shared/ui/Surface';
import { Button } from '../../../shared/ui/Button';

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
    mediaType: string | null;
    setMediaType: (type: string | null) => void;
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
const TYPE_OPTIONS = [
    { label: 'Anime', value: 'ANIME' },
    { label: 'Manga', value: 'MANGA' }
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
    mediaType,
    setMediaType,
    clearFilters
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[2000] flex justify-end">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/40 backdrop-blur-sm"
                        aria-hidden="true"
                    />

                    {/* Panel */}
                    <Surface
                        as={motion.div}
                        variant="paper"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        withPadding={false}
                        className="relative w-full max-w-[400px] h-full border-l border-border/40 shadow-2xl flex flex-col rounded-none"
                    >
                        <div className="flex items-center justify-between p-8 border-b border-border/40">
                            <div className="flex items-center gap-3">
                                <Filter size={18} className="text-primary" />
                                <h2 className="text-lg font-black uppercase tracking-tight text-foreground">Filter Matrix</h2>
                            </div>
                            <button 
                                onClick={onClose}
                                aria-label="Close filter panel"
                                className="p-3 rounded-2xl bg-muted/20 hover:bg-muted/40 transition-all active:scale-90"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar text-left">
                            {/* Media Type */}
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Classification</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {TYPE_OPTIONS.map(opt => (
                                        <motion.button
                                            key={opt.value}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setMediaType(mediaType === opt.value ? null : opt.value)}
                                            className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-left border ${
                                                mediaType === opt.value
                                                    ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                                    : 'bg-muted/10 border-border/40 text-muted-foreground hover:border-primary/30'
                                            }`}
                                        >
                                            {opt.label}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Genres */}
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Thematic Genres</h3>
                                <div className="flex flex-wrap gap-2">
                                    {ALL_GENRES.map(genre => (
                                        <motion.button
                                            key={genre}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => toggleGenre(genre)}
                                            className={`px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider transition-all border ${
                                                activeGenres.includes(genre)
                                                    ? 'bg-primary border-primary text-white shadow-md'
                                                    : 'bg-muted/10 border-border/40 text-muted-foreground hover:border-primary/20 hover:text-foreground'
                                            }`}
                                        >
                                            {genre}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Status */}
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Timeline Status</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {STATUS_OPTIONS.map(opt => (
                                        <motion.button
                                            key={opt.value}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setStatus(status === opt.value ? null : opt.value)}
                                            className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-left border ${
                                                status === opt.value
                                                    ? 'bg-foreground border-foreground text-background shadow-lg'
                                                    : 'bg-muted/10 border-border/40 text-muted-foreground hover:border-primary/30'
                                            }`}
                                        >
                                            {opt.label}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Format */}
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Medium Format</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {FORMAT_OPTIONS.map(opt => (
                                        <motion.button
                                            key={opt.value}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setFormat(format === opt.value ? null : opt.value)}
                                            className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-left border ${
                                                format === opt.value
                                                    ? 'bg-foreground border-foreground text-background shadow-lg'
                                                    : 'bg-muted/10 border-border/40 text-muted-foreground hover:border-primary/30'
                                            }`}
                                        >
                                            {opt.label}
                                        </motion.button>
                                    ))}
                                </div>
                            </div>

                            {/* Year */}
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Era Selection</h3>
                                <select 
                                    value={year || ''} 
                                    onChange={(e) => setYear(e.target.value || null)}
                                    className="w-full bg-muted/10 border border-border/40 rounded-xl px-5 py-4 text-xs font-black uppercase tracking-widest text-foreground outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Universal Era</option>
                                    {YEAR_OPTIONS.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="p-8 border-t border-border/40 bg-muted/5 flex gap-4">
                            <Button 
                                onClick={clearFilters}
                                variant="outline"
                                className="flex-1 rounded-2xl h-14"
                                aria-label="Reset all filters"
                            >
                                <RotateCcw size={16} className="mr-2" />
                                Reset
                            </Button>
                            <Button 
                                onClick={onClose}
                                variant="primary"
                                className="flex-[2] rounded-2xl h-14"
                                aria-label="Apply filter settings"
                            >
                                Apply Matrix
                            </Button>
                        </div>
                    </Surface>
                </div>
            )}
        </AnimatePresence>
    );
};
