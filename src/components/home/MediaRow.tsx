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
        <section className={cn("relative group/row space-y-8", className)}>
            <div className="section-header flex items-end justify-between px-6 lg:px-14">
                <div className="space-y-1">
                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter flex items-center gap-4">
                        {Icon && <Icon className="w-8 h-8 md:w-10 md:h-10 text-primary" />}
                        {title}
                        {count !== undefined && (
                            <span className="text-xs font-bold text-white/20 ml-2">
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
                            "w-12 h-12 rounded-full border border-white/10 flex items-center justify-center transition-all bg-black/20 backdrop-blur-md",
                            canScrollLeft
                                ? "text-white hover:bg-primary hover:text-primary-foreground hover:scale-110"
                                : "text-white/20 cursor-default",
                        )}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        disabled={!canScrollRight}
                        className={cn(
                            "w-12 h-12 rounded-full border border-white/10 flex items-center justify-center transition-all bg-black/20 backdrop-blur-md",
                            canScrollRight
                                ? "text-white hover:bg-primary hover:text-primary-foreground hover:scale-110"
                                : "text-white/20 cursor-default",
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
                    className="flex gap-6 overflow-x-auto scroll-smooth pb-10 hide-scrollbar px-6 lg:px-14 snap-x snap-mandatory"
                >
                    {children}
                </div>
            </div>
        </section>
    );
}
