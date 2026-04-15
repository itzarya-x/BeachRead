import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
    ArrowRight,
    BookOpen,
    Calendar,
    Loader2,
    Share2,
    MapPin,
    Globe,
    User as UserIcon,
    Award,
    Heart,
    TrendingUp,
    Clock3,
    Settings,
    Activity,
    Layers,
    History,
    Sparkles,
    UserPlus,
    MessageSquare,
    PieChart,
    BarChart3,
    MoreHorizontal,
    Bell
} from 'lucide-react';
import { fetchPublicProfile, type PublicProfileRecord } from '../lib/publicProfile';
import { handleCoverImageError, sanitizeCoverUrl } from '../lib/image';
import { useAuth } from '../context/auth-context';
import type { ProfilePrivacyConfig, ProfileSectionsConfig, SectionId, SnapshotCardId } from '../lib/types';

// Management Components
import Library from './Library';
import Analytics from './Analytics';
import Notifications from './Notifications';
import Collections from './Collections';

const DEFAULT_SECTION_ORDER: SectionId[] = [
    'now_reading',
    'snapshot',
    'starter_pack',
    'stats',
    'featured_collections',
    'favorites',
    'changelog',
    'archive',
    'characters',
];

const DEFAULT_PROFILE_SECTIONS: ProfileSectionsConfig = {
    visible: {
        stats: true,
        snapshot: true,
        now_reading: true,
        featured_collections: true,
        favorites: true,
        starter_pack: true,
        changelog: true,
        archive: true,
        characters: true,
    },
    order: DEFAULT_SECTION_ORDER,
};


const DEFAULT_PROFILE_PRIVACY: ProfilePrivacyConfig = {
    showScores: true,
    showProgress: true,
    showDroppedPaused: true,
    hideAdultContent: false,
};

type ProfileTab = 'overview' | 'anime' | 'manga' | 'favorites' | 'stats' | 'social' | 'reviews' | 'notifications';

function resolveSectionsConfig(profile: PublicProfileRecord): ProfileSectionsConfig {
    const incoming = profile.profile_sections;
    if (!incoming) return DEFAULT_PROFILE_SECTIONS;

    const visible = {
        ...DEFAULT_PROFILE_SECTIONS.visible,
        ...(incoming.visible || {}),
    };

    const normalizedOrder = Array.isArray(incoming.order)
        ? incoming.order.filter((item): item is SectionId => typeof item === 'string' && item in visible)
        : [];

    return {
        visible,
        order: normalizedOrder.length ? normalizedOrder : DEFAULT_SECTION_ORDER,
    };
}

function resolvePrivacyConfig(profile: PublicProfileRecord): ProfilePrivacyConfig {
    if (!profile.profile_privacy) return DEFAULT_PROFILE_PRIVACY;
    return {
        ...DEFAULT_PROFILE_PRIVACY,
        ...profile.profile_privacy,
    };
}

function formatStatus(status: string) {
    return status.replace(/_/g, ' ');
}

function formatTime(value?: string) {
    if (!value) return 'Unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function buildSnapshotCards(profile: PublicProfileRecord, cardIds: SnapshotCardId[]) {
    const total = profile.total_entries || 0;
    const completed = profile.completed_entries || 0;
    const reading = profile.reading_entries || 0;
    const favorites = profile.favorites_count ?? (profile.recent_library?.filter((item) => item.isFavourite).length || 0);
    const completionRatio = total > 0 ? ((completed / total) * 100).toFixed(0) : '0';
    const favoritesDensity = total > 0 ? ((favorites / total) * 100).toFixed(0) : '0';
    const topGenre = profile.genre_stats?.[0]?.name || 'N/A';
    const readingDepth = reading > 0 ? Math.round((profile.total_chapters || 0) / reading) : 0;

    const map: Record<SnapshotCardId, { label: string; value: string }> = {
        archive_overview: { label: 'Collection Size', value: `${total}` },
        completion_ratio: { label: 'Completion Rate', value: `${completionRatio}%` },
        favorites_density: { label: 'Favorites %', value: `${favoritesDensity}%` },
        top_genre: { label: 'Top Genre', value: topGenre },
        reading_depth: { label: 'Avg Chapters', value: `${readingDepth}` },
    };

    return cardIds.map((id) => ({ id, ...map[id] }));
}

export default function PublicProfile() {
    const { username = '' } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user: authUser } = useAuth();
    const [profile, setProfile] = useState<PublicProfileRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

    // Handle tab from URL
    useEffect(() => {
        const tab = searchParams.get('tab') as ProfileTab;
        if (tab && ['overview', 'anime', 'manga', 'favorites', 'stats', 'social', 'reviews', 'notifications'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    const handleTabChange = (tab: ProfileTab) => {
        setActiveTab(tab);
        setSearchParams({ tab }, { replace: true });
    };

    const isOwner = authUser && profile && authUser.id === profile.user_id;

    const handleShareProfile = async () => {
        if (!profile) return;
        const shareUrl = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `${profile.display_name} on BeachRead`,
                    text: `Check out ${profile.display_name}'s manga collection!`,
                    url: shareUrl,
                });
                return;
            }
            await navigator.clipboard.writeText(shareUrl);
        } catch (error) {
            console.error('Failed to share profile:', error);
        }
    };

    useEffect(() => {
        let active = true;

        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                const data = await fetchPublicProfile(username);
                if (!active) return;
                setProfile(data);
                if (!data) {
                    setError('Profile not found');
                }
            } catch (err) {
                if (!active) return;
                setError(err instanceof Error ? err.message : 'Failed to load profile');
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        void load();

        return () => {
            active = false;
        };
    }, [username]);

    const safeProfile = profile;
    const safeRecentLibrary = safeProfile?.recent_library || [];
    const safeGenreStats = safeProfile?.genre_stats || [];
    const safePrivacy = safeProfile ? resolvePrivacyConfig(safeProfile) : DEFAULT_PROFILE_PRIVACY;

    const filteredRecentLibrary = useMemo(() => {
        const blockedStatuses = safePrivacy.showDroppedPaused ? [] : ['DROPPED', 'PAUSED'];
        return safeRecentLibrary.filter((item) => !blockedStatuses.includes(item.status));
    }, [safeRecentLibrary, safePrivacy.showDroppedPaused]);

    const favoriteManga = useMemo(() => {
        const favs = filteredRecentLibrary.filter((item) => item.isFavourite);
        if (!profile) return favs;
        
        const order = profile.favorite_manga_order || [];
        if (order.length === 0) return favs;

        const orderMap = new Map(order.map((id, index) => [id, index]));
        return [...favs].sort((a, b) => {
            const indexA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999;
            const indexB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999;
            return indexA - indexB;
        });
    }, [filteredRecentLibrary, profile]);

    const visibleGenreStats = useMemo(() => {
        const adultKeywords = ['hentai', 'ecchi', 'adult', 'nsfw'];
        if (!safePrivacy.hideAdultContent) return safeGenreStats;
        return safeGenreStats.filter((genre) => !adultKeywords.some((key) => genre.name.toLowerCase().includes(key)));
    }, [safeGenreStats, safePrivacy.hideAdultContent]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background pt-[64px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 pt-[64px] text-center">
                <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">Profile Missing</h1>
                <p className="mt-4 max-w-md text-sm text-muted-foreground">{error || 'This public profile is not available.'}</p>
                <Link
                    to="/"
                    className="mt-8 inline-flex h-[48px] items-center justify-center rounded-full bg-foreground px-8 text-[11px] font-black uppercase tracking-widest text-background transition-opacity hover:opacity-90"
                >
                    Return Home
                </Link>
            </div>
        );
    }

    if (profile.is_private) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 pt-[64px] text-center">
                <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">Private Collection</h1>
                <p className="mt-4 max-w-md text-sm text-muted-foreground">This user has set their collection to private.</p>
                <Link
                    to="/"
                    className="mt-8 inline-flex h-[48px] items-center justify-center rounded-full bg-foreground px-8 text-[11px] font-black uppercase tracking-widest text-background transition-opacity hover:opacity-90"
                >
                    Return Home
                </Link>
            </div>
        );
    }

    const joinedDate = profile.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'Unknown';

    const primaryColor = profile.custom_colors?.primary || '#F77F00';
    const sectionsConfig = resolveSectionsConfig(profile);
    const privacy = safePrivacy;
    const snapshotCards = buildSnapshotCards(profile, profile.snapshot_cards || ['archive_overview', 'completion_ratio', 'top_genre']);

    const copyShareKit = async (kind: 'link' | 'intro' | 'markdown') => {
        const link = window.location.href;
        const intro = `Check out @${profile.username}'s collection: ${link}`;
        const markdown = `[${profile.display_name}'s Collection](${link})`;
        const payload = kind === 'link' ? link : kind === 'intro' ? intro : markdown;
        try {
            await navigator.clipboard.writeText(payload);
        } catch (err) {
            console.error('Failed to copy share kit text:', err);
        }
    };

    const renderSection = (section: SectionId) => {
        if (!sectionsConfig.visible[section]) return null;

        if (section === 'now_reading') {
            const nowReading = profile.now_reading;
            if (!nowReading) return null;
            return (
                <section key={section} className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                        <BookOpen className="h-5 w-5" style={{ color: primaryColor }} />
                        <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground">Now Reading Spotlight</h2>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-[220px,1fr] rounded-[28px] border border-border/40 bg-muted/10 p-6 shadow-xl">
                        <div className="aspect-[2/3] overflow-hidden rounded-2xl border border-border/40">
                            <img src={sanitizeCoverUrl(nowReading.coverUrl)} onError={handleCoverImageError} alt={nowReading.title} className="h-full w-full object-cover" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black uppercase tracking-tight text-foreground">{nowReading.title}</h3>
                            <div className="flex flex-wrap gap-4">
                                {privacy.showProgress && (
                                    <span className="px-4 py-1.5 bg-primary/10 text-primary text-[11px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                                        Progress: {nowReading.progress}{nowReading.chapters ? ` / ${nowReading.chapters}` : ''}
                                    </span>
                                )}
                                {privacy.showScores && typeof nowReading.score === 'number' && nowReading.score > 0 && (
                                    <span className="px-4 py-1.5 bg-muted text-foreground text-[11px] font-black uppercase tracking-widest rounded-full border border-border/40">
                                        Score: {nowReading.score}/10
                                    </span>
                                )}
                            </div>
                            {nowReading.publicNote ? (
                                <div className="rounded-2xl border border-border/40 bg-background/50 p-6 text-base italic text-foreground/80 leading-relaxed shadow-inner">
                                    "{nowReading.publicNote}"
                                </div>
                            ) : null}
                        </div>
                    </div>
                </section>
            );
        }

        if (section === 'starter_pack') {
            const pinnedIds = profile.pinned_manga_ids || [];
            const pinnedManga = profile.recent_library?.filter(m => pinnedIds.includes(m.id)) || [];
            if (!pinnedManga.length) return null;
            
            return (
                <section key={section} className="space-y-8">
                    <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                        <Sparkles className="h-5 w-5" style={{ color: primaryColor }} />
                        <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground">The Starter Pack</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {pinnedManga.map((manga) => (
                            <Link
                                key={manga.id}
                                to={`/manga/${manga.id}`}
                                className="group relative flex flex-col p-6 rounded-[40px] bg-muted/10 border border-border/40 hover:bg-muted/20 transition-all shadow-xl"
                            >
                                <div className="flex gap-6 items-center">
                                    <div className="w-24 h-36 shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/5">
                                        <img src={sanitizeCoverUrl(manga.coverUrl)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 mb-3">
                                            <Award className="w-3 h-3 text-primary" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-primary">Masterpiece</span>
                                        </div>
                                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight line-clamp-2 group-hover:text-primary transition-colors">{manga.title}</h3>
                                        <p className="mt-2 text-xs text-muted-foreground uppercase tracking-widest font-bold">Recommended Entry</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            );
        }

        if (section === 'snapshot') {

            return (
                <section key={section} className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                        <Award className="h-5 w-5" style={{ color: primaryColor }} />
                        <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground">Collection Stats</h2>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {snapshotCards.map((card) => (
                            <div key={card.id} className="rounded-3xl border border-border/40 bg-muted/5 p-6 transition-all hover:bg-muted/10 group">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{card.label}</p>
                                <p className="mt-3 text-3xl font-black tracking-tight text-foreground">{card.value}</p>
                            </div>
                        ))}
                    </div>
                </section>
            );
        }

        if (section === 'stats' && profile.show_stats) {
            return (
                <div key={section} 
                    className="p-8 rounded-[40px] border border-white/5 shadow-2xl overflow-hidden relative group bg-muted/10 dark:bg-muted/5"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <TrendingUp className="w-32 h-32" />
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] mb-10 text-primary">Library Analysis</h3>
                    <div className="space-y-10">
                        <StatRow label="Manga Completed" value={profile.completed_entries || 0} primaryColor={primaryColor} />
                        <StatRow label="Chapters Read" value={profile.total_chapters || 0} primaryColor={primaryColor} />
                        <StatRow label="Average Score" value={privacy.showScores ? profile.mean_score || 0 : 'HIDDEN'} primaryColor={primaryColor} />
                    </div>

                    <div className="mt-12 pt-8 border-t border-border/40">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-6">Favorite Genres</h3>
                        <div className="flex flex-wrap gap-2.5">
                            {visibleGenreStats.length ? visibleGenreStats.map((genre) => (
                                <span key={genre.name} className="px-4 py-1.5 rounded-xl bg-muted/40 border border-border/50 text-[10px] font-bold text-foreground/70 uppercase tracking-wider transition-colors hover:border-primary/30">
                                    {genre.name} <span style={{ color: primaryColor }}>{genre.count}</span>
                                </span>
                            )) : <p className="text-[10px] italic text-muted-foreground">No data yet.</p>}
                        </div>
                    </div>
                </div>
            );
        }

        if (section === 'featured_collections') {
            const featured = profile.featured_collections || [];
            if (!featured.length) return null;
            return (
                <section key={section} className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                        <Award className="h-5 w-5" style={{ color: primaryColor }} />
                        <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground">Featured Collections</h2>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                        {featured.map((collection) => (
                            <div key={collection.name} className="rounded-3xl border border-border/40 bg-muted/5 p-5 group hover:bg-muted/10 transition-all">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">{collection.name}</h3>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-2 py-0.5 bg-muted rounded">{collection.count} Items</span>
                                </div>
                                <div className="flex -space-x-4">
                                    {collection.covers.slice(0, 5).map((cover, index) => (
                                        <div key={`${collection.name}-${index}`} className="h-24 w-16 overflow-hidden rounded-xl border-2 border-background bg-muted shadow-lg transition-transform group-hover:-translate-y-1" style={{ transitionDelay: `${index * 50}ms` }}>
                                            <img src={sanitizeCoverUrl(cover)} onError={handleCoverImageError} alt="" className="h-full w-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            );
        }

        if (section === 'favorites') {
            return (
                <section key={section} className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border/40 pb-4">
                        <div className="flex items-center gap-3">
                            <Heart className="h-5 w-5" style={{ color: primaryColor }} />
                            <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground">Top Favorites</h2>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{favoriteManga.length} Items</span>
                    </div>
                    {favoriteManga.length ? (
                        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                            {favoriteManga.map((item) => (
                                <FavoriteCover key={item.id} item={item} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-[40px] bg-muted/5">
                            <p className="text-sm text-muted-foreground italic">No favorites yet.</p>
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
                        <Clock3 className="h-5 w-5" style={{ color: primaryColor }} />
                        <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground">Recent Activity</h2>
                    </div>
                    <div className="space-y-4">
                        {changelog.map((entry) => (
                            <div key={entry.id} className="flex gap-6 p-6 rounded-[32px] bg-muted/5 border border-border/40 relative group overflow-hidden transition-all hover:bg-muted/10">
                                <div className="absolute top-0 left-0 w-1 h-full opacity-40 group-hover:opacity-100 transition-all" style={{ backgroundColor: primaryColor }} />
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-primary/10">
                                    <TrendingUp className="w-6 h-6 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="text-[11px] font-black uppercase tracking-widest mb-1 text-primary">{formatStatus(entry.status)}</h4>
                                            <h3 className="text-lg font-black text-foreground uppercase tracking-tight">{entry.title}</h3>
                                        </div>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            {formatTime(entry.updatedAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground italic leading-relaxed">
                                        {privacy.showProgress ? `Read until Ch. ${entry.progress}` : 'List updated.'}
                                    </p>
                                    {entry.publicNote && <p className="mt-3 text-sm text-foreground/70 border-l-2 border-primary/30 pl-4 py-1 italic">{entry.publicNote}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            );
        }

        if (section === 'archive') {
            const list = activeTab === 'anime'
                ? filteredRecentLibrary.filter(item => item.mediaType === 'ANIME')
                : activeTab === 'manga'
                ? filteredRecentLibrary.filter(item => item.mediaType === 'MANGA')
                : filteredRecentLibrary;

            return (
                <section key={section} className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border/40 pb-4">
                        <div className="flex items-center gap-3">
                            <BookOpen className="h-5 w-5" style={{ color: primaryColor }} />
                            <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground">
                                {activeTab === 'anime' ? 'Anime List' : activeTab === 'manga' ? 'Manga List' : 'Complete Collection'}
                            </h2>
                        </div>
                        <Link to="/discover" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground">
                            Browse More <ArrowRight size={14} />
                        </Link>
                    </div>
                    {list.length ? (
                        <div className="grid gap-6 md:grid-cols-2">
                            {list.map((item) => (
                                <div key={item.id} className="group flex gap-5 rounded-[32px] border border-border/40 bg-muted/5 p-5 hover:bg-muted/10 transition-all">
                                    <div className="h-28 w-20 shrink-0 overflow-hidden rounded-2xl shadow-xl">
                                        <img src={sanitizeCoverUrl(item.coverUrl)} onError={handleCoverImageError} alt={item.title} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                    </div>
                                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: primaryColor }}>{formatStatus(item.status)}</p>
                                        <h3 className="line-clamp-1 text-lg font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                                        <div className="mt-2 flex flex-wrap gap-3">
                                            {privacy.showProgress ? (
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                    {item.mediaType === 'ANIME' ? `Ep. ${item.progress}` : `Ch. ${item.progress}`}
                                                </span>
                                            ) : null}
                                            {privacy.showScores && typeof item.score === 'number' && item.score > 0 ? (
                                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Score: {item.score}/10</span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-[40px] bg-muted/5">
                            <p className="text-sm text-muted-foreground italic">List is empty.</p>
                        </div>
                    )}
                </section>
            );
        }

        if (section === 'characters') {
            const characters = profile.favorite_characters || [];
            if (!characters.length) return null;
            return (
                <section key={section} className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border/40 pb-4">
                        <div className="flex items-center gap-3">
                            <Award className="h-5 w-5" style={{ color: primaryColor }} />
                            <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground">Favorite Characters</h2>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{characters.length} Added</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                        {characters.map((char) => (
                            <div key={char.id} className="group relative aspect-[2/3] overflow-hidden rounded-2xl border border-border/40 bg-muted/20 hover:scale-105 transition-all duration-300 shadow-lg" title={char.name}>
                                <img src={char.image} alt={char.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                    <p className="text-[8px] font-black text-white uppercase truncate">{char.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            );
        }

        return null;
    };

    const tabSections: Record<ProfileTab, SectionId[]> = {
        overview: ['now_reading', 'stats', 'changelog'],
        anime: ['archive'],
        manga: ['archive'],
        favorites: ['favorites', 'characters', 'featured_collections'],
        stats: ['snapshot', 'stats'],
        social: [],
        reviews: [],
        notifications: []
    };

    return (
        <div className="min-h-screen bg-background">
            {/* AniList Style Header with Tactical Overlays */}
            <div className="relative w-full">
                {/* Banner */}
                <div 
                    className="h-[300px] md:h-[450px] w-full bg-muted relative overflow-hidden border-b-4 border-primary/20"
                    style={{
                        backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    {/* Scanlines Overlay */}
                    <div className="absolute inset-0 z-10 pointer-events-none opacity-[0.03]" 
                        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0) 50%, rgba(0,0,0,0.25) 50%), linear-gradient(90deg, rgba(255,0,0,0.06), rgba(0,255,0,0.02), rgba(0,0,255,0.06))', backgroundSize: '100% 4px, 3px 100%' }} 
                    />
                    
                    {!profile.banner_url && (
                        <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                            <Layers size={200} />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-0" />

                    {/* Tactical Metadata Floating Labels */}
                    <div className="absolute top-10 left-10 z-20 hidden md:flex flex-col gap-2">
                        <div className="px-3 py-1 bg-primary text-black text-[9px] font-black uppercase tracking-widest">Archive Sector: {profile.username.slice(0,3).toUpperCase()}</div>
                        <div className="px-3 py-1 bg-black/80 backdrop-blur-md text-white border border-white/20 text-[8px] font-bold uppercase tracking-[0.3em]">Status: Operational</div>
                    </div>
                    <div className="absolute top-10 right-10 z-20 hidden md:flex flex-col items-end gap-2">
                        <div className="px-3 py-1 bg-black/80 backdrop-blur-md text-white border border-white/20 text-[8px] font-bold uppercase tracking-[0.3em]">v.2.0.ARCHIVE</div>
                        <div className="text-[10px] font-black text-primary uppercase tracking-tighter">BeachRead Terminal</div>
                    </div>
                </div>

                {/* Profile Info Row */}
                <div className="bg-background/90 backdrop-blur-xl border-b-2 border-border/60 sticky top-[72px] z-40">
                    <div className="mx-auto max-w-[1200px] px-6">
                        <div className="relative flex flex-col md:flex-row items-center md:items-end gap-10 pb-6 md:pb-0">
                            {/* Avatar (Overlapping) with Industrial Border */}
                            <div className="relative -mt-24 md:-mt-32 shrink-0 group">
                                <div className="w-48 h-48 md:w-64 md:h-64 bg-muted border-[6px] border-background shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
                                    {/* Corner Accents */}
                                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary z-10" />
                                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary z-10" />
                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary z-10" />
                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary z-10" />
                                    
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt={profile.display_name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-muted-foreground/10">
                                            <UserIcon className="w-24 h-24 text-muted-foreground/30" />
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-primary flex items-center justify-center border-4 border-background shadow-xl">
                                    <Award size={24} className="text-black" />
                                </div>
                            </div>

                            {/* Name & Actions with High Contrast */}
                            <div className="flex-1 flex flex-col md:flex-row items-center md:items-center justify-between gap-8 py-8">
                                <div className="text-center md:text-left space-y-1">
                                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground uppercase leading-none">
                                            {profile.display_name}
                                        </h1>
                                        <div className="px-3 py-1 bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest border border-border/40">
                                            @{profile.username}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center md:justify-start gap-4">
                                        <div className="h-1 w-12 bg-primary" />
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.4em]">Archival Strategist</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {isOwner ? (
                                        <Link
                                            to="/settings"
                                            className="h-14 px-8 bg-primary text-black text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all flex items-center gap-3 shadow-[4px_4px_0px_rgba(247,127,0,0.3)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                                        >
                                            <Settings size={16} />
                                            Override Settings
                                        </Link>
                                    ) : (
                                        <>
                                            <button className="h-14 px-8 bg-foreground text-background text-[11px] font-black uppercase tracking-[0.2em] hover:bg-primary transition-all flex items-center gap-3">
                                                <UserPlus size={16} />
                                                Connect
                                            </button>
                                            <button className="h-14 w-14 flex items-center justify-center border-2 border-border/60 hover:border-primary hover:text-primary transition-all">
                                                <MessageSquare size={20} />
                                            </button>
                                        </>
                                    )}
                                    <div className="h-14 w-[2px] bg-border/20 mx-2" />
                                    <button 
                                        onClick={handleShareProfile}
                                        className="h-14 w-14 flex items-center justify-center border-2 border-border/60 hover:bg-muted transition-all"
                                    >
                                        <Share2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Tabs - Terminal Style */}
                        <div className="flex overflow-x-auto no-scrollbar gap-2 mt-4">
                            {(['overview', 'anime', 'manga', 'favorites', 'stats', 'social', 'reviews', 'notifications'] as const)
                                .filter(tab => tab !== 'notifications' || isOwner)
                                .map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => handleTabChange(tab)}
                                    className={`px-8 py-5 text-[11px] font-black uppercase tracking-[0.3em] whitespace-nowrap transition-all border-t-4 ${
                                        activeTab === tab 
                                            ? 'text-primary border-primary bg-primary/5' 
                                            : 'text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/30'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="mx-auto max-w-[1200px] px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Sidebar - only show on Overview and Stats */}
                    {(activeTab === 'overview' || activeTab === 'stats') && (
                        <aside className="lg:col-span-3 space-y-10">
                            {/* Joined Info */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    Joined {joinedDate}
                                </div>
                                {profile.location && (
                                    <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        {profile.location}
                                    </div>
                                )}
                                {profile.website && (
                                    <a 
                                        href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        <Globe className="h-4 w-4 text-primary" />
                                        {profile.website.replace(/^https?:\/\//, '').split('/')[0]}
                                    </a>
                                )}
                            </div>

                            {/* Mini Stats Component - Tactical Display */}
                            <div className="p-8 border-2 border-border/60 bg-muted/20 space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 -rotate-45 translate-x-8 -translate-y-8" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">System Integrity</h3>
                                <div className="space-y-6">
                                    <StatusMeter 
                                        label="Archive Completion" 
                                        value={snapshotCards.find(c => c.id === 'completion_ratio')?.value || '0%'} 
                                        percentage={parseInt(snapshotCards.find(c => c.id === 'completion_ratio')?.value || '0')}
                                        color={primaryColor}
                                    />
                                    <StatusMeter 
                                        label="Favorites Density" 
                                        value={snapshotCards.find(c => c.id === 'favorites_density')?.value || '0%'} 
                                        percentage={parseInt(snapshotCards.find(c => c.id === 'favorites_density')?.value || '0')}
                                        color="#3b82f6"
                                    />
                                    <div className="pt-4 border-t border-border/40 flex justify-between items-end">
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Total Units</p>
                                            <p className="text-2xl font-black text-foreground">{profile.total_entries}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Mean Delta</p>
                                            <p className="text-2xl font-black text-primary">{profile.mean_score}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Genre Breakdown in Sidebar */}
                            <div className="space-y-4">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Top Genres</h3>
                                <div className="flex flex-wrap gap-2">
                                    {visibleGenreStats.slice(0, 10).map((genre) => (
                                        <span key={genre.name} className="px-3 py-1 bg-muted rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                            {genre.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Technical Specifications */}
                            <div className="pt-10 border-t-2 border-border/40 space-y-6">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60">Technical Specifications</h3>
                                <div className="space-y-4">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase text-muted-foreground/40 mb-1">Archive ID</span>
                                        <span className="text-[10px] font-bold text-foreground font-mono">{profile.user_id.slice(0, 8)}...{profile.user_id.slice(-4)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase text-muted-foreground/40 mb-1">Deployment Date</span>
                                        <span className="text-[10px] font-bold text-foreground uppercase">{joinedDate}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black uppercase text-muted-foreground/40 mb-1">Security Clearance</span>
                                        <span className="text-[10px] font-bold text-primary uppercase">{isOwner ? 'Level 5 (Admin)' : 'Level 1 (Guest)'}</span>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    )}

                    {/* Main Content */}
                    <main className={`${(activeTab === 'overview' || activeTab === 'stats' || activeTab === 'social' || activeTab === 'reviews') ? 'lg:col-span-9' : 'lg:col-span-12'} space-y-12`}>
                        {activeTab === 'overview' && (
                            <div className="space-y-12">
                                {/* Tactical Overview Readout */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-6 border-2 border-border/40 bg-muted/5 flex flex-col items-center justify-center text-center group hover:border-primary transition-all">
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">Total Units</p>
                                        <p className="text-4xl font-black text-foreground">{profile.total_entries}</p>
                                    </div>
                                    <div className="p-6 border-2 border-border/40 bg-muted/5 flex flex-col items-center justify-center text-center group hover:border-primary transition-all">
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">Chapters Read</p>
                                        <p className="text-4xl font-black text-foreground">{profile.total_chapters}</p>
                                    </div>
                                    <div className="p-6 border-2 border-border/40 bg-muted/5 flex flex-col items-center justify-center text-center group hover:border-primary transition-all">
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">Mean Score</p>
                                        <p className="text-4xl font-black text-primary">{profile.mean_score}</p>
                                    </div>
                                    <div className="p-6 border-2 border-border/40 bg-muted/5 flex flex-col items-center justify-center text-center group hover:border-primary transition-all">
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-2">Completion</p>
                                        <p className="text-4xl font-black text-foreground">{snapshotCards.find(c => c.id === 'completion_ratio')?.value || '0%'}</p>
                                    </div>
                                </div>

                                {/* About Me / Bio */}
                                <section className="space-y-4">
                                    <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground border-b border-border/40 pb-4">About Me</h2>
                                    <div className="prose prose-invert max-w-none">
                                        <p className="text-lg leading-relaxed text-foreground/80 whitespace-pre-wrap">
                                            {profile.bio || "This user has not written a bio yet."}
                                        </p>
                                    </div>
                                </section>
                                
                                {renderSection('now_reading')}
                                {renderSection('changelog')}
                            </div>
                        )}

                        {(activeTab === 'anime' || activeTab === 'manga') && (
                            <div className="space-y-8">
                                {isOwner ? (
                                    <Library mediaTypeOverride={activeTab.toUpperCase() as 'ANIME' | 'MANGA'} />
                                ) : (
                                    renderSection('archive')
                                )}
                            </div>
                        )}

                        {activeTab === 'favorites' && (
                            <div className="space-y-12">
                                {isOwner && (
                                    <div className="border-b border-border/40 pb-12">
                                        <Collections />
                                    </div>
                                )}
                                {renderSection('favorites')}
                                {renderSection('characters')}
                                {renderSection('featured_collections')}
                            </div>
                        )}

                        {activeTab === 'stats' && (
                            <div className="grid gap-8">
                                {isOwner ? (
                                    <div>
                                        <Analytics />
                                    </div>
                                ) : (
                                    <>
                                        {renderSection('stats')}
                                        {renderSection('snapshot')}
                                        
                                        {/* Placeholder for more detailed stats */}
                                        <div className="p-10 rounded-3xl border border-border/40 bg-muted/5 flex flex-col items-center justify-center text-center">
                                            <BarChart3 className="w-12 h-12 text-muted-foreground/20 mb-4" />
                                            <h3 className="text-lg font-black uppercase">Detailed Analysis</h3>
                                            <p className="text-sm text-muted-foreground mt-2">Charts and advanced insights are being calibrated for your archive.</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {activeTab === 'social' && (
                            <div className="space-y-12">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="p-10 border-2 border-border/40 bg-muted/10 flex flex-col items-center justify-center text-center group transition-all hover:bg-muted/20">
                                        <UserPlus size={48} className="text-muted-foreground/20 mb-6 group-hover:text-primary group-hover:scale-110 transition-all" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mb-1">Followers</p>
                                        <p className="text-4xl font-black text-foreground">00</p>
                                    </div>
                                    <div className="p-10 border-2 border-border/40 bg-muted/10 flex flex-col items-center justify-center text-center group transition-all hover:bg-muted/20">
                                        <UserIcon size={48} className="text-muted-foreground/20 mb-6 group-hover:text-primary group-hover:scale-110 transition-all" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground mb-1">Following</p>
                                        <p className="text-4xl font-black text-foreground">00</p>
                                    </div>
                                </div>

                                <div className="py-24 flex flex-col items-center justify-center text-center border-2 border-dashed border-border/40 bg-muted/5">
                                    <Layers className="w-16 h-16 text-muted-foreground/20 mb-6 animate-pulse" />
                                    <h3 className="text-2xl font-black uppercase tracking-tight text-foreground">Social Grid Offline</h3>
                                    <p className="text-sm text-muted-foreground italic mt-2 max-w-sm">
                                        The social networking layer is currently being calibrated. Peer connections will be visible in the next deployment.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="space-y-12">
                                <div className="p-10 border-2 border-border/40 bg-primary/5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <MessageSquare size={120} />
                                    </div>
                                    <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-primary mb-2">Critical Analysis Feed</h3>
                                    <p className="text-sm text-muted-foreground italic">No review transmissions detected for this sector.</p>
                                </div>

                                <div className="py-32 flex flex-col items-center justify-center text-center border-2 border-dashed border-border/40 bg-muted/5">
                                    <div className="w-20 h-20 bg-muted flex items-center justify-center mb-8 rotate-45 border border-border/40">
                                        <MessageSquare size={32} className="-rotate-45 text-muted-foreground/40" />
                                    </div>
                                    <h3 className="text-xl font-black uppercase tracking-widest text-foreground">Feed Uninitialized</h3>
                                    <p className="text-sm text-muted-foreground italic mt-3 max-w-xs">
                                        This archive owner has not published any critical reviews yet.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && isOwner && (
                            <div>
                                <Notifications />
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

function StatusMeter({ label, value, percentage, color }: { label: string; value: string; percentage: number; color: string }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
                <span className="text-[10px] font-black text-foreground">{value}</span>
            </div>
            <div className="h-2 w-full bg-muted border border-border/40 rounded-full overflow-hidden relative">
                <div 
                    className="h-full transition-all duration-1000 ease-out"
                    style={{ 
                        width: `${percentage}%`, 
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}40`
                    }} 
                />
            </div>
        </div>
    );
}

function StatRow({ label, value, primaryColor }: { label: string; value: string | number, primaryColor: string }) {
    return (
        <div className="flex justify-between items-end relative z-10 p-6 border-b border-border/20 group hover:bg-primary/5 transition-colors">
            <span className="text-[12px] font-black uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all">{label}</span>
            <div className="flex flex-col items-end">
                <span className="text-6xl font-black text-foreground leading-none tracking-tighter">{value}</span>
                <div className="w-24 h-2 mt-4 bg-muted relative overflow-hidden">
                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 ease-out" style={{ backgroundColor: primaryColor }} />
                </div>
            </div>
        </div>
    );
}

const FavoriteCover: React.FC<{ item: any }> = ({ item }) => (
    <Link
        to={`/manga/${item.id}`}
        className="group relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/5 bg-muted/20 transition-all duration-500 hover:scale-[1.05] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
        title={item.title}
    >
        <img
            src={sanitizeCoverUrl(item.coverUrl)}
            onError={handleCoverImageError}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            alt={item.title}
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/20 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <p className="line-clamp-2 text-[10px] font-black uppercase tracking-tight text-white leading-tight">{item.title}</p>
        </div>
    </Link>
);
