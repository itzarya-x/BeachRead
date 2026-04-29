import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, X, Command, TrendingUp, History, Star, 
    ArrowRight, Loader2, Settings, User, LogOut, 
    Layers, Wind, Bell, Home
 
} from 'lucide-react';
import { useSearch } from '../hooks/useSearch';
import { handleCoverImageError, sanitizeCoverUrl } from '../../../shared/utils/image';
import { Surface } from '../../../shared/ui/Surface';
import { useAuth } from '../../auth/context/auth-context';

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ActionCommand {
    id: string;
    title: string;
    description: string;
    icon: any;
    handler: () => void;
    category: string;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const { results, search, loading } = useSearch();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    // Command Logic
    const isCommandMode = query.startsWith('>');
    const commandQuery = query.slice(1).trim().toLowerCase();

    const actions: ActionCommand[] = [
        { id: 'go-home', title: 'Return Home', description: 'Go to your sanctuary dashboard', icon: Home, category: 'Navigation', handler: () => navigate('/') },
        { id: 'go-archive', title: 'Open Archive', description: 'View your collection', icon: Layers, category: 'Navigation', handler: () => navigate('/library') },
        { id: 'go-discover', title: 'Explore Library', description: 'Discover new memories', icon: Wind, category: 'Navigation', handler: () => navigate('/discover') },
        { id: 'go-settings', title: 'Account Settings', description: 'Manage your sanctuary', icon: Settings, category: 'Account', handler: () => navigate('/settings') },
        { id: 'go-profile', title: 'My Profile', description: 'View your public diary', icon: User, category: 'Account', handler: () => navigate(`/u/${user?.username || user?.id}`) },
        { id: 'do-logout', title: 'Sign Out', description: 'Securely leave the sanctuary', icon: LogOut, category: 'Account', handler: async () => { await logout(); navigate('/login'); } },
        { id: 'do-notifications', title: 'Notifications', description: 'View recent echoes', icon: Bell, category: 'Activity', handler: () => navigate('/notifications') },
    ];

    const filteredActions = actions.filter(a => 
        a.title.toLowerCase().includes(commandQuery) || 
        a.description.toLowerCase().includes(commandQuery)
    );

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            document.body.style.overflow = 'auto';
            setQuery('');
        }
    }, [isOpen]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length > 1 && !isCommandMode) {
                search(query);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query, search, isCommandMode]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'Enter') {
            if (isCommandMode && filteredActions.length > 0) {
                filteredActions[0].handler();
                onClose();
            } else if (query.trim()) {
                navigate(`/search?q=${encodeURIComponent(query)}`);
                onClose();
            }
        }
    };

    if (!isOpen) return null;

    return (
        <Surface
            variant="none"
            atmospheric
            withPadding={false}
            className="fixed inset-0 z-[2000] flex flex-col items-center bg-background/60 backdrop-blur-3xl rounded-none shadow-none"
        >
            <div className="w-full max-w-[1200px] flex justify-end p-8">
                <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-muted/20 hover:bg-muted/40 text-foreground transition-all group"
                    aria-label="Close action center"
                >
                    <X size={20} />
                </motion.button>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[800px] px-6 mt-12"
            >
                <div className="relative group">
                    {isCommandMode ? (
                        <Command className="absolute left-8 top-1/2 -translate-y-1/2 text-primary w-6 h-6 group-focus-within:scale-110 transition-transform" />
                    ) : (
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-muted-foreground w-6 h-6 group-focus-within:text-primary transition-colors" />
                    )}
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isCommandMode ? "Execute action..." : "Search media or type '>' for commands"}
                        className="w-full h-[80px] bg-background border border-border/60 rounded-[32px] pl-20 pr-32 text-2xl font-serif font-black italic text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-primary/40 transition-all shadow-2xl"
                    />
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/20 rounded-xl border border-border/40 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            <Command size={12} /> Enter
                        </div>
                    </div>
                </div>

                <div className="mt-12 w-full max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {isCommandMode ? (
                            <motion.div 
                                key="commands"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-6 pb-20"
                            >
                                <div className="flex items-center justify-between mb-4 px-4">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Sanctuary Protocols</h3>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">System Actions</span>
                                </div>
                                <div className="grid gap-2">
                                    {filteredActions.map((action, idx) => (
                                        <motion.button
                                            key={action.id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.02 }}
                                            whileHover={{ x: 10, backgroundColor: 'rgba(var(--primary-rgb), 0.05)' }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => { action.handler(); onClose(); }}
                                            className="w-full flex items-center justify-between p-5 rounded-[24px] border border-border/20 bg-card hover:border-primary/30 transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-2xl bg-muted/20 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-white transition-colors">
                                                    <action.icon size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-0.5">{action.category}</p>
                                                    <h4 className="text-lg font-black text-foreground uppercase tracking-tight">{action.title}</h4>
                                                    <p className="text-xs text-muted-foreground italic font-serif">{action.description}</p>
                                                </div>
                                            </div>
                                            <div className="px-3 py-1 bg-muted/10 rounded-lg text-[10px] font-black text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                                Execute
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        ) : loading ? (
                            <motion.div 
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-20"
                            >
                                <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Synchronizing Results</p>
                            </motion.div>
                        ) : query.trim().length > 1 ? (
                            <motion.div 
                                key="results"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-4 pb-20"
                            >
                                <div className="flex items-center justify-between mb-6 px-4">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Artifact Search</h3>
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{results.length} memories found</span>
                                </div>
                                
                                {results.length > 0 ? (
                                    <div className="space-y-2">
                                        {results.map((manga, idx) => (
                                            <motion.button
                                                key={manga.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                whileHover={{ x: 10, backgroundColor: 'rgba(0,0,0,0.03)' }}
                                                whileTap={{ scale: 0.99 }}
                                                onClick={() => {
                                                    navigate(`/manga/${manga.id}`);
                                                    onClose();
                                                }}
                                                className="w-full flex items-center gap-6 p-4 rounded-[32px] border border-transparent hover:border-border/40 transition-all text-left group"
                                            >
                                                <div className="w-16 h-24 rounded-2xl overflow-hidden shadow-lg shrink-0">
                                                    <img 
                                                        src={sanitizeCoverUrl(manga.coverUrl)} 
                                                        onError={handleCoverImageError}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                                        alt="" 
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h4 className="text-lg font-black text-foreground truncate uppercase tracking-tight">{manga.title}</h4>
                                                        {manga.score && (
                                                            <div className="flex items-center gap-1 text-primary">
                                                                <Star size={12} fill="currentColor" />
                                                                <span className="text-xs font-black">{manga.score / 10}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(manga.genres || []).slice(0, 3).map(genre => (
                                                            <span key={genre} className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{genre}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <ArrowRight className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
                                            </motion.button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-muted/5 rounded-[32px] border-2 border-dashed border-border/40">
                                        <p className="text-sm text-muted-foreground italic font-serif">No artifacts match your query in this realm.</p>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            /* Entry View */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pb-20">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <div className="flex items-center gap-3 mb-8 px-4">
                                        <History className="w-4 h-4 text-primary" />
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground">Recent Expeditions</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {['Berserk', 'One Piece', 'Chainsaw Man'].map((item, idx) => (
                                            <motion.button 
                                                key={item} 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.1 + idx * 0.05 }}
                                                whileHover={{ x: 8, color: 'var(--primary)' }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full text-left px-6 py-5 rounded-[24px] bg-card border border-border/10 hover:border-primary/20 text-muted-foreground hover:text-foreground text-sm font-black uppercase tracking-widest transition-all flex items-center justify-between group"
                                            >
                                                {item}
                                                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <div className="flex items-center gap-3 mb-8 px-4">
                                        <TrendingUp className="w-4 h-4 text-primary" />
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-foreground">Active Trending</h3>
                                    </div>
                                    <div className="space-y-2">
                                        {['Dandadan', 'Solo Leveling', 'Vagabond'].map((item, idx) => (
                                            <motion.button 
                                                key={item} 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.15 + idx * 0.05 }}
                                                whileHover={{ x: 8, color: 'var(--primary)' }}
                                                whileTap={{ scale: 0.98 }}
                                                className="w-full text-left px-6 py-5 rounded-[24px] bg-card border border-border/10 hover:border-primary/20 text-muted-foreground hover:text-foreground text-sm font-black uppercase tracking-widest transition-all flex items-center justify-between group"
                                            >
                                                {item}
                                                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                                
                                <Surface variant="muted" className="col-span-1 md:col-span-2 p-8 text-center border-dashed border-2 rounded-[32px]">
                                    <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em]">
                                        Power User Tip: Type <span className="text-primary font-black">{'>'}</span> followed by a command to execute sanctuary protocols.
                                    </p>
                                </Surface>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </Surface>
    );
};
