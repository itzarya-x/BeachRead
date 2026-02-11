import { IconButton } from "@/components/ui/YuraButton";
import { Input } from "@/components/ui/input";
import { Bell, Plus, Search } from "lucide-react";

export function TopHeader() {
    return (
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-border/10 bg-background/60 px-4 md:px-8 backdrop-blur-2xl transition-all">
            {/* Mobile Brand */}
            <div className="md:hidden w-10 h-10 rounded-xl bg-primary flex items-center justify-center rotate-3 shadow-glow shrink-0">
                <div className="-rotate-3 text-primary-foreground font-black text-lg">Y</div>
            </div>

            <div className="flex flex-1 items-center gap-2 md:gap-4">
                <div className="relative w-full max-w-lg group">
                    <Search className="absolute left-3 md:left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="w-full bg-surface-2/80 h-10 md:h-11 pl-9 md:pl-11 border-border/5 focus-visible:bg-surface-2 focus-visible:ring-primary/20 transition-all rounded-xl text-xs md:text-sm"
                    />
                </div>
            </div>
            <div className="flex items-center gap-1 md:gap-3">
                <IconButton 
                    icon={Plus} 
                    label="Quick Add" 
                    size="sm" 
                    variant="ghost"
                    className="hover:bg-primary/10 hover:text-primary" 
                />
                <div className="relative">
                    <IconButton 
                        icon={Bell} 
                        label="Notifications" 
                        size="sm" 
                        variant="ghost"
                        className="hover:bg-primary/10 hover:text-primary" 
                    />
                    <span className="absolute top-1 right-1 md:top-2 md:right-2 flex h-2 w-2 md:h-2.5 md:w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 md:h-2.5 md:w-2.5 bg-primary border-2 border-background"></span>
                    </span>
                </div>
            </div>
        </header>
    );
}
