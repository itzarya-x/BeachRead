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
        <section className={cn("relative group/row space-y-4 md:space-y-6", className)}>
            <div className="section-header flex items-end justify-between px-2">
                <div className="space-y-1">
                    <h2 className="flex items-center gap-3 md:gap-4 text-xl md:text-3xl font-black tracking-tighter text-foreground uppercase">
                        {Icon && <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />}
                        {title}
                        {count !== undefined && (
                            <span className="ml-2 text-[9px] md:text-[10px] font-bold text-white/20 tracking-widest">
                                [{count}]
                            </span>
                        )}
                    </h2>
                </div>
                
                <div className="hidden md:flex gap-3 opacity-0 group-hover/row:opacity-100 transition-opacity duration-500 pb-1">
                    <button
                        onClick={() => scroll("left")}
                        disabled={!canScrollLeft}
                        className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-white/5 transition-all",
                            canScrollLeft
                                ? "text-white/70 hover:scale-105 hover:border-primary/30 hover:bg-white/10 hover:text-primary"
                                : "cursor-default text-white/10",
                        )}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        disabled={!canScrollRight}
                        className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-white/5 transition-all",
                            canScrollRight
                                ? "text-white/70 hover:scale-105 hover:border-primary/30 hover:bg-white/10 hover:text-primary"
                                : "cursor-default text-white/10",
                        )}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            </div>

            <div className="relative group/scroll">
                {/* Horizontal Fade Edges (Task 6) */}
                <div 
                    className={cn(
                        "absolute left-0 top-0 bottom-0 w-20 md:w-40 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-700",
                        canScrollLeft ? "opacity-100" : "opacity-0"
                    )} 
                />
                <div 
                    className={cn(
                        "absolute right-0 top-0 bottom-0 w-20 md:w-40 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-700",
                        canScrollRight ? "opacity-100" : "opacity-0"
                    )} 
                />

                <div 
                    ref={scrollRef} 
                    className="flex gap-4 md:gap-6 overflow-x-auto scroll-smooth pb-6 md:pb-10 touch-scroll snap-x snap-mandatory px-2 md:px-0"
                >
                    {children}
                </div>
            </div>
        </section>
    );
}
