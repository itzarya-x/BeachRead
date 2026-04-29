import { useState, useMemo } from 'react';
import { X, Heart, CheckCircle2, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateLibraryEntriesBatch } from '../../../services/api/libraryApi';
import type { LibraryStatus } from '../../../shared/types/types';
import { Button } from '../../../shared/ui/Button';
import { Surface } from '../../../shared/ui/Surface';

interface BulkManagementProps {
    userId: string;
    items: any[]; // These should be the library entries with their database IDs
    onComplete: () => void;
    onClose: () => void;
}

export default function BulkManagement({ userId, items, onComplete, onClose }: BulkManagementProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<LibraryStatus | ''>('');
    const [score, setScore] = useState<number | ''>('');
    const [isFav, setIsFav] = useState<boolean | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        const lowerQuery = searchQuery.toLowerCase();
        return items.filter(item => 
            item.title.toLowerCase().includes(lowerQuery) || 
            item.status.toLowerCase().includes(lowerQuery)
        );
    }, [items, searchQuery]);

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        setSelectedIds(filteredItems.map(item => item.dbId || item.id));
    };

    const deselectAll = () => {
        setSelectedIds([]);
    };

    const handleApply = async () => {
        if (selectedIds.length === 0) return;
        setIsProcessing(true);
        try {
            const patch: any = {};
            if (status) patch.status = status;
            if (score !== '') patch.score = Number(score);
            if (isFav !== null) patch.isFavourite = isFav;

            // Only apply if there's actually something to change
            if (Object.keys(patch).length > 0) {
                await updateLibraryEntriesBatch(userId, selectedIds, patch);
                onComplete();
            }
            onClose();
        } catch (error) {
            console.error('Bulk update failed:', error);
            alert('Failed to update entries. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-background/80 backdrop-blur-xl animate-in fade-in duration-300">
            <Surface 
                variant="paper" 
                withPadding={false}
                className="w-full max-w-6xl shadow-2xl flex flex-col h-[90vh] rounded-[32px] overflow-hidden border-border/40"
            >
                {/* Header */}
                <div className="px-8 py-6 border-b border-border/20 flex items-center justify-between bg-muted/10 shrink-0">
                    <div>
                        <h2 className="text-3xl font-serif italic text-foreground tracking-tight">Bulk Management</h2>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-2">
                            {selectedIds.length} of {items.length} entries selected
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        aria-label="Close bulk management"
                        className="p-3 rounded-full bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Item List */}
                    <div className="flex-1 flex flex-col overflow-hidden border-r border-border/20 bg-background/50">
                        {/* Toolbar */}
                        <div className="px-8 py-5 border-b border-border/10 flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/5 shrink-0">
                            <div className="relative w-full sm:w-72">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                <input 
                                    type="text" 
                                    placeholder="Filter entries..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-10 pl-11 pr-4 bg-muted/30 border border-border/40 rounded-full text-xs font-medium focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                                />
                            </div>
                            <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                                <button 
                                    onClick={selectAll} 
                                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-md hover:bg-primary/5"
                                >
                                    Select Visible
                                </button>
                                <div className="w-px h-4 bg-border/40" />
                                <button 
                                    onClick={deselectAll} 
                                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-red-500 transition-colors px-3 py-1.5 rounded-md hover:bg-red-500/5"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="flex-1 overflow-y-auto p-8">
                            {filteredItems.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                    <Search size={48} className="mb-4 opacity-20" />
                                    <p className="text-sm font-serif italic">No entries match your filter.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-max">
                                    {filteredItems.map((item, idx) => {
                                        const id = item.dbId || item.id;
                                        const isSelected = selectedIds.includes(id);
                                        return (
                                            <motion.button
                                                key={id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: Math.min(idx * 0.01, 0.2) }}
                                                whileHover={{ y: -2 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => toggleSelection(id)}
                                                aria-label={`Select ${item.title}`}
                                                aria-pressed={isSelected}
                                                className={`relative flex items-center gap-4 p-3 rounded-2xl border transition-all text-left group overflow-hidden ${
                                                    isSelected 
                                                    ? 'bg-primary/10 border-primary/40 shadow-sm shadow-primary/5' 
                                                    : 'bg-card border-border/40 hover:border-primary/30 hover:bg-muted/20'
                                                }`}
                                            >
                                                <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 shadow-sm bg-muted">
                                                    {item.coverUrl && <img src={item.coverUrl} className="w-full h-full object-cover" alt="" loading="lazy" />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[11px] font-bold text-foreground line-clamp-2 leading-tight">{item.title}</p>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${isSelected ? 'bg-primary/20 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border/40'}`}>
                                                            {item.status.replace(/_/g, ' ')}
                                                        </span>
                                                        <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                                            {item.mediaType}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                {/* Selection Indicator */}
                                                <div className={`absolute right-4 w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                                    isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border/60 bg-background group-hover:border-primary/40'
                                                }`}>
                                                    {isSelected && <CheckCircle2 size={12} strokeWidth={3} />}
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="w-full md:w-[380px] bg-muted/10 p-8 overflow-y-auto shrink-0 shadow-[inset_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[inset_1px_0_0_rgba(255,255,255,0.05)]">
                        <div className="space-y-10">
                            {/* Status Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 border-b border-border/20 pb-3">
                                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <CheckCircle2 size={12} />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Set Status</h3>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {(['PLANNING', 'READING', 'COMPLETED', 'PAUSED', 'DROPPED'] as LibraryStatus[]).map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setStatus(status === s ? '' : s)}
                                            className={`px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all text-left flex justify-between items-center ${
                                                status === s 
                                                ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20' 
                                                : 'bg-card border-border/40 text-muted-foreground hover:border-primary/40 hover:bg-muted/30'
                                            }`}
                                        >
                                            {s}
                                            {status === s && <CheckCircle2 size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Score Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 border-b border-border/20 pb-3">
                                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <span className="text-[10px] font-black">10</span>
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Set Score</h3>
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                        <button
                                            key={num}
                                            onClick={() => setScore(score === num ? '' : num)}
                                            className={`h-10 rounded-xl flex items-center justify-center text-[11px] font-black border transition-all ${
                                                score === num 
                                                ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20' 
                                                : 'bg-card border-border/40 text-muted-foreground hover:border-primary/40 hover:bg-muted/30'
                                            }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Favorite Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 border-b border-border/20 pb-3">
                                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <Heart size={12} />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Favorite Status</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setIsFav(isFav === true ? null : true)}
                                        className={`py-3.5 rounded-xl border transition-all flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest ${
                                            isFav === true 
                                            ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20' 
                                            : 'bg-card border-border/40 text-muted-foreground hover:border-primary/40 hover:bg-muted/30'
                                        }`}
                                    >
                                        <Heart size={14} fill={isFav === true ? "currentColor" : "none"} className={isFav === true ? "text-primary-foreground" : "text-primary"} /> 
                                        Cherish
                                    </button>
                                    <button
                                        onClick={() => setIsFav(isFav === false ? null : false)}
                                        className={`py-3.5 rounded-xl border transition-all flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest ${
                                            isFav === false 
                                            ? 'bg-foreground border-foreground text-background shadow-md' 
                                            : 'bg-card border-border/40 text-muted-foreground hover:border-foreground/40 hover:bg-muted/30'
                                        }`}
                                    >
                                        <X size={14} />
                                        Remove
                                    </button>
                                </div>
                            </div>
                            
                            {/* Summary Note */}
                            <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                                <p className="text-[10px] font-serif italic text-primary/80 leading-relaxed text-center">
                                    Only the selected properties above will be modified on the {selectedIds.length} chosen entries. Unselected properties will remain unchanged.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-border/20 bg-muted/10 flex justify-between sm:justify-end gap-4 items-center shrink-0">
                    <button
                        onClick={onClose}
                        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
                    >
                        Cancel
                    </button>
                    <Button
                        onClick={handleApply}
                        disabled={isProcessing || selectedIds.length === 0 || (!status && score === '' && isFav === null)}
                        variant="primary"
                        size="lg"
                        className="px-10 h-12 shadow-lg shadow-primary/20"
                    >
                        {isProcessing ? (
                            <span className="flex items-center gap-2">
                                <div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                Applying Changes...
                            </span>
                        ) : 'Apply to Selected'}
                    </Button>
                </div>
            </Surface>
        </div>
    );
}
