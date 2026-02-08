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
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    };

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        el?.addEventListener("scroll", checkScroll);
        window.addEventListener("resize", checkScroll);
        return () => {
            el?.removeEventListener("scroll", checkScroll);
            window.removeEventListener("resize", checkScroll);
        };
    }, [children]);

    const scroll = (dir: "left" | "right") => {
        scrollRef.current?.scrollBy({
            left: dir === "left" ? -400 : 400,
            behavior: "smooth",
        });
    };

    return (
        <section className={cn("relative", className)}>
            <div className="section-header flex items-center justify-between mb-5">
                <h2 className="section-title text-xl md:text-2xl">
                    {Icon && <Icon className="w-5 h-5 text-primary" />}
                    {title}
                    {count !== undefined && (
                        <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                            {count}
                        </span>
                    )}
                </h2>
                <div className="flex gap-1">
                    <button
                        onClick={() => scroll("left")}
                        disabled={!canScrollLeft}
                        className={cn(
                            "p-1.5 rounded-lg transition-all duration-200",
                            canScrollLeft
                                ? "text-foreground hover:bg-secondary hover:scale-110"
                                : "text-muted-foreground/30 cursor-default",
                        )}
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        disabled={!canScrollRight}
                        className={cn(
                            "p-1.5 rounded-lg transition-all duration-200",
                            canScrollRight
                                ? "text-foreground hover:bg-secondary hover:scale-110"
                                : "text-muted-foreground/30 cursor-default",
                        )}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Scroll fade edges */}
            {canScrollLeft && (
                <div className="absolute left-0 top-12 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            )}
            {canScrollRight && (
                <div className="absolute right-0 top-12 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            )}

            <div ref={scrollRef} className="flex gap-3 overflow-x-auto scroll-smooth pb-2 hide-scrollbar">
                {children}
            </div>
        </section>
    );
}
