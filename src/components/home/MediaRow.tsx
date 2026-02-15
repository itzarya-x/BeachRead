import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface MediaRowProps {
    title: string;
    icon?: LucideIcon;
    count?: number;
    children: ReactNode;
    className?: string;
}

export function MediaRow({ title, icon: Icon, count, children, className }: MediaRowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    };

    useEffect(() => {
        const timeout = setTimeout(checkScroll, 100);
        const el = scrollRef.current;
        el?.addEventListener("scroll", checkScroll, { passive: true });
        window.addEventListener("resize", checkScroll);
        return () => {
            clearTimeout(timeout);
            el?.removeEventListener("scroll", checkScroll);
            window.removeEventListener("resize", checkScroll);
        };
    }, [children]);

    const scroll = (dir: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        const scrollAmount = el.clientWidth * 0.8;
        el.scrollBy({
            left: dir === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    return (
        <section className={cn("relative group/row space-y-5", className)}>
            <div className="section-header flex items-end justify-between px-6 lg:px-14">
                <div className="space-y-1">
                    <h2 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                        {Icon && <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary/90" />}
                        {title}
                        {count !== undefined && (
                            <span className="ml-2 text-[11px] font-semibold text-muted-foreground">
                                / {count}
                            </span>
                        )}
                    </h2>
                </div>
                
                <div className="flex gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300 pb-1">
                    <button
                        onClick={() => scroll("left")}
                        disabled={!canScrollLeft}
                        className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition-all",
                            canScrollLeft
                                ? "text-foreground hover:scale-105 hover:border-primary/30 hover:bg-accent hover:text-primary"
                                : "cursor-default text-muted-foreground/50",
                        )}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        disabled={!canScrollRight}
                        className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card transition-all",
                            canScrollRight
                                ? "text-foreground hover:scale-105 hover:border-primary/30 hover:bg-accent hover:text-primary"
                                : "cursor-default text-muted-foreground/50",
                        )}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="relative group/scroll">
                {/* Horizontal Fade Edges (Task 6) */}
                <div 
                    className={cn(
                        "absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-500",
                        canScrollLeft ? "opacity-100" : "opacity-0"
                    )} 
                />
                <div 
                    className={cn(
                        "absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-500",
                        canScrollRight ? "opacity-100" : "opacity-0"
                    )} 
                />

                <div 
                    ref={scrollRef} 
                    className="flex gap-5 overflow-x-auto scroll-smooth pb-8 hide-scrollbar px-6 lg:px-14 snap-x snap-mandatory"
                >
                    {children}
                </div>
            </div>
        </section>
    );
}
