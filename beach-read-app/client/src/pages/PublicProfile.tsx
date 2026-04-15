import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
    Sparkles
} from 'lucide-react';
import { fetchPublicProfile, type PublicProfileRecord } from '../lib/publicProfile';
import { handleCoverImageError, sanitizeCoverUrl } from '../lib/image';
import { useAuth } from '../context/auth-context';
import type { ProfilePrivacyConfig, ProfileSectionsConfig, SectionId, SnapshotCardId } from '../lib/types';

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

type ProfileTab = 'activity' | 'favorites' | 'archive';

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
    const { user: authUser } = useAuth();
    const [profile, setProfile] = useState<PublicProfileRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ProfileTab>('favorites');

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
            return (
                <section key={section} className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border/40 pb-4">
                        <div className="flex items-center gap-3">
                            <BookOpen className="h-5 w-5" style={{ color: primaryColor }} />
                            <h2 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground">Complete Collection</h2>
                        </div>
                        <Link to="/discover" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground">
                            Browse More <ArrowRight size={14} />
                        </Link>
                    </div>
                    {filteredRecentLibrary.length ? (
                        <div className="grid gap-6 md:grid-cols-2">
                            {filteredRecentLibrary.map((item) => (
                                <div key={item.id} className="group flex gap-5 rounded-[32px] border border-border/40 bg-muted/5 p-5 hover:bg-muted/10 transition-all">
                                    <div className="h-28 w-20 shrink-0 overflow-hidden rounded-2xl shadow-xl">
                                        <img src={sanitizeCoverUrl(item.coverUrl)} onError={handleCoverImageError} alt={item.title} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                    </div>
                                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: primaryColor }}>{formatStatus(item.status)}</p>
                                        <h3 className="line-clamp-1 text-lg font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">{item.title}</h3>
                                        <div className="mt-2 flex flex-wrap gap-3">
                                            {privacy.showProgress ? <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ch. {item.progress}</span> : null}
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
                            <p className="text-sm text-muted-foreground italic">Collection is empty.</p>
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
        activity: ['now_reading', 'changelog'],
        favorites: ['favorites', 'characters'],
        archive: ['archive', 'featured_collections']
    };

    return (
        <div className="min-h-screen bg-background pb-[110px]">
            {/* High Impact Hero Section */}
            <div className="relative min-h-[100vh] w-full overflow-hidden bg-background">
                {/* Background Banner */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 0,
                        backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : 'none',
                        backgroundColor: profile.banner_url ? 'transparent' : 'hsl(var(--muted) / 0.3)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center center',
                        backgroundRepeat: 'no-repeat',
                    }}
                />

                {/* Cyber-Brutalist Gradient Overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 1,
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

                {/* Profile Hero Content */}
                <div
                    style={{
                        position: 'relative',
                        zIndex: 2,
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        paddingLeft: '88px',
                        paddingRight: '64px',
                        paddingTop: '36px',
                    }}
                >
                    <div className="flex flex-col md:flex-row gap-12 items-center md:items-start max-w-[1200px]">
                        {/* Avatar */}
                        <div className="relative group shrink-0">
                            <div className="w-40 h-40 md:w-64 md:h-64 rounded-[48px] bg-muted/30 flex items-center justify-center border-4 border-background shadow-[0_30px_60px_rgba(0,0,0,0.2)] overflow-hidden transition-transform duration-500 group-hover:scale-[1.02]">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.display_name} className="h-full w-full object-cover" />
                                ) : (
                                    <UserIcon className="w-20 h-20 md:w-32 md:h-32 text-muted-foreground opacity-30" />
                                )}
                            </div>
                            <div className="absolute -bottom-4 -right-4 p-5 bg-primary text-primary-foreground rounded-2xl shadow-xl border-4 border-background">
                                <Award className="w-8 h-8" />
                            </div>
                        </div>

                        {/* Text Info */}
                        <div className="flex-1 space-y-8 pt-4 text-center md:text-left">
                            <div>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4">
                                    <h1 className="text-5xl md:text-7xl font-black tracking-[-0.05em] text-foreground uppercase leading-none">
                                        {profile.display_name}
                                    </h1>
                                    <span className="px-5 py-2 bg-primary/10 text-primary text-[11px] font-black uppercase tracking-widest rounded-full border border-primary/20 shrink-0">
                                        Public Archive
                                    </span>
                                </div>
                                
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-3 font-medium tracking-wide text-muted-foreground">
                                    <span className="text-foreground/40 font-black italic text-lg">@{profile.username}</span>
                                    <span className="h-1.5 w-1.5 rounded-full bg-border hidden md:block" />
                                    <span className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-primary" />
                                        Joined {joinedDate}
                                    </span>
                                    {profile.location && (
                                        <span className="flex items-center gap-2">
                                            <MapPin className="h-5 w-5 text-primary" />
                                            {profile.location}
                                        </span>
                                    )}
                                    {profile.website && (
                                        <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                                            <Globe className="h-5 w-5 text-primary" />
                                            {profile.website.replace(/^https?:\/\//, '').split('/')[0]}
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="max-w-2xl bg-background/40 backdrop-blur-md border border-border/40 p-10 rounded-[40px] relative overflow-hidden group shadow-xl">
                                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <BookOpen size={64} className="text-primary" />
                                </div>
                                <p className="text-foreground/90 leading-relaxed italic text-lg md:text-xl relative z-10">
                                    {profile.bio ? profile.bio : `"This reader has not added a public bio yet. Exploring the vast ocean of sequential arts one chapter at a time."`}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-5">
                                {isOwner && (
                                    <Link
                                        to="/settings"
                                        className="px-10 py-4 bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest rounded-2xl hover:opacity-90 transition-all active:scale-95 flex items-center gap-3 shadow-lg shadow-primary/20"
                                    >
                                        <Settings size={16} />
                                        Edit Partition
                                    </Link>
                                )}
                                <button
                                    onClick={handleShareProfile}
                                    className="px-10 py-4 border-2 border-foreground/10 bg-background/20 backdrop-blur-sm text-foreground text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-foreground hover:text-background transition-all flex items-center gap-3"
                                >
                                    <Share2 size={16} />
                                    {isOwner ? 'Share Profile' : 'Spread Archive'}
                                </button>
                                
                                <div className="flex gap-2">
                                    <button onClick={() => copyShareKit('link')} className="p-4 rounded-xl border border-border/50 bg-background/40 hover:bg-foreground hover:text-background transition-all" title="Copy Link">
                                        <Globe size={16} />
                                    </button>
                                    <button onClick={() => copyShareKit('intro')} className="p-4 rounded-xl border border-border/50 bg-background/40 hover:bg-foreground hover:text-background transition-all" title="Copy Intro">
                                        <Share2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="mx-auto mt-24 w-full max-w-[1280px] px-[28px]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Sidebar: Stats & Intelligence */}
                    <aside className="lg:col-span-4 space-y-8">
                        {renderSection('stats')}
                        {sectionsConfig.visible.snapshot && (
                            <div className="p-8 rounded-[40px] bg-muted/5 border border-border/40 space-y-6">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">Quick Snapshots</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {snapshotCards.map((card) => (
                                        <div key={card.id} className="p-5 rounded-2xl bg-background/50 border border-border/20">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{card.label}</p>
                                            <p className="text-xl font-black text-foreground">{card.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>

                    {/* Right Main Content: Tabbed Interface */}
                    <main className="lg:col-span-8 space-y-10">
                        {/* Tab Navigation */}
                        <div className="flex border-b border-border/40 gap-10">
                            {(['activity', 'favorites', 'archive'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`pb-6 text-[13px] font-black uppercase tracking-[0.2em] border-b-2 transition-all flex items-center gap-3 ${
                                        activeTab === tab 
                                            ? 'text-primary border-primary' 
                                            : 'text-muted-foreground border-transparent hover:text-foreground'
                                    }`}
                                >
                                    {tab === 'activity' && <Activity size={14} />}
                                    {tab === 'favorites' && <Heart size={14} />}
                                    {tab === 'archive' && <History size={14} />}
                                    {tab} Log
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {sectionsConfig.order
                                .filter(s => tabSections[activeTab].includes(s))
                                .map((section) => renderSection(section))}
                            
                            {/* Empty State Logic for Tabs */}
                            {sectionsConfig.order.filter(s => tabSections[activeTab].includes(s) && sectionsConfig.visible[s]).length === 0 && (
                                <div className="py-24 flex flex-col items-center justify-center text-center border-2 border-dashed border-border/40 rounded-[40px] bg-muted/5">
                                    <Layers className="w-12 h-12 text-muted-foreground/20 mb-6" />
                                    <h3 className="text-xl font-black uppercase tracking-tight text-foreground/40">Fragment Missing</h3>
                                    <p className="text-sm text-muted-foreground italic mt-2">This archive sector is currently empty or private.</p>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

function StatRow({ label, value, primaryColor }: { label: string; value: string | number, primaryColor: string }) {
    return (
        <div className="flex justify-between items-end relative z-10">
            <span className="text-[13px] font-bold opacity-50">{label}</span>
            <div className="flex flex-col items-end">
                <span className="text-5xl font-black text-foreground leading-none">{value}</span>
                <div className="w-16 h-1.5 mt-3 rounded-full opacity-50" style={{ backgroundColor: primaryColor }} />
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
