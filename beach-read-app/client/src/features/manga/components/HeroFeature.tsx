import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { sanitizeCoverUrl } from '../../../shared/utils/image';
import { BUTTON_FEEDBACK } from '../../../shared/utils/motion-variants';

interface HeroItem {
    id: string;
    title: string;
    titleJp: string;
    coverUrl: string;
    genres?: string[];
    description?: string;
}

interface HeroFeatureProps {
    data: HeroItem[];
}

export function HeroFeature({ data }: HeroFeatureProps) {
    const safeData = Array.isArray(data) ? data : data ? [data] : [];
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    const nextSlide = useCallback(() => {
        if (safeData.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % safeData.length);
    }, [safeData.length]);

    const prevSlide = useCallback(() => {
        if (safeData.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + safeData.length) % safeData.length);
    }, [safeData.length]);

    useEffect(() => {
        if (!safeData || safeData.length <= 1 || isPaused) return;

        const interval = setInterval(nextSlide, 8000);
        return () => clearInterval(interval);
    }, [safeData, isPaused, nextSlide]);

    if (!safeData || safeData.length === 0) return null;

    return (
        <div
            className="relative h-[85vh] min-h-[650px] md:min-h-[750px] w-full overflow-hidden bg-background"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Background Images Layer */}
            {safeData.map((item, index) => (
                <div
                    key={`bg-${item.id}`}
                    className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
                    style={{
                        opacity: index === currentIndex ? 1 : 0,
                        zIndex: 0,
                        backgroundImage: `url(${sanitizeCoverUrl(item.coverUrl)})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                />
            ))}

            {/* Visibility Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/40 to-transparent z-[1] w-full md:w-[70%]" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/20 to-transparent z-[1]" />

            {/* Content Slider */}
            <div
                className="relative z-[2] flex h-full transition-transform duration-700 ease-in-out"
                style={{
                    transform: `translateX(-${currentIndex * 100}%)`,
                    width: `${safeData.length * 100}%`
                }}
            >
                {safeData.map((item) => (
                    <div
                        key={`content-${item.id}`}
                        className="flex h-full flex-col justify-center px-[64px] pt-[100px]"
                        style={{ width: `${100 / safeData.length}%` }}
                    >
                        <div style={{ maxWidth: '720px' }} className="flex flex-col">
                            <span className="mb-4 inline-block text-[12px] font-black uppercase tracking-[0.4em] text-primary/80">
                                Featured Collection
                            </span>

                            <h1 className="mb-4 font-serif text-[clamp(40px,5vw,72px)] font-medium leading-[1.1] tracking-tight text-foreground text-left">
                                {item.title}
                            </h1>

                            {item.titleJp && (
                                <p
                                    className="mb-8 text-[20px] font-light italic text-foreground/20 text-left"
                                    style={{ fontFamily: '"Noto Sans JP", sans-serif' }}
                                >
                                    {item.titleJp}
                                </p>
                            )}

                            {item.description && (
                                <div
                                    className="mb-10 max-w-[620px] text-[15px] font-medium leading-[1.8] text-foreground/60 line-clamp-3 text-left font-serif italic"
                                    dangerouslySetInnerHTML={{ __html: item.description }}
                                />
                            )}

                            <div className="flex items-center gap-4">
                                <Link to={`/manga/${item.id}`} className="no-underline">
                                    <motion.button 
                                        {...BUTTON_FEEDBACK}
                                        className="flex h-[52px] items-center gap-3 rounded-full border-none bg-primary px-8 text-[13px] font-bold uppercase tracking-widest text-primary-foreground cursor-pointer transition-all hover:bg-primary/90"
                                    >
                                        Open Archive
                                        <ArrowRight size={18} />
                                    </motion.button>
                                </Link>

                                <motion.button 
                                    {...BUTTON_FEEDBACK}
                                    className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-foreground/5 bg-background/50 backdrop-blur-sm cursor-pointer transition-all hover:border-primary/30 hover:bg-primary/5"
                                >
                                    <Bookmark size={20} className="text-foreground/50" />
                                </motion.button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Controls */}
            {safeData.length > 1 && (
                <>
                    <div className="absolute bottom-[40px] right-[64px] z-[20] flex items-center gap-[12px]">
                        <motion.button
                            {...BUTTON_FEEDBACK}
                            onClick={prevSlide}
                            className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-foreground/10 bg-background/20 text-foreground backdrop-blur-md transition-all hover:bg-background/40"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft size={20} />
                        </motion.button>
                        <motion.button
                            {...BUTTON_FEEDBACK}
                            onClick={nextSlide}
                            className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-foreground/10 bg-background/20 text-foreground backdrop-blur-md transition-all hover:bg-background/40"
                            aria-label="Next slide"
                        >
                            <ChevronRight size={20} />
                        </motion.button>
                    </div>

                    {/* Pagination Indicators */}
                    <div className="absolute bottom-[40px] left-[64px] z-[20] flex items-center gap-[8px]">
                        {safeData.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`h-[4px] transition-all duration-300 ${index === currentIndex ? 'w-[32px] bg-foreground' : 'w-[8px] bg-foreground/30'
                                    } rounded-full`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
