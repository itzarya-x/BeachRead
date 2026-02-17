import { openCommandPalette } from "@/lib/command-palette";
import { IconButton } from "@/components/ui/YuraButton";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

interface TopHeaderProps {
    onQuickAdd?: () => void;
}

export function TopHeader({ onQuickAdd }: TopHeaderProps) {
    const handleSearchFocus = () => {
        openCommandPalette();
    };

    return (
        <header className="sakura-topbar flex h-16 md:h-20 items-center shrink-0 shadow-depth1 sticky top-0 z-40">
            <div className="page-container flex items-center gap-3 md:gap-4 w-full px-4">
                {/* Mobile Brand */}
                <div className="md:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary shadow-[0_0_20px_-12px_hsl(var(--primary)/0.9)]">
                    <div className="text-lg font-black text-primary-foreground">Y</div>
                </div>

                <div className="flex flex-1 items-center gap-2 md:gap-4">
                    <div className="relative w-full max-w-lg group">
                        <Search className="absolute left-3 md:left-4 top-1/2 h-3.5 w-3.5 md:h-4 md:w-4 -translate-y-1/2 text-primary/50 transition-colors group-focus-within:text-primary" />
                        <Input
                            type="search"
                            placeholder="Search titles..."
                            readOnly
                            onFocus={handleSearchFocus}
                            onClick={handleSearchFocus}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    handleSearchFocus();
                                }
                            }}
                            aria-label="Open search palette"
                            className="h-10 md:h-12 w-full rounded-xl md:rounded-2xl border-white/5 bg-white/5 pl-10 md:pl-12 pr-4 md:pr-16 text-xs md:text-sm placeholder:text-white/30 focus-visible:border-primary/30 focus-visible:bg-white/10 focus-visible:ring-primary/20 transition-all duration-300 shadow-sm"
                        />
                        <kbd className="pointer-events-none absolute right-4 top-1/2 hidden h-6 -translate-y-1/2 items-center rounded-lg border border-white/10 bg-white/5 px-2 text-[9px] font-black uppercase tracking-widest text-white/30 md:inline-flex">
                            Ctrl K
                        </kbd>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <IconButton 
                        icon={Plus} 
                        label="Quick Add" 
                        size="sm" 
                        variant="ghost"
                        onClick={onQuickAdd}
                        aria-label="Quick add entry"
                        className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl border border-white/5 bg-white/5 hover:border-primary/30 hover:bg-white/10 hover:text-primary transition-all duration-300" 
                    />
                </div>
            </div>
        </header>
    );
}
