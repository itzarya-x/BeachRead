import { COMMAND_PALETTE_OPEN_EVENT } from "@/lib/command-palette";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Command, Hash, Search, Tv, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ElementType } from "react";
import { useNavigate } from "react-router-dom";

const paletteEase = [0.23, 1, 0.32, 1] as const;

type SearchResultItem = {
    _seriesId: number;
    coverImage: string | null;
    status: string;
    type: "ANIME" | "MANGA";
};

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
        const openListener = (event: Event) => {
            const detail = (event as CustomEvent<{ query?: string }>).detail;
            setIsOpen(true);
            setQuery(detail?.query ?? "");
            setSelectedIndex(0);
        };

        window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, openListener);
        return () => window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, openListener);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const results: SearchResultItem[] = query
        ? [
            ...animeList.filter(m => getTitle(m).toLowerCase().includes(query.toLowerCase())).map(m => ({ ...m, type: "ANIME" as const })),
            ...mangaList.filter(m => getTitle(m).toLowerCase().includes(query.toLowerCase())).map(m => ({ ...m, type: "MANGA" as const }))
        ].slice(0, 8)
        : [];

    const handleSelect = (item: SearchResultItem) => {
        navigate(`/${item.type.toLowerCase()}/${item._seriesId}`);
        setIsOpen(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (results.length === 0) return;

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
                        className="fixed inset-0 z-[100] bg-background/70"
                    />
                    
                    {/* Palette */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ duration: 0.2, ease: paletteEase }}
                        className="fixed left-1/2 top-[15%] z-[101] w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
                    >
                        <div className="flex items-center gap-3 border-b border-border px-4 py-4">
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
                            <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
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
                                            selectedIndex === idx ? "bg-accent" : "hover:bg-muted/50"
                                        )}
                                    >
                                        <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                                            {item.coverImage ? (
                                                <img
                                                    src={item.coverImage}
                                                    alt={`${getTitle(item)} cover`}
                                                    className="w-full h-full object-cover"
                                                />
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
                                            <div className="mt-0.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                                <span>{item.type}</span>
                                                <span>•</span>
                                                <span>{item.status}</span>
                                            </div>
                                        </div>
                                        {selectedIndex === idx && (
                                            <div className="rounded bg-accent px-2 py-1 text-[8px] font-semibold uppercase tracking-widest text-primary">
                                                Jump To
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : query ? (
                            <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                                <Hash className="w-8 h-8 opacity-20" />
                                <p className="text-sm font-semibold uppercase tracking-[0.2em]">No signals detected</p>
                            </div>
                        ) : (
                            <div className="p-6">
                                <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Jump To Platform</div>
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

function QuickAction({ icon: Icon, label, onClick }: { icon: ElementType; label: string; onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-accent"
        >
            <Icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-foreground">{label}</span>
        </button>
    );
}
