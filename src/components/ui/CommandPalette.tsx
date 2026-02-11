import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import ds from "@/styles/design-system";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Command, Hash, Search, Tv, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { animeList, mangaList, getTitle } = useData();
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery("");
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const results = query 
        ? [
            ...animeList.filter(m => getTitle(m).toLowerCase().includes(query.toLowerCase())).map(m => ({ ...m, type: 'ANIME' })),
            ...mangaList.filter(m => getTitle(m).toLowerCase().includes(query.toLowerCase())).map(m => ({ ...m, type: 'MANGA' }))
          ].slice(0, 8)
        : [];

    const handleSelect = (item: any) => {
        navigate(`/${item.type.toLowerCase()}/${item.id || item.seriesId}`);
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === "Enter" && results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />
                    
                    {/* Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2, ease: ds.motion.easing.default as any }}
                        className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-xl bg-surface-elevated1 border border-white/5 rounded-3xl shadow-depth3 z-[101] overflow-hidden"
                    >
                        <div className="flex items-center px-4 py-4 border-b border-white/5 gap-3">
                            <Search className="w-5 h-5 text-primary" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search synthetic signals..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="bg-transparent flex-1 text-lg font-medium text-foreground outline-none placeholder:text-muted-foreground/30"
                            />
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[10px] font-black text-muted-foreground/40">
                                <Command className="w-3 h-3" />
                                <span>K</span>
                            </div>
                        </div>

                        {results.length > 0 ? (
                            <div className="p-2 max-h-[400px] overflow-y-auto">
                                {results.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelect(item)}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                        className={cn(
                                            "w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 group",
                                            selectedIndex === idx ? "bg-primary/10" : "hover:bg-white/5"
                                        )}
                                    >
                                        <div className="w-10 h-14 rounded-lg overflow-hidden bg-surface-base shrink-0 border border-white/5">
                                            {item.coverImage ? (
                                                <img src={item.coverImage} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    {item.type === 'ANIME' ? <Tv className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <div className={cn(
                                                "font-black tracking-tight truncate transition-colors",
                                                selectedIndex === idx ? "text-primary" : "text-foreground"
                                            )}>
                                                {getTitle(item)}
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mt-0.5">
                                                <span>{item.type}</span>
                                                <span>•</span>
                                                <span>{item.status}</span>
                                            </div>
                                        </div>
                                        {selectedIndex === idx && (
                                            <div className="px-2 py-1 rounded bg-primary/20 text-primary text-[8px] font-black uppercase tracking-widest">
                                                Jump To
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : query ? (
                            <div className="py-12 text-center text-muted-foreground/40 flex flex-col items-center gap-3">
                                <Hash className="w-8 h-8 opacity-20" />
                                <p className="text-sm font-black uppercase tracking-[0.2em]">No signals detected</p>
                            </div>
                        ) : (
                            <div className="p-6">
                                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/20 mb-4">Jump To Platform</div>
                                <div className="grid grid-cols-2 gap-3">
                                    <QuickAction icon={Tv} label="Archive" onClick={() => { navigate('/anime'); setIsOpen(false); }} />
                                    <QuickAction icon={BookOpen} label="Library" onClick={() => { navigate('/manga'); setIsOpen(false); }} />
                                    <QuickAction icon={User} label="Protocol" onClick={() => { navigate('/settings'); setIsOpen(false); }} />
                                    <QuickAction icon={Hash} label="Intelligence" onClick={() => { navigate('/stats'); setIsOpen(false); }} />
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className="flex items-center gap-3 p-4 rounded-2xl bg-surface-base border border-white/5 hover:border-primary/40 hover:bg-primary/5 transition-all group"
        >
            <Icon className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 group-hover:text-foreground transition-colors">{label}</span>
        </button>
    );
}
