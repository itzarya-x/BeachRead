import { useMemo, useRef, useState, useEffect } from 'react';
import { useFetch } from '../shared/hooks/useFetch';
import { HeroFeature } from '../features/manga/components/HeroFeature';
import { DiscoverCarousel } from '../features/discover/components/DiscoverCarousel';
import { useAuth } from '../features/auth/context/auth-context';
import { useLibrary } from '../features/library/hooks/useLibrary';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight,
    Coffee,
    Wind,
    Moon,
    Sparkles,
    BookOpen,
    Bell,
    AlertCircle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useReleaseAlertsPolling } from '../features/home/hooks/useReleaseAlertsPolling';
import { SanctuarySchedule } from '../shared/components/layout/SanctuarySchedule';
import { MediaCard, MediaCardSkeleton } from '../shared/ui/MediaCard';
import { Surface } from '../shared/ui/Surface';
import { Button } from '../shared/ui/Button';
import { EmptyState } from '../shared/ui/EmptyState';
import { cn } from '../shared/utils/cn';

function toTitle(value: unknown): string {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        const v = value as Record<string, unknown>;
        if (typeof v.english === 'string') return v.english;
        if (typeof v.romaji === 'string') return v.romaji;
        if (typeof v.userPreferred === 'string') return v.userPreferred;
    }
    return '';
}

export function Home() {
    const { user } = useAuth();
    const { library, loading: libraryLoading } = useLibrary();
    const navigate = useNavigate();

    // Scroll controls for 'Continuing the Journey'
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current;
            const scrollAmount = direction === 'left' ? -clientWidth * 0.8 : clientWidth * 0.8;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const { data: homeFeedData, loading: homeFeedLoading, error: homeFeedError } = useFetch<any>('/home-feed');

    const { syncJobs, releaseAlerts } = useReleaseAlertsPolling(user?.id);

    const continueReading = useMemo(() => {
        return library
            .filter(item => item.status === 'READING' || item.status === 'CURRENT')
            .sort((a, b) => Date.parse(b.updatedAt || '') - Date.parse(a.updatedAt || ''))
            .slice(0, 20);
    }, [library]);

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [continueReading, libraryLoading]);

    const maintenanceJobs = useMemo(() => {
        return syncJobs.filter(job => job.status === 'FAILED');
    }, [syncJobs]);

    if (homeFeedError && !homeFeedData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
                <div className="text-center space-y-6 max-w-md">
                    <div className="w-16 h-16 bg-status-error/10 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8 text-status-error" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-serif italic text-foreground tracking-tight">The Sanctuary is currently unreachable</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            We're having trouble connecting to our archives. This might be a temporary disturbance in the connection.
                        </p>
                    </div>
                    <Button 
                        variant="secondary" 
                        onClick={() => window.location.reload()}
                        className="rounded-full px-8"
                    >
                        Try to Reconnect
                    </Button>
                </div>
            </div>
        );
    }

    const hasGlobalData = homeFeedData && (
        (homeFeedData.rankings?.trendingManga?.length > 0) ||
        (homeFeedData.rankings?.trendingAnime?.length > 0) ||
        (homeFeedData.hero?.length > 0)
    );

    if (!homeFeedLoading && !homeFeedError && !hasGlobalData && !user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
                <EmptyState 
                    title="The Archives are Quiet"
                    description="We couldn't find any current trends or masterpieces. Please check back later."
                    action={
                        <Button variant="secondary" onClick={() => window.location.reload()} className="rounded-full px-8">
                            Refresh Archives
                        </Button>
                    }
                />
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="flex w-full flex-col items-center bg-background pb-[80px] selection:bg-muted-foreground selection:text-white relative">
            <HeroFeature data={homeFeedData?.hero || []} />

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className={cn(
                    "w-full max-w-[1400px] px-8 md:px-[64px] space-y-12 relative z-10",
                    homeFeedData?.hero?.length > 0 ? "mt-12" : "mt-32"
                )}
            >

                {/* Dashboard Section */}
                {user && (
                    <motion.div variants={itemVariants} className="space-y-8">
                        {/* Personalized Welcome Header */}
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-border/40 pb-6">
                            <div className="space-y-2 text-left">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <Coffee className="w-4 h-4 opacity-60" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Welcome back to your sanctuary</span>
                                </div>
                                <h2 className="text-3xl md:text-5xl font-serif italic text-foreground tracking-tight">
                                    Good day, {user.displayName?.split(' ')[0]}
                                </h2>
                            </div>
                            <div className="flex items-center gap-6 text-muted-foreground/60">
                                <div className="text-right">
                                    <p className="text-[9px] font-bold uppercase tracking-widest">Local Time</p>
                                    <p className="text-lg font-serif italic">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <Wind className="w-5 h-5 opacity-40 animate-pulse" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                            {/* Resume Reading Section */}
                            <div className="lg:col-span-9 space-y-8">
                                <div className="flex items-end justify-between border-b border-border/40 pb-4">
                                    <div className="space-y-1 text-left">
                                        <h2 className="text-2xl font-serif italic text-foreground flex items-center gap-3">
                                            Continuing the Journey
                                        </h2>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground">Your current reflections</p>
                                    </div>
                                    <Link to="/library?filter=READING" className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                                        View Full Diary <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>

                                <div className="relative group/scroll">
                                    {libraryLoading ? (
                                        <div className="flex gap-6 overflow-hidden">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className="min-w-[160px] md:min-w-[200px]">
                                                    <MediaCardSkeleton />
                                                </div>
                                            ))}
                                        </div>
                                    ) : continueReading.length > 0 ? (
                                        <>
                                            <AnimatePresence>
                                                {showLeftArrow && (
                                                    <motion.button 
                                                        initial={{ opacity: 0, x: 10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        onClick={() => scroll('left')}
                                                        className="absolute left-[-20px] top-[40%] -translate-y-1/2 z-30 w-11 h-11 bg-background/90 backdrop-blur-md border border-border/40 rounded-full flex items-center justify-center shadow-diffuse text-foreground hover:bg-foreground hover:text-background transition-all active:scale-90"
                                                        aria-label="Scroll left"
                                                    >
                                                        <ChevronLeft size={20} />
                                                    </motion.button>
                                                )}
                                            </AnimatePresence>
                                            
                                            <AnimatePresence>
                                                {showRightArrow && (
                                                    <motion.button 
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -10 }}
                                                        onClick={() => scroll('right')}
                                                        className="absolute right-[-20px] top-[40%] -translate-y-1/2 z-30 w-11 h-11 bg-background/90 backdrop-blur-md border border-border/40 rounded-full flex items-center justify-center shadow-diffuse text-foreground hover:bg-foreground hover:text-background transition-all active:scale-90"
                                                        aria-label="Scroll right"
                                                    >
                                                        <ChevronRight size={20} />
                                                    </motion.button>
                                                )}
                                            </AnimatePresence>

                                            <div 
                                                ref={scrollRef}
                                                onScroll={checkScroll}
                                                className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide scroll-smooth" 
                                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                            >
                                                {continueReading.map((item, index) => (
                                                    <div key={item.id} className="shrink-0 w-[160px] md:w-[200px] snap-start">
                                                        <MediaCard
                                                            id={item.id}
	                                                            index={index}
	                                                            title={toTitle(item.title)}
	                                                            coverUrl={item.coverUrl}
	                                                            mediaType={item.mediaType === 'ANIME' ? 'ANIME' : 'MANGA'}
	                                                            status={item.status}
	                                                            progress={item.progress}
	                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <Surface variant="paper" className="p-16 text-center space-y-6 border-dashed border-2">
                                            <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto">
                                                <BookOpen className="w-8 h-8 text-muted-foreground opacity-20" />
                                            </div>
                                            <p className="text-base text-muted-foreground font-serif italic max-w-sm mx-auto">Your veranda is quiet. Start exploring to populate your archive.</p>
                                            <Button 
                                                as={Link} 
                                                to="/discover" 
                                                variant="primary"
                                                className="px-12"
                                            >
                                                Explore the Library
                                            </Button>
                                        </Surface>
                                    )}
                                </div>
                            </div>

                            {/* Sidebar: Echoes & Integrity */}
                            <div className="lg:col-span-3 space-y-12">
                                <SanctuarySchedule />
                                
                                {/* Echoes (Notifications) */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between border-b border-border/40 pb-3">
                                        <div className="space-y-1 text-left">
                                            <h3 className="text-lg font-serif italic text-foreground">
                                                Echoes
                                            </h3>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">From the collection</p>
                                        </div>
                                        <Link to="/notifications" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">View All</Link>
                                    </div>
                                    <div className="space-y-3">
                                        {releaseAlerts.length > 0 ? (
                                            releaseAlerts.map((alert) => (
                                                <motion.div 
                                                    key={alert.id}
                                                    whileHover={{ x: 4 }}
                                                    className="group"
                                                >
                                                    <Surface variant="paper" withPadding={false} className="flex gap-3 p-4 hover:shadow-md transition-all text-left">
                                                        <div className="w-8 h-8 rounded-lg bg-muted/20 flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                                                            <Bell className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
                                                        </div>
                                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                            <p className="text-xs font-bold text-foreground line-clamp-1">{alert.title}</p>
                                                            <p className="text-[9px] text-muted-foreground mt-0.5 font-medium">{alert.message || 'New update available'}</p>
                                                        </div>
                                                    </Surface>
                                                </motion.div>
                                            ))
                                        ) : (
                                            <Surface variant="muted" className="p-8 text-center border-dashed border-2">
                                                <Moon className="w-5 h-5 text-muted-foreground opacity-20 mx-auto mb-2" />
                                                <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] font-bold">The veranda is peaceful</p>
                                            </Surface>
                                        )}
                                    </div>
                                </div>

                                {/* Archive Integrity */}
                                {maintenanceJobs.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="space-y-1 text-left">
                                            <h3 className="text-base font-serif italic text-foreground flex items-center gap-3">
                                                Archive Integrity
                                            </h3>
                                            <p className="text-[9px] font-bold uppercase tracking-widest text-primary">Attention Required</p>
                                        </div>
                                        <div className="space-y-3">
                                            {maintenanceJobs.map((job) => (
                                                <Surface key={job.id} variant="paper" className="p-5 border-primary/20 space-y-3 shadow-sm text-left">
                                                    <div className="flex items-center gap-2 text-primary">
                                                        <AlertCircle className="w-3.5 h-3.5" />
                                                        <p className="text-[9px] font-bold uppercase tracking-wide">Sync Anomaly</p>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground leading-relaxed italic font-serif">Restore synchronization.</p>
                                                    <Button 
                                                        as={Link} 
                                                        to="/settings" 
                                                        variant="warm"
                                                        size="sm"
                                                        className="w-full"
                                                    >
                                                        Restore Balance
                                                    </Button>
                                                </Surface>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Analytics Snapshot */}
                {user && (
                    <motion.div variants={itemVariants}>
                        <Surface variant="paper" withPadding={false} className="p-6 md:p-10 text-foreground relative overflow-hidden group flex flex-col md:flex-row items-center justify-between gap-6 w-full">
                            <Sparkles className="absolute -bottom-6 -right-4 w-32 h-32 text-muted-foreground opacity-5 group-hover:scale-110 transition-transform duration-1000 pointer-events-none" />

                            <div className="space-y-1 relative z-10 flex-shrink-0 text-center md:text-left">
                                <h3 className="text-[9px] font-bold uppercase tracking-[0.4em] text-muted-foreground">Sanctuary Snapshot</h3>
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-1 w-1">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40"></span>
                                        <span className="relative inline-flex rounded-full h-1 w-1 bg-primary"></span>
                                    </span>
                                    <p className="text-xl md:text-3xl font-serif italic tracking-tight text-foreground">
                                        {libraryLoading ? 'Gathering Memories...' : 'Your Archive Summary'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end flex-wrap gap-8 md:gap-12 relative z-10 w-full md:w-auto">
                                <div className="space-y-1 text-center">
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">Total Artifacts</p>
                                    <p className="text-2xl font-serif italic leading-none">{libraryLoading ? '...' : library.length}</p>
                                </div>
                                <div className="space-y-1 text-center border-l border-border/40 pl-8 md:pl-12">
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">Active Journeys</p>
                                    <p className="text-2xl font-serif italic leading-none text-muted-foreground">{libraryLoading ? '...' : continueReading.length}</p>
                                </div>
                                <div className="border-l border-border/40 pl-8 md:pl-12">
                                    <Link to="/stats" className="inline-flex items-center gap-3 group/link">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">Full Analytics</span>
                                        <motion.div 
                                            whileHover={{ x: 4 }}
                                            className="w-8 h-8 rounded-full border border-border flex items-center justify-center group-hover/link:bg-primary group-hover/link:text-white group-hover/link:border-primary transition-all"
                                        >
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </motion.div>
                                    </Link>
                                </div>
                            </div>
                        </Surface>
                    </motion.div>
                )}

                {/* Global Discovery Sections */}
                <motion.div variants={itemVariants} className="space-y-12 pt-10 border-t border-border/40">
                    <div className="space-y-3 text-center">
                        <h2 className="text-4xl md:text-5xl font-serif italic text-foreground tracking-tight">Global Discoveries</h2>
                        <p className="text-[10px] font-bold uppercase tracking-[0.6em] text-muted-foreground ml-2">Exploring the collective consciousness</p>
                    </div>

                    <div className="space-y-10">
                        <div className="space-y-2 border-b border-border/40 pb-4 text-left">
                            <h3 className="text-2xl font-serif italic text-foreground">On the Paper Shelf</h3>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Manga & Novels</p>
                        </div>
                        <DiscoverCarousel
                            title="Trending Reflections"
                            mangaList={homeFeedData?.rankings?.trendingManga || []}
                            loading={homeFeedLoading}
                            onViewAll={() => navigate('/discover?sort=TRENDING_DESC&type=MANGA')}
                        />
                        <DiscoverCarousel
                            title="Masterpieces"
                            mangaList={homeFeedData?.rankings?.topScoredManga || []}
                            loading={homeFeedLoading}
                            onViewAll={() => navigate('/discover?sort=SCORE_DESC&type=MANGA')}
                        />
                    </div>

                    <div className="space-y-10">
                        <div className="space-y-2 border-b border-border/40 pb-4 text-left">
                            <h3 className="text-2xl font-serif italic text-foreground">In the Projection Room</h3>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Anime Experiences</p>
                        </div>
                        <DiscoverCarousel
                            title="Currently Airing"
                            mangaList={homeFeedData?.rankings?.trendingAnime || []}
                            loading={homeFeedLoading}
                            onViewAll={() => navigate('/discover?sort=TRENDING_DESC&type=ANIME')}
                        />
                        <DiscoverCarousel
                            title="Cinematic Legends"
                            mangaList={homeFeedData?.rankings?.topScoredAnime || []}
                            loading={homeFeedLoading}
                            onViewAll={() => navigate('/discover?sort=SCORE_DESC&type=ANIME')}
                        />
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
