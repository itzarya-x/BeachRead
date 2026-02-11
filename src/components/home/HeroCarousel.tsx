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
                     <CarouselPrevious className="left-8 bg-black/40 backdrop-blur-md border-white/10 hover:bg-black/60 w-12 h-12" />
                     <CarouselNext className="right-8 bg-black/40 backdrop-blur-md border-white/10 hover:bg-black/60 w-12 h-12" />
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
        <div className="relative h-[500px] md:h-[650px] w-full overflow-hidden rounded-[2.5rem] border border-white/5 shadow-2xl">
            {/* Background Image (Cinematic Backdrop) */}
            <div className="absolute inset-0">
                {media.bannerImage || media.coverImage ? (
                    <motion.img
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
                        src={media.bannerImage || media.coverImage || ""}
                        alt=""
                        className="w-full h-full object-cover opacity-60 transition-transform duration-[40s] ease-linear"
                        style={{ filter: "brightness(0.7) contrast(1.1)" }}
                    />
                ) : (
                    <div className="w-full h-full bg-surface-base" />
                )}
                
                {/* Dynamic Overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute inset-0 bg-black/20" />
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
                    <span className="bg-primary/20 backdrop-blur-md px-3 py-1 rounded-lg text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">
                        Featured {media.mediaType}
                    </span>
                    {media.score > 0 && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-white/80">
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
                        className="text-white/60 text-base md:text-lg max-w-xl mb-10 line-clamp-3 leading-relaxed font-medium"
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
                        className="h-14 rounded-2xl px-10 gap-3 font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/20 bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all"
                        asChild
                    >
                        <Link to={linkPath}>
                            <Play className="fill-current w-5 h-5 translate-x-0.5" />
                            Continue
                        </Link>
                    </Button>
                    
                    <button className="h-14 w-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:scale-110 active:scale-90 group backdrop-blur-md">
                        <Heart className="w-6 h-6 text-white group-hover:fill-primary group-hover:text-primary transition-all" />
                    </button>
                    
                    <button className="h-14 w-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-all hover:scale-110 active:scale-90 group backdrop-blur-md">
                        <Edit2 className="w-5 h-5 text-white group-hover:text-primary transition-all" />
                    </button>
                </motion.div>
            </div>
        </div>
    );
}

