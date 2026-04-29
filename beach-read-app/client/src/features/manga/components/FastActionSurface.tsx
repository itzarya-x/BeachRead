import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
    Play,
    Pause,
    Check,
    Heart,
    Plus,
    Minus,
    MessageSquare,
    Loader2,
    X,
    Bookmark
} from 'lucide-react';
import { useLibrary } from '../../library/hooks/useLibrary';
import { useAuth } from '../../auth/context/auth-context';

import type { MediaType } from '../../../shared/types/types';

interface FastActionSurfaceProps {
    id: string;
    title: string;
    coverUrl: string;
    genres: string[];
    mediaType?: MediaType;
    onClose?: () => void;
}

export function FastActionSurface({ id, title, coverUrl, genres, mediaType = 'MANGA', onClose }: FastActionSurfaceProps) {
    const { user } = useAuth();
    const { library, addToLibrary, updateLibraryItem, toggleFavourite } = useLibrary();
    const [loading, setLoading] = useState(false);
    const [noteMode, setNoteMode] = useState(false);
    const [note, setNote] = useState('');

    const libraryItem = library.find(item => item.id === id);
    const isInLibrary = !!libraryItem;

    const handleAction = async (action: () => Promise<void>) => {
        if (!user) {
            window.location.href = '/login';
            return;
        }
        setLoading(true);
        try {
            await action();
        } finally {
            setLoading(false);
        }
    };

    const handleStart = () => handleAction(async () => {
        if (!isInLibrary) {
            await addToLibrary({ id, title, coverUrl, genres, mediaType, status: 'READING', progress: 0 });
        } else {
            await updateLibraryItem(id, { status: 'READING' });
        }
    });

    const handlePause = () => handleAction(async () => {
        if (isInLibrary) await updateLibraryItem(id, { status: 'PAUSED' });
    });

    const handleFinish = () => handleAction(async () => {
        if (isInLibrary) await updateLibraryItem(id, { status: 'COMPLETED' });
    });

    const handleProgress = (increment: number) => handleAction(async () => {
        if (isInLibrary) {
            const newProgress = Math.max(0, (libraryItem.progress || 0) + increment);
            await updateLibraryItem(id, { progress: newProgress });
        }
    });

    const handleToggleFav = () => handleAction(async () => {
        if (isInLibrary) await toggleFavourite(id);
    });

    const handleAddNote = () => handleAction(async () => {
        if (isInLibrary && note.trim()) {
            // In the new schema, we have a notes table, but for now we could use comments or a field.
            // Let's assume we can add it to comments for now as per LibraryItem type.
            const newComment = { id: crypto.randomUUID(), text: note, createdAt: new Date().toISOString() };
            const existing = libraryItem.comments || [];
            await updateLibraryItem(id, { comments: [...existing, newComment] });
            setNote('');
            setNoteMode(false);
        }
    });

    if (noteMode) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col gap-3 p-4 bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl"
            >
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Add Note</span>
                    <button onClick={() => setNoteMode(false)} className="text-white/40 hover:text-white transition-colors">
                        <X size={14} />
                    </button>
                </div>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Archival thoughts..."
                    className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                    autoFocus
                />
                <button
                    onClick={handleAddNote}
                    disabled={loading || !note.trim()}
                    className="w-full h-10 bg-primary hover:bg-primary/80 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : 'Save Note'}
                </button>
            </motion.div>
        );
    }

    const containerVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                duration: 0.3,
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 10, scale: 0.9 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 20 } }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-4 p-4 bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl"
        >
            <div className="flex items-center gap-3">
                <img src={coverUrl} alt={title} className="w-10 h-14 object-cover rounded-lg shadow-lg" />
                <div className="flex-1 min-w-0">
                    <h4 className="text-[11px] font-black uppercase tracking-tight text-white truncate leading-none mb-1">{title}</h4>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest truncate">{genres[0] || 'Unknown'}</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-1 text-white/40 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                )}
            </div>

            {!isInLibrary ? (
                <button
                    onClick={() => handleAction(async () => { await addToLibrary({ id, title, coverUrl, genres, mediaType }); })}
                    disabled={loading}
                    className="w-full h-10 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <><Bookmark size={14} /> Add to Archive</>}
                </button>
            ) : (
                <div className="space-y-4">
                    {/* Status Actions */}
                    <div className="grid grid-cols-3 gap-2">
                        <motion.button
                            variants={itemVariants}
                            onClick={handleStart}
                            disabled={loading || libraryItem.status === 'READING'}
                            className={`h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 border ${libraryItem.status === 'READING'
                                ? 'bg-primary border-primary text-white'
                                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <Play size={16} fill={libraryItem.status === 'READING' ? 'currentColor' : 'none'} />
                        </motion.button>
                        <motion.button
                            variants={itemVariants}
                            onClick={handlePause}
                            disabled={loading || libraryItem.status === 'PAUSED'}
                            className={`h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 border ${libraryItem.status === 'PAUSED'
                                ? 'border-[hsl(38_85%_48%)] text-white'
                                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                            style={libraryItem.status === 'PAUSED' ? { backgroundColor: 'hsl(38 85% 48%)' } : {}}
                        >
                            <Pause size={16} fill={libraryItem.status === 'PAUSED' ? 'currentColor' : 'none'} />
                        </motion.button>
                        <motion.button
                            variants={itemVariants}
                            onClick={handleFinish}
                            disabled={loading || libraryItem.status === 'COMPLETED'}
                            className={`h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 border ${libraryItem.status === 'COMPLETED'
                                ? 'border-[hsl(234_55%_58%)] text-white'
                                : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                            style={libraryItem.status === 'COMPLETED' ? { backgroundColor: 'hsl(234 55% 58%)' } : {}}
                        >
                            <Check size={16} />
                        </motion.button>
                    </div>

                    {/* Progress Control */}
                    <motion.div variants={itemVariants} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Progress</span>
                            <span className="text-[11px] font-black text-white">{mediaType === 'ANIME' ? 'EP' : 'CH'} {libraryItem.progress}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleProgress(-1)}
                                disabled={loading || libraryItem.progress === 0}
                                className="flex-1 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
                            >
                                <Minus size={14} className="text-white" />
                            </button>
                            <button
                                onClick={() => handleProgress(1)}
                                disabled={loading}
                                className="flex-1 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center transition-all active:scale-95"
                            >
                                <Plus size={14} className="text-white" />
                            </button>
                        </div>
                    </motion.div>

                    {/* Secondary Actions */}
                    <motion.div variants={itemVariants} className="flex gap-2 border-t border-white/10 pt-4">
                        <button
                            onClick={handleToggleFav}
                            disabled={loading}
                            className={`flex-1 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 border ${libraryItem.isFavourite
                                ? 'border-[hsl(0_55%_52%/0.4)] text-[hsl(0_55%_52%)]'
                                : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                                }`}
                            style={libraryItem.isFavourite ? { backgroundColor: 'hsl(0 55% 52% / 0.20)' } : {}}
                        >
                            <Heart size={16} fill={libraryItem.isFavourite ? 'currentColor' : 'none'} />
                        </button>
                        <button
                            onClick={() => setNoteMode(true)}
                            disabled={loading}
                            className="flex-1 h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center transition-all active:scale-95 text-white/40 hover:text-white"
                        >
                            <MessageSquare size={16} />
                        </button>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
