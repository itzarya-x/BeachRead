import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { sanitizeCoverUrl } from '../../lib/image';

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
            className="relative h-[100vh] w-full overflow-hidden bg-background"
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
                        backgroundPosition: 'center center',
                        backgroundRepeat: 'no-repeat',
                    }}
                />
            ))}

            {/* Overlay Gradient */}
            <div
                className="absolute inset-0 z-[1]"
                style={{
                    background: `linear-gradient(
                        to right,
                        hsl(var(--background)) 0%,
                        hsl(var(--background)) 18%,
                        hsl(var(--background) / 0.85) 30%,
                        hsl(var(--background) / 0.55) 42%,
                        hsl(var(--background) / 0.22) 58%,
                        hsl(var(--background) / 0.06) 72%,
                        transparent 82%
                    )`,
                }}
            />

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
                        className="flex h-full flex-col justify-center px-[88px] pr-[64px] pt-[36px]"
                        style={{ width: `${100 / safeData.length}%` }}
                    >
                        <div style={{ maxWidth: '560px' }}>
                            <h2
                                className="mb-[26px] text-[34px] font-bold leading-none tracking-[-0.02em] text-foreground"
                                style={{ margin: 0, marginBottom: '26px' }}
                            >
                                Trending Now
                            </h2>

                            <div className="mb-[22px] flex flex-wrap gap-[8px]">
                                {item.genres?.map((g: string) => (
                                    <span
                                        key={g}
                                        className="rounded-[4px] border border-foreground/10 bg-foreground/5 px-[10px] py-[4px] text-[12px] font-normal leading-[1.4] text-foreground/70"
                                    >
                                        {g}
                                    </span>
                                ))}
                            </div>

                            <p
                                className="mb-[44px] max-w-[470px] text-[12px] font-normal leading-[1.55] text-foreground/70"
                                style={{ margin: 0, marginBottom: '44px' }}
                            >
                                {item.description}
                            </p>

                            <h1
                                className="text-[clamp(72px,8vw,96px)] font-extrabold leading-[0.92] tracking-[-0.045em] text-foreground"
                                style={{ margin: 0 }}
                            >
                                {item.title}
                            </h1>

                            <p
                                className="mb-[42px] mt-[18px] text-[18px] font-light leading-none tracking-[0.08em] text-foreground/70"
                                style={{ 
                                    margin: 0, 
                                    marginTop: '18px', 
                                    marginBottom: '42px',
                                    fontFamily: '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif' 
                                }}
                            >
                                {item.titleJp}
                            </p>

                            <div className="flex items-center gap-[10px]">
                                <Link to={`/manga/${item.id}`} className="no-underline">
                                    <button
                                        className="flex h-[40px] items-center gap-[7px] rounded-[7px] border-none bg-foreground px-[20px] text-[13px] font-semibold leading-none tracking-[-0.01em] text-background cursor-pointer hover:opacity-90 transition-opacity"
                                    >
                                        Chapter 1
                                        <ArrowRight style={{ width: '15px', height: '15px' }} />
                                    </button>
                                </Link>

                                <button
                                    className="flex h-[40px] w-[40px] items-center justify-center rounded-[7px] border border-foreground/20 bg-transparent cursor-pointer hover:bg-foreground/5 transition-colors"
                                >
                                    <Bookmark style={{ width: '16px', height: '16px', opacity: 0.6 }} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation Controls */}
            {safeData.length > 1 && (
                <>
                    <div className="absolute bottom-[40px] right-[88px] z-[3] flex items-center gap-[12px]">
                        <button
                            onClick={prevSlide}
                            className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-foreground/10 bg-background/20 text-foreground backdrop-blur-md transition-all hover:bg-background/40"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-foreground/10 bg-background/20 text-foreground backdrop-blur-md transition-all hover:bg-background/40"
                            aria-label="Next slide"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Pagination Indicators */}
                    <div className="absolute bottom-[40px] left-[88px] z-[3] flex items-center gap-[8px]">
                        {safeData.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`h-[4px] transition-all duration-300 ${
                                    index === currentIndex ? 'w-[32px] bg-foreground' : 'w-[8px] bg-foreground/30'
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
