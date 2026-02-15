import { IconButton } from "@/components/ui/YuraButton";
import { Input } from "@/components/ui/input";
import { Bell, Plus, Search } from "lucide-react";

export function TopHeader() {
    return (
        <header className="sakura-glass sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-border/80 px-4 md:px-8">
            {/* Mobile Brand */}
            <div className="md:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary shadow-[0_0_20px_-12px_hsl(var(--primary)/0.9)]">
                <div className="text-lg font-black text-primary-foreground">Y</div>
            </div>

            <div className="flex flex-1 items-center gap-2 md:gap-4">
                <div className="relative w-full max-w-lg group">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80 transition-colors group-focus-within:text-primary" />
                    <Input
                        type="search"
                        placeholder="Search titles, genres, tags..."
                        className="h-11 w-full rounded-xl border-border/80 bg-card/55 pl-11 pr-16 text-sm placeholder:text-muted-foreground/70 focus-visible:border-primary/45 focus-visible:bg-card/70 focus-visible:ring-2 focus-visible:ring-primary/20"
                    />
                    <kbd className="pointer-events-none absolute right-3 top-1/2 hidden h-6 -translate-y-1/2 items-center rounded-md border border-border bg-muted px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:inline-flex">
                        Ctrl K
                    </kbd>
                </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2.5">
                <IconButton 
                    icon={Plus} 
                    label="Quick Add" 
                    size="sm" 
                    variant="ghost"
                    className="border border-transparent hover:border-primary/30 hover:bg-accent hover:text-primary" 
                />
                <div className="relative">
                    <IconButton 
                        icon={Bell} 
                        label="Notifications" 
                        size="sm" 
                        variant="ghost"
                        className="border border-transparent hover:border-primary/30 hover:bg-accent hover:text-primary" 
                    />
                    <span className="absolute right-1 top-1 flex h-2 w-2 md:right-2 md:top-2 md:h-2.5 md:w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full border-2 border-background bg-primary md:h-2.5 md:w-2.5"></span>
                    </span>
                </div>
            </div>
        </header>
    );
}
