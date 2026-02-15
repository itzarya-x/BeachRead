import { ScoreDisplay } from "@/components/media/ScoreDisplay";
import { Button } from "@/components/ui/YuraButton";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { useData } from "@/context/DataContext";
import type { DisplayMedia } from "@/types/display";
import { motion } from "framer-motion";
import { Edit2, Heart, Play } from "lucide-react";
import { Link } from "react-router-dom";

interface HeroCarouselProps {
    items: DisplayMedia[];
}

export function HeroCarousel({ items }: HeroCarouselProps) {
    if (items.length === 0) return null;

    return (
        <div className="w-full relative group px-2 md:px-0">
            <Carousel
                className="w-full"
                opts={{
                    align: "start",
                    loop: true,
                }}
            >
                <CarouselContent className="-ml-0">
                    {items.slice(0, 5).map((item) => (
                        <CarouselItem key={item._seriesId} className="pl-0">
                            <HeroSlide media={item} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <div className="hidden md:flex opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                     <CarouselPrevious className="left-8 h-12 w-12 border-border bg-card/90 text-foreground shadow-sm hover:border-primary/25 hover:bg-accent" />
                     <CarouselNext className="right-8 h-12 w-12 border-border bg-card/90 text-foreground shadow-sm hover:border-primary/25 hover:bg-accent" />
                </div>
            </Carousel>
        </div>
    );
}

function HeroSlide({ media }: { media: DisplayMedia }) {
    const { getTitle, user } = useData();
    const title = getTitle(media);
    const scoreFormat = user?.scoreFormat || "POINT_10";
    const linkPath = `/${media.mediaType.toLowerCase()}/${media._seriesId}`;

    return (
        <div className="relative h-[500px] w-full overflow-hidden rounded-[2.5rem] border border-border/80 shadow-sm md:h-[650px]">
            {/* Background Image (Cinematic Backdrop) */}
            <div className="absolute inset-0">
                {media.bannerImage || media.coverImage ? (
                    <motion.img
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
                        src={media.bannerImage || media.coverImage || ""}
                        alt=""
                        className="h-full w-full object-cover opacity-55 transition-transform ease-linear"
                        style={{ filter: "brightness(0.88) contrast(1.02)", transitionDuration: "40s" }}
                    />
                ) : (
                    <div className="w-full h-full bg-surface-base" />
                )}
                
                {/* Dynamic Overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent" />
                <div className="absolute inset-0 bg-primary/[0.05]" />
            </div>

            {/* Content Container */}
            <div className="relative h-full container mx-auto px-8 md:px-20 flex flex-col justify-center items-start">
                
                {/* Meta Tag */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-3 mb-4"
                >
                    <span className="rounded-lg border border-primary/25 bg-accent px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                        Featured {media.mediaType}
                    </span>
                    {media.score > 0 && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/85">
                            <ScoreDisplay score={media.score} format={scoreFormat} size="sm" />
                        </div>
                    )}
                </motion.div>

                {/* Main Heading */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="max-w-4xl"
                >
                    <Link to={linkPath} className="group">
                        <h1 className="text-5xl md:text-9xl font-black text-foreground tracking-tighter leading-[0.85] mb-8 group-hover:text-primary transition-all duration-700">
                            {title}
                        </h1>
                    </Link>
                </motion.div>

                {/* Description / Summary if available */}
                {media.description && (
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mb-10 max-w-xl line-clamp-3 text-base font-medium leading-relaxed text-foreground/75 md:text-lg"
                        dangerouslySetInnerHTML={{ __html: media.description }}
                    />
                )}

                {/* Primary Actions (Task 3) */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="flex items-center gap-4"
                >
                    <Button 
                        size="lg" 
                        className="h-14 gap-3 rounded-2xl bg-primary px-10 text-sm font-semibold uppercase tracking-widest shadow-sm transition-all hover:scale-105 hover:bg-primary/90 active:scale-95"
                        asChild
                    >
                        <Link to={linkPath}>
                            <Play className="fill-current w-5 h-5 translate-x-0.5" />
                            Continue
                        </Link>
                    </Button>
                    
                    <button className="group flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card/90 shadow-sm transition-all hover:scale-110 hover:border-primary/30 hover:bg-accent active:scale-90">
                        <Heart className="h-6 w-6 text-foreground transition-all group-hover:fill-primary group-hover:text-primary" />
                    </button>
                    
                    <button className="group flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card/90 shadow-sm transition-all hover:scale-110 hover:border-primary/30 hover:bg-accent active:scale-90">
                        <Edit2 className="h-5 w-5 text-foreground transition-all group-hover:text-primary" />
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
