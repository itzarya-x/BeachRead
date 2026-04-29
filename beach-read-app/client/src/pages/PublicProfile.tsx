import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen,    Calendar,
    Share2,
    MapPin,
    Globe,
    User as UserIcon,
    Heart,
    Clock3,
    Settings,
    UserPlus,
    MessageSquare,
    Search,
    Play,
    Book,
    Coffee,
    Wind,
    Moon,
    Edit3,
    Layers,
    ArrowUpRight
} from 'lucide-react';
import { fetchPublicProfile, syncPublicProfileSnapshot, type PublicProfileRecord } from '../features/profile/api/publicProfile';
import { handleCoverImageError, sanitizeCoverUrl } from '../shared/utils/image';
import { useAuth } from '../features/auth/context/auth-context';
import { useLibraryQuery, useLibraryStats } from '../features/library/hooks/useLibraryQuery';
import { useLibrary } from '../features/library/hooks/useLibrary';
import { ProfileSkeleton } from '../shared/ui/PageSkeletons';
import type { SectionId, UserStats } from '../shared/types/types';
import { Surface } from '../shared/ui/Surface';
import { Button } from '../shared/ui/Button';

// Management Components
import Analytics from './MyJourney';
import Notifications from './Notifications';
import Collections from './Collections';
import BulkManagement from '../features/library/components/BulkManagement';
import {
    DEFAULT_PROFILE_PRIVACY,
    resolveSectionsConfig,
    resolvePrivacyConfig,
    formatStatus,
    formatTime,
    type ProfileTab
} from '../features/profile/utils/profileUtils';

type MediaFilter = 'ALL' | 'ANIME' | 'MANGA' | 'NOVEL';

export default function PublicProfile() {
    const { username = '' } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user: authUser } = useAuth();
    const { toggleFavourite } = useLibrary();
    const [profile, setProfile] = useState<PublicProfileRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
    const [mediaFilter, setMediaFilter] = useState<MediaFilter>('ALL');
    const [isBulkManaging, setIsBulkManaging] = useState(false);

    // Handle tab from URL
    useEffect(() => {
        const tab = searchParams.get('tab') as ProfileTab;
        if (tab && ['overview', 'anime', 'manga', 'favorites', 'stats', 'social', 'reviews', 'notifications'].includes(tab)) {
            setActiveTab(tab);
            if (tab === 'anime') setMediaFilter('ANIME');
            else if (tab === 'manga') setMediaFilter('MANGA');
        }
    }, [searchParams]);

    const handleTabChange = (tab: ProfileTab) => {
        setActiveTab(tab);
        setSearchParams({ tab }, { replace: true });
        if (tab === 'anime') setMediaFilter('ANIME');
        else if (tab === 'manga') setMediaFilter('MANGA');
        else if (tab === 'overview' || tab === 'favorites') setMediaFilter('ALL');
    };

    const isOwner = authUser && profile && authUser.id === profile.user_id;

    // Trigger sync if owner visits their own profile to ensure snapshot is fresh
    const ownerStats = useLibraryStats();
    const { data: library = [] } = useLibraryQuery();
    
    useEffect(() => {
        if (isOwner && authUser && ownerStats && library.length > 0) {
            void syncPublicProfileSnapshot({
                user: authUser,
                stats: ownerStats,
                library
            });
        }
    }, [isOwner, authUser, ownerStats, library]);

    const loadProfile = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchPublicProfile(username);
            setProfile(data);
        } catch (err) {
            console.error('Failed to open the diary:', err);
        } finally {
            setLoading(false);
        }
    }, [username]);

    const handleShareProfile = async () => {
        if (!profile) return;
        const shareUrl = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `${profile.display_name}'s Sanctuary`,
                    text: `Step into ${profile.display_name}'s personal reading diary.`,
                    url: shareUrl,
                });
                return;
            }
            await navigator.clipboard.writeText(shareUrl);
        } catch (error) {
            console.error('Failed to share profile:', error);
        }
    };

    const handleSearchMedia = (title: string, type: string) => {
        const query = type === 'ANIME' ? `${title} watch online` : `${title} read online`;
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    };

    useEffect(() => {
        void loadProfile();
    }, [loadProfile]);

    const safeProfile = profile;
    const safeRecentLibrary = useMemo(() => safeProfile?.recent_library || [], [safeProfile]);
    const safePrivacy = useMemo(() => safeProfile ? resolvePrivacyConfig(safeProfile) : DEFAULT_PROFILE_PRIVACY, [safeProfile]);

    const filteredRecentLibrary = useMemo(() => {
        const blockedStatuses = safePrivacy.showDroppedPaused ? [] : ['DROPPED', 'PAUSED'];
        let list = safeRecentLibrary.filter((item) => !blockedStatuses.includes(item.status));
        
        if (mediaFilter !== 'ALL') {
            list = list.filter(item => item.mediaType === mediaFilter);
        }
        
        return list;
    }, [safeRecentLibrary, safePrivacy.showDroppedPaused, mediaFilter]);

    const favoriteMedia = useMemo(() => {
        // Use safeRecentLibrary directly to avoid being affected by the archive filter
        const favs = safeRecentLibrary.filter((item) => {
            // Support both camelCase and snake_case from different API versions/sources
            return !!(item.isFavourite || (item as any).isFavorite || (item as any).is_favourite || (item as any).is_favorite);
        });
        if (!profile) return favs;

        const order = profile.favorite_manga_order || [];
        if (order.length === 0) return favs;

        const orderMap = new Map(order.map((id, index) => [id, index]));
        return [...favs].sort((a, b) => {
            const indexA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999;
            const indexB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999;
            return indexA - indexB;
        });
    }, [safeRecentLibrary, profile]);

    const favoriteAnime = useMemo(() => {
        return favoriteMedia.filter(m => {
            const type = (m.mediaType || '').toUpperCase();
            return type === 'ANIME';
        });
    }, [favoriteMedia]);

    const favoriteManga = useMemo(() => {
        return favoriteMedia.filter(m => {
            const type = (m.mediaType || '').toUpperCase();
            // Default to manga section if type is missing or NOVEL/MANGA
            return type !== 'ANIME';
        });
    }, [favoriteMedia]);

    const favoriteCharacters = useMemo(() => {
        return profile?.favorite_characters || [];
    }, [profile]);

    const profileStats = useMemo<UserStats | undefined>(() => {
        if (!profile) return undefined;
        
        const total = profile.total_entries || 0;
        const completed = profile.completed_entries || 0;
        const reading = profile.reading_entries || 0;
        const planning = Math.max(0, total - completed - reading);
        
        const hoardingRatio = Number((planning / (completed || 1)).toFixed(2));
        
        return {
            completed,
            reading,
            planning,
            dropped: 0,
            paused: 0,
            meanScore: profile.mean_score || 0,
            totalUnits: profile.total_chapters || 0,
            totalChaptersRead: profile.manga_stats?.totalUnits || profile.total_chapters || 0,
            totalEpisodesWatched: profile.anime_stats?.totalUnits || 0,
            genreStats: (profile.genre_stats || []).map(g => ({ 
                name: g.name, 
                count: g.count, 
                percentage: (g.count / (total || 1)) * 100 
            })),
            scoreDistribution: profile.manga_stats?.scoreDistribution || [], 
            profileType: completed > 50 ? 'COMPLETIONIST' : 'STRATEGIST',
            readingVelocity: [], // Recent library doesn't give enough history for a full sparkline easily here
            animeStats: profile.anime_stats,
            mangaStats: profile.manga_stats,
            favorites: profile.favorites_count || favoriteMedia.length,
            hoardingRatio,
            formatStats: {
                manga: profile.manga_stats?.count || 0,
                anime: profile.anime_stats?.count || 0,
                novel: 0,
                oneShot: 0
            },
            archiveMaturity: 'Long-term', // Placeholder until we have a better way to calculate from profile dates
            highestRatedGenre: { name: 'N/A', score: 0 }
        };
    }, [profile, favoriteMedia.length]);

    const activeStats = isOwner ? ownerStats : profileStats;


    if (loading) {
        return <ProfileSkeleton />;
    }

    if (!profile) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 pt-[64px] text-center">
                <Coffee className="w-16 h-16 text-muted-foreground mb-6 opacity-40" />
                <h1 className="text-2xl font-serif italic text-foreground">Sanctuary Missing</h1>
                <p className="mt-4 max-w-md text-sm text-muted-foreground/80">This personal diary has not been found in our records.</p>
                <Link
                    to="/"
                    className="mt-8 px-8 py-3 rounded-full bg-foreground text-background text-xs font-bold uppercase tracking-widest transition-all hover:bg-muted-foreground"
                >
                    Return Home
                </Link>
            </div>
        );
    }

    const joinedDate = profile.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : 'Unknown';

    const sectionsConfig = resolveSectionsConfig(profile);
    const privacy = safePrivacy;

    const renderSection = (section: SectionId) => {
        if (!sectionsConfig.visible[section]) return null;

        if (section === 'now_reading') {
            const nowReading = profile.now_reading;
            if (!nowReading) return null;
            return (
                <motion.section 
                    key={section} 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="space-y-6"
                >
                    <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Current Reflection</h2>
                    </div>
                    <Surface variant="paper" className="grid gap-8 lg:grid-cols-[240px_1fr] p-8 shadow-sm">
                        <motion.div 
                            whileHover={{ y: -4 }}
                            className="relative group aspect-[2/3] overflow-hidden rounded-3xl shadow-2xl"
                        >
                            <img src={sanitizeCoverUrl(nowReading.coverUrl)} onError={handleCoverImageError} alt={nowReading.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                    onClick={() => handleSearchMedia(nowReading.title, 'MANGA')}
                                    className="p-4 bg-white/90 backdrop-blur-md rounded-full text-primary shadow-xl hover:scale-110 transition-all"
                                    aria-label="Search current title"
                                >
                                    <Search size={24} />
                                </button>
                            </div>
                        </motion.div>
                        <div className="flex flex-col justify-center space-y-6">
                            <div>
                                <h3 className="text-4xl font-serif italic text-foreground leading-tight">{nowReading.title}</h3>
                                <div className="mt-4 flex flex-wrap gap-3">
                                    {privacy.showProgress && (
                                        <span className="px-4 py-1.5 bg-muted/30 text-muted-foreground text-[10px] font-bold uppercase tracking-wider rounded-full border border-border/40">
                                            Chapter {nowReading.progress}{nowReading.chapters ? ` / ${nowReading.chapters}` : ''}
                                        </span>
                                    )}
                                    <Button 
                                        onClick={() => handleSearchMedia(nowReading.title, 'MANGA')}
                                        variant="primary"
                                        size="sm"
                                    >
                                        <Book size={14} className="mr-2" /> Read Now
                                    </Button>
                                </div>
                            </div>
                            {nowReading.publicNote ? (
                                <div className="relative p-6 bg-muted/10 rounded-3xl text-lg italic text-muted-foreground leading-relaxed border-l-4 border-primary/40">
                                    <span className="absolute -top-4 -left-2 text-6xl text-primary/10 font-serif">"</span>
                                    {nowReading.publicNote}
                                </div>
                            ) : null}
                        </div>
                    </Surface>
                </motion.section>
            );
        }

        if (section === 'featured_collections') {
            const featured = profile.featured_collections || [];
            if (!featured.length) return null;

            return (
                <section key={section} className="space-y-10">
                    <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                        <Layers className="h-4 w-4 text-primary" />
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Curated Collections</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featured.map((col, idx) => (
                            <motion.div
                                key={col.name}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.05 }}
                            >
                                <Surface variant="paper" className="p-6 h-full flex flex-col gap-6 group hover:shadow-xl transition-all duration-500">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-serif italic text-foreground group-hover:text-primary transition-colors">{col.name}</h3>
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{col.count} Archives</p>
                                        </div>
                                        <Link 
                                            to={`/library?filter=${encodeURIComponent(col.name)}`}
                                            className="p-2 rounded-full bg-muted/10 text-muted-foreground hover:bg-primary hover:text-white transition-all"
                                        >
                                            <ArrowUpRight size={14} />
                                        </Link>
                                    </div>
                                    <div className="flex -space-x-4 mt-auto">
                                        {col.covers.map((cover, cIdx) => (
                                            <div 
                                                key={cIdx} 
                                                className="w-12 h-16 rounded-lg overflow-hidden border-2 border-background shadow-lg rotate-[-5deg] group-hover:rotate-0 transition-transform duration-500"
                                                style={{ zIndex: 10 - cIdx }}
                                            >
                                                <img src={sanitizeCoverUrl(cover)} onError={handleCoverImageError} className="w-full h-full object-cover" alt="" />
                                            </div>
                                        ))}
                                    </div>
                                </Surface>
                            </motion.div>
                        ))}
                    </div>
                </section>
            );
        }

        if (section === 'favorites') {
            return (
                <section key={section} className="space-y-16">
                    {/* Favorite Anime */}
                    {favoriteAnime.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-border/40 pb-4">
                                <div className="flex items-center gap-3">
                                    <Heart className="h-4 w-4 text-primary" />
                                    <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Favorite Anime</h2>
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">{favoriteAnime.length} Titles</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {favoriteAnime.map((item, idx) => (
                                    <motion.div 
                                        key={item.id} 
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group flex flex-col gap-3"
                                    >
                                        <motion.div 
                                            whileHover={{ y: -4 }}
                                            className="relative aspect-[2/3] overflow-hidden rounded-2xl shadow-md transition-all duration-500 group-hover:shadow-xl"
                                        >
                                            <img
                                                src={sanitizeCoverUrl(item.coverUrl)}
                                                onError={handleCoverImageError}
                                                className="h-full w-full object-cover"
                                                alt={item.title}
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => handleSearchMedia(item.title, item.mediaType)}
                                                    className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                                                    aria-label={`View ${item.title}`}
                                                >
                                                    <Play size={18} fill="currentColor" />
                                                </button>
                                                {isOwner && (
                                                    <button 
                                                        onClick={() => toggleFavourite(item.id)}
                                                        className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                                                        aria-label="Remove from cherished"
                                                    >
                                                        <Heart size={18} fill="currentColor" />
                                                    </button>
                                                )}
                                                <Link to={`/manga/${item.id}`} className="text-[9px] font-bold uppercase tracking-widest text-white hover:underline">View Detail</Link>
                                            </div>
                                        </motion.div>
                                        <p className="text-[11px] font-bold text-foreground uppercase tracking-tight line-clamp-1 group-hover:text-primary transition-colors">{item.title}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Favorite Manga */}
                    {favoriteManga.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-border/40 pb-4">
                                <div className="flex items-center gap-3">
                                    <Book className="h-4 w-4 text-primary" />
                                    <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Favorite Manga</h2>
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">{favoriteManga.length} Titles</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {favoriteManga.map((item, idx) => (
                                    <motion.div 
                                        key={item.id} 
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group flex flex-col gap-3"
                                    >
                                        <motion.div 
                                            whileHover={{ y: -4 }}
                                            className="relative aspect-[2/3] overflow-hidden rounded-2xl shadow-md transition-all duration-500 group-hover:shadow-xl"
                                        >
                                            <img
                                                src={sanitizeCoverUrl(item.coverUrl)}
                                                onError={handleCoverImageError}
                                                className="h-full w-full object-cover"
                                                alt={item.title}
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => handleSearchMedia(item.title, item.mediaType)}
                                                    className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                                                    aria-label={`View ${item.title}`}
                                                >
                                                    <Book size={18} />
                                                </button>
                                                {isOwner && (
                                                    <button 
                                                        onClick={() => toggleFavourite(item.id)}
                                                        className="w-10 h-10 rounded-full bg-white text-primary flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                                                        aria-label="Remove from cherished"
                                                    >
                                                        <Heart size={18} fill="currentColor" />
                                                    </button>
                                                )}
                                                <Link to={`/manga/${item.id}`} className="text-[9px] font-bold uppercase tracking-widest text-white hover:underline">View Detail</Link>
                                            </div>
                                        </motion.div>
                                        <p className="text-[11px] font-bold text-foreground uppercase tracking-tight line-clamp-1 group-hover:text-primary transition-colors">{item.title}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {favoriteMedia.length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/10">
                            <p className="text-sm text-muted-foreground italic opacity-60 font-serif">The gallery is currently empty.</p>
                        </div>
                    )}

                    {/* Favorite Characters */}
                    {favoriteCharacters.length > 0 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-border/40 pb-4">
                                <div className="flex items-center gap-3">
                                    <UserIcon className="h-4 w-4 text-primary" />
                                    <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Beloved Figures</h2>
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">{favoriteCharacters.length} Characters</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {favoriteCharacters.map((char, idx) => (
                                    <motion.div 
                                        key={char.id} 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group flex flex-col items-center gap-3 text-center"
                                    >
                                        <motion.div
                                            whileHover={{ y: -4, scale: 1.02 }}
                                            className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-md transition-all duration-500 group-hover:shadow-xl ring-2 ring-border/40 ring-offset-4 ring-offset-background"
                                        >
                                            <Link to={`/character/${char.id}`}>
                                                <img
                                                    src={char.image}
                                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    alt={char.name}
                                                />
                                            </Link>
                                        </motion.div>
                                        <Link to={`/character/${char.id}`}>
                                            <p className="text-[10px] font-bold text-foreground uppercase tracking-widest line-clamp-1 group-hover:text-primary transition-colors">{char.name}</p>
                                        </Link>                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            );
        }

        if (section === 'archive') {
            return (
                <section key={section} className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border/40 pb-4">
                        <div className="flex items-center gap-3">
                            <Layers className="h-4 w-4 text-primary" />
                            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">The Archive</h2>
                        </div>
                        {isOwner && (
                            <button 
                                onClick={() => setIsBulkManaging(true)}
                                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                                aria-label="Bulk manage archive"
                            >
                                <Edit3 size={14} /> Bulk Manage
                            </button>
                        )}
                    </div>
                    
                    {/* Media Filter Pills */}
                    <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
                        {(['ALL', 'ANIME', 'MANGA', 'NOVEL'] as MediaFilter[]).map(f => (
                            <button
                                key={f}
                                onClick={() => setMediaFilter(f)}
                                aria-label={`Filter by ${f.toLowerCase()}`}
                                aria-pressed={mediaFilter === f}
                                className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    mediaFilter === f 
                                    ? 'bg-foreground text-background shadow-md' 
                                    : 'bg-background border border-border/40 text-muted-foreground hover:bg-muted/10'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {filteredRecentLibrary.length ? (
                        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                            {filteredRecentLibrary.map((item, idx) => (
                                <motion.div 
                                    key={item.id} 
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.03 }}
                                >
                                    <Surface 
                                        variant="paper" 
                                        whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                        className="group flex gap-4 p-4 transition-all duration-300"
                                    >
                                        <div className="h-24 w-16 shrink-0 overflow-hidden rounded-xl shadow-sm">
                                            <img src={sanitizeCoverUrl(item.coverUrl)} onError={handleCoverImageError} alt={item.title} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                        </div>
                                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary">{formatStatus(item.status)}</span>
                                                <span className="w-1 h-1 rounded-full bg-border/40" />
                                                <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60">{item.mediaType}</span>
                                            </div>
                                            <h3 className="line-clamp-1 text-sm font-bold uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                                            <div className="mt-2 flex items-center justify-between">
                                                <div className="flex gap-3">
                                                    {privacy.showProgress ? (
                                                        <span className="text-[9px] font-bold text-muted-foreground/80 uppercase tracking-widest">
                                                            {item.mediaType === 'ANIME' ? `Ep. ${item.progress}` : `Ch. ${item.progress}`}
                                                        </span>
                                                    ) : null}
                                                    {privacy.showScores && typeof item.score === 'number' && item.score > 0 ? (
                                                        <span className="text-[9px] font-bold text-primary uppercase tracking-widest">★ {item.score}</span>
                                                    ) : null}
                                                </div>
                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={() => handleSearchMedia(item.title, item.mediaType)}
                                                        className="p-1.5 rounded-full text-muted-foreground hover:bg-muted/20 transition-colors"
                                                        title={item.mediaType === 'ANIME' ? 'Watch' : 'Read'}
                                                        aria-label={item.mediaType === 'ANIME' ? 'Watch online' : 'Read online'}
                                                    >
                                                        {item.mediaType === 'ANIME' ? <Play size={14} fill="currentColor" /> : <BookOpen size={14} />}
                                                    </button>
                                                    {isOwner && (
                                                        <button 
                                                            onClick={() => toggleFavourite(item.id)}
                                                            className={`p-1.5 rounded-full transition-colors ${item.isFavourite ? 'text-primary' : 'text-muted-foreground hover:bg-muted/20'}`}
                                                            title={item.isFavourite ? 'Remove from favorites' : 'Add to favorites'}
                                                            aria-label="Toggle favorite"
                                                        >
                                                            <Heart size={14} fill={item.isFavourite ? "currentColor" : "none"} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Surface>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/10">
                            <p className="text-sm text-muted-foreground italic opacity-60 font-serif">No memories matched your filter.</p>
                        </div>
                    )}
                </section>
            );
        }

        if (section === 'changelog') {
            const changelog = profile.public_changelog || [];
            if (!changelog.length) return null;
            return (
                <section key={section} className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                        <Clock3 className="h-4 w-4 text-primary" />
                        <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Personal Timeline</h2>
                    </div>
                    <div className="space-y-4">
                        {changelog.map((entry, idx) => (
                            <motion.div 
                                key={entry.id} 
                                initial={{ opacity: 0, x: -10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.03 }}
                            >
                                <Surface 
                                    variant="paper" 
                                    whileHover={{ x: 6 }}
                                    className="flex gap-6 p-6 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-muted/20 group-hover:bg-primary transition-colors">
                                        <Edit3 className="w-5 h-5 text-primary group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <div>
                                                <h4 className="text-[9px] font-bold uppercase tracking-widest mb-1 text-primary/80">{formatStatus(entry.status)}</h4>
                                                <h3 className="text-lg font-serif italic text-foreground">{entry.title}</h3>
                                            </div>
                                            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                                                {formatTime(entry.updatedAt)}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
                                            {privacy.showProgress ? `Progressed to ${entry.progress}` : 'Update logged.'}
                                        </p>
                                    </div>
                                </Surface>
                            </motion.div>
                        ))}
                    </div>
                </section>
            );
        }

        return null;
    };

    return (
        <div className="min-h-screen bg-background selection:bg-muted-foreground selection:text-white relative pt-20">
            {/* Global Texture Overlay */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }}
            />

            {isBulkManaging && profile && (
                <BulkManagement 
                    userId={profile.user_id}
                    items={profile.recent_library}
                    onClose={() => setIsBulkManaging(false)}
                    onComplete={() => void loadProfile()}
                />
            )}
            
            {/* Journal Header */}
            <div className="relative w-full z-10">
                {/* Banner */}
                <div
                    className="h-[250px] md:h-[350px] w-full bg-muted/20 relative overflow-hidden"
                    style={{
                        backgroundImage: profile.banner_url ? `url(${sanitizeCoverUrl(profile.banner_url)})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-0" />

                    {/* Aesthetic Floating Elements */}
                    <div className="absolute top-12 left-12 z-20 hidden lg:block">
                        <div className="flex items-center gap-4 text-foreground">
                            <Wind className="w-5 h-5 opacity-40 animate-pulse" />
                            <span className="text-[10px] font-serif italic tracking-[0.2em] opacity-60">Quiet Moments</span>
                        </div>
                    </div>
                    <div className="absolute top-12 right-12 z-20 hidden lg:block">
                        <div className="flex items-center gap-4 text-foreground">
                            <span className="text-[10px] font-serif italic tracking-[0.2em] opacity-60">Est. {joinedDate}</span>
                            <Moon className="w-5 h-5 opacity-40" />
                        </div>
                    </div>
                </div>

                {/* Profile Info Row */}
                <div className="relative -mt-32 z-40 mx-auto max-w-[1200px] px-6">
                    <div className="flex flex-col items-center text-center">
                        {/* Avatar */}
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                            className="relative group mb-8"
                        >
                            <div className="w-32 h-32 md:w-44 md:h-44 rounded-full bg-white p-2 shadow-2xl overflow-hidden ring-4 ring-border/20">
                                {profile.avatar_url ? (
                                    <img 
                                        src={sanitizeCoverUrl(profile.avatar_url)} 
                                        alt={profile.display_name} 
                                        referrerPolicy="no-referrer"
                                        className="h-full w-full object-cover rounded-full transition-transform duration-700 group-hover:scale-105" 
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-full">
                                        <UserIcon className="w-16 h-16 text-muted-foreground/30" />
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Name & Bio */}
                        <div className="max-w-2xl space-y-4">
                            <motion.h1 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-4xl md:text-6xl font-serif italic text-foreground leading-none"
                            >
                                {profile.display_name}
                            </motion.h1>
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.5em] flex items-center justify-center gap-4"
                            >
                                <span className="w-8 h-[1px] bg-border/40" />
                                Curator of Memories
                                <span className="w-8 h-[1px] bg-border/40" />
                            </motion.p>
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="pt-4 flex items-center justify-center gap-6"
                            >
                                <Button
                                    onClick={handleShareProfile}
                                    variant="outline"
                                    size="icon"
                                    aria-label="Share profile"
                                    className="rounded-full shadow-sm"
                                >
                                    <Share2 size={18} />
                                </Button>
                                {isOwner ? (
                                    <Button
                                        as={Link}
                                        to="/settings"
                                        variant="primary"
                                        className="px-8 py-3 rounded-full shadow-lg flex items-center gap-2"
                                    >
                                        <Settings size={14} /> Customize Diary
                                    </Button>
                                ) : (
                                    <Button variant="archival" className="px-8 py-3 rounded-full shadow-lg flex items-center gap-2">
                                        <UserPlus size={14} /> Follow Journey
                                    </Button>
                                )}
                                <Button 
                                    variant="outline"
                                    size="icon"
                                    aria-label="Send message"
                                    className="rounded-full shadow-sm"
                                >
                                    <MessageSquare size={18} />
                                </Button>
                            </motion.div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex justify-center mt-16 border-b border-border/40">
                        <div className="flex gap-4 md:gap-12 overflow-x-auto no-scrollbar">
                            {(['overview', 'anime', 'manga', 'favorites', 'stats', 'notifications'] as const)
                                .filter(tab => tab !== 'notifications' || isOwner)
                                .map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => handleTabChange(tab)}
                                        className={`px-4 py-6 text-[11px] font-bold uppercase tracking-[0.3em] whitespace-nowrap transition-all relative ${activeTab === tab
                                            ? 'text-foreground'
                                            : 'text-muted-foreground/50 hover:text-muted-foreground'
                                            }`}
                                    >
                                        {tab}
                                        {activeTab === tab && (
                                            <motion.div 
                                                layoutId="activeTab"
                                                className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full" 
                                            />
                                        )}
                                    </button>
                                ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="mx-auto max-w-[1200px] px-6 py-16 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Sidebar */}
                    {(activeTab === 'overview' || activeTab === 'stats') && (
                        <aside className="lg:col-span-3 space-y-12 order-2 lg:order-1">
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                                className="space-y-4"
                            >
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Preface</h3>
                                <p className="text-sm leading-relaxed text-muted-foreground italic font-serif">
                                    {profile.bio || "No words have been written yet..."}
                                </p>
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="space-y-6 pt-8 border-t border-border/40"
                            >
                                <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                    <Calendar className="h-4 w-4" /> Joined {joinedDate}
                                </div>
                                {profile.location && (
                                    <div className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                        <MapPin className="h-4 w-4" /> {profile.location}
                                    </div>
                                )}
                                {profile.website && (
                                    <a href={profile.website} target="_blank" className="flex items-center gap-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground">
                                        <Globe className="h-4 w-4" /> Visit External
                                    </a>
                                )}
                            </motion.div>

                            {/* Stat Highlights */}
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <Surface variant="paper" className="p-8 space-y-8">
                                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground text-center">Volume Data</h3>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="text-center">
                                            <p className="text-[9px] font-bold uppercase text-muted-foreground/60 mb-1">Items</p>
                                            <p className="text-2xl font-serif italic text-foreground">{profile.total_entries}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[9px] font-bold uppercase text-muted-foreground/60 mb-1">Chapters</p>
                                            <p className="text-2xl font-serif italic text-foreground">{profile.total_chapters}</p>
                                        </div>
                                        <div className="col-span-2 text-center pt-4 border-t border-border/40">
                                            <p className="text-[9px] font-bold uppercase text-muted-foreground/60 mb-1">Average Score</p>
                                            <p className="text-3xl font-serif italic text-primary">{profile.mean_score}</p>
                                        </div>
                                    </div>
                                </Surface>
                            </motion.div>
                        </aside>
                    )}

                    {/* Main Content */}
                    <main className={`${(activeTab === 'overview' || activeTab === 'stats') ? 'lg:col-span-9' : 'lg:col-span-12'} space-y-16 order-1 lg:order-2`}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.4 }}
                            >
                                {activeTab === 'overview' && (
                                    <div className="space-y-20">
                                        {/* Snapshot Section */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Anime Snapshot */}
                                            {profile.anime_stats && (
                                                <Surface variant="paper" className="p-8 space-y-6 group">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Play className="w-5 h-5 text-muted-foreground" fill="currentColor" />
                                                            <h3 className="text-lg font-serif italic text-foreground">Anime Snapshot</h3>
                                                        </div>
                                                        <button onClick={() => handleTabChange('stats')} className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-primary transition-colors">Full Detail</button>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="text-center p-4 bg-muted/10 rounded-2xl">
                                                            <p className="text-[8px] font-bold uppercase text-muted-foreground/60 mb-1">Total</p>
                                                            <p className="text-xl font-serif italic text-foreground">{profile.anime_stats.count}</p>
                                                        </div>
                                                        <div className="text-center p-4 bg-muted/10 rounded-2xl">
                                                            <p className="text-[8px] font-bold uppercase text-muted-foreground/60 mb-1">Episodes</p>
                                                            <p className="text-xl font-serif italic text-foreground">{profile.anime_stats.totalUnits}</p>
                                                        </div>
                                                        <div className="text-center p-4 bg-muted/10 rounded-2xl">
                                                            <p className="text-[8px] font-bold uppercase text-muted-foreground/60 mb-1">Mean</p>
                                                            <p className="text-xl font-serif italic text-primary">{profile.anime_stats.meanScore}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 h-1 overflow-hidden rounded-full bg-muted/10">
                                                        {profile.anime_stats.genreStats.slice(0, 5).map((genre, idx) => (
                                                            <div 
                                                                key={genre.name} 
                                                                className="h-full bg-muted-foreground" 
                                                                style={{ 
                                                                    width: `${genre.percentage}%`,
                                                                    opacity: 1 - (idx * 0.15)
                                                                }} 
                                                                title={`${genre.name}: ${Math.round(genre.percentage)}%`}
                                                            />
                                                        ))}
                                                    </div>
                                                </Surface>
                                            )}

                                            {/* Manga Snapshot */}
                                            {profile.manga_stats && (
                                                <Surface variant="paper" className="p-8 space-y-6 group">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <Book className="w-5 h-5 text-muted-foreground" />
                                                            <h3 className="text-lg font-serif italic text-foreground">Manga Snapshot</h3>
                                                        </div>
                                                        <button onClick={() => handleTabChange('stats')} className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-primary transition-colors">Full Detail</button>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="text-center p-4 bg-muted/10 rounded-2xl">
                                                            <p className="text-[8px] font-bold uppercase text-muted-foreground/60 mb-1">Total</p>
                                                            <p className="text-xl font-serif italic text-foreground">{profile.manga_stats.count}</p>
                                                        </div>
                                                        <div className="text-center p-4 bg-muted/10 rounded-2xl">
                                                            <p className="text-[8px] font-bold uppercase text-muted-foreground/60 mb-1">Chapters</p>
                                                            <p className="text-xl font-serif italic text-foreground">{profile.manga_stats.totalUnits}</p>
                                                        </div>
                                                        <div className="text-center p-4 bg-muted/10 rounded-2xl">
                                                            <p className="text-[8px] font-bold uppercase text-muted-foreground/60 mb-1">Mean</p>
                                                            <p className="text-xl font-serif italic text-primary">{profile.manga_stats.meanScore}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 h-1 overflow-hidden rounded-full bg-muted/10">
                                                        {profile.manga_stats.genreStats.slice(0, 5).map((genre, idx) => (
                                                            <div 
                                                                key={genre.name} 
                                                                className="h-full bg-primary" 
                                                                style={{ 
                                                                    width: `${genre.percentage}%`,
                                                                    opacity: 1 - (idx * 0.15)
                                                                }} 
                                                                title={`${genre.name}: ${Math.round(genre.percentage)}%`}
                                                            />
                                                        ))}
                                                    </div>
                                                </Surface>
                                            )}
                                        </div>

                                        {renderSection('now_reading')}
                                        {renderSection('changelog')}
                                        {renderSection('featured_collections')}
                                        {renderSection('favorites')}
                                        
                                        {/* Invitation to Library */}
                                        <Surface variant="muted" className="p-12 flex flex-col items-center text-center gap-6">
                                            <Wind className="w-12 h-12 text-muted-foreground opacity-40" />
                                            <h3 className="text-2xl font-serif italic text-foreground">Continue the discovery?</h3>
                                            <div className="flex gap-4">
                                                <button onClick={() => handleTabChange('manga')} className="px-8 py-3 bg-card border border-border/40 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-foreground hover:text-background transition-all active:scale-95">Manga Shelf</button>
                                                <button onClick={() => handleTabChange('anime')} className="px-8 py-3 bg-card border border-border/40 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-foreground hover:text-background transition-all active:scale-95">Anime Shelf</button>
                                            </div>
                                        </Surface>
                                    </div>
                                )}

                                {(activeTab === 'anime' || activeTab === 'manga') && (
                                    <div className="space-y-12">
                                        {renderSection('archive')}
                                    </div>
                                )}

                                {activeTab === 'favorites' && (
                                    <div className="space-y-20">
                                        {renderSection('featured_collections')}
                                        <div className="pt-10">
                                            {renderSection('favorites')}
                                        </div>
                                        {isOwner && (
                                            <div className="pt-20 border-t border-border/40">
                                                <Collections />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'stats' && (
                                    <div className="grid gap-12">
                                        {isOwner || profile.show_stats ? (
                                            <Analytics stats={activeStats} />
                                        ) : (
                                            <div className="p-20 text-center bg-card rounded-3xl border border-border/40">
                                                <Wind className="w-16 h-16 text-muted-foreground opacity-20 mx-auto mb-8" />
                                                <h3 className="text-xl font-serif italic text-foreground">Archive Insights</h3>
                                                <p className="mt-4 text-muted-foreground max-w-sm mx-auto">This diary owner prefers to keep their deeper analytics private.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'notifications' && isOwner && (
                                    <Notifications />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </div>
    );
}
