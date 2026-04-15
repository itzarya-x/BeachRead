import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '../context/auth-context';
import { User, Settings, Lock, Bell, Shield, LogOut, Save, Loader2, CloudDownload, Upload, Plus } from 'lucide-react';
import { normalizeUsername } from '../lib/profileUsername';
import { sanitizeCoverUrl } from '../lib/image';
import { PasswordForm } from '../components/account/PasswordForm';
import { NotificationsPanel } from '../components/account/NotificationsPanel';
import { PrivacyPanel } from '../components/account/PrivacyPanel';
import { TrackingSyncPanel } from '../components/account/TrackingSyncPanel';
import { useLibrary } from '../hooks/useLibrary';
import { useCollections } from '../hooks/useCollections';
import type { ProfilePrivacyConfig, ProfileSectionsConfig, SectionId, SnapshotCardId, Character } from '../lib/types';

type SettingsTab = 'Profile' | 'Security' | 'Sync' | 'Notifications' | 'Privacy';

const DEFAULT_SECTION_ORDER: SectionId[] = [
    'now_reading',
    'snapshot',
    'stats',
    'featured_collections',
    'favorites',
    'starter_pack',
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

const SNAPSHOT_OPTIONS: Array<{ id: SnapshotCardId; label: string }> = [
    { id: 'archive_overview', label: 'Library Size' },
    { id: 'completion_ratio', label: 'Completion Rate' },
    { id: 'top_genre', label: 'Top Genre' },
    { id: 'reading_depth', label: 'Reading Depth' },
];

const THEME_PRESETS = [
    { name: 'Beach Classic', primary: '#F77F00', background: '#000000' },
    { name: 'Sakura', primary: '#FFB7C5', background: '#1A0F12' },
    { name: 'Nordic', primary: '#88C0D0', background: '#2E3440' },
    { name: 'Cyberpunk', primary: '#00FF9F', background: '#0D0221' },
    { name: 'Deep Sea', primary: '#00D1FF', background: '#001219' },
];

const SECTION_LABELS: Record<SectionId, string> = {
    now_reading: 'Now Reading Spotlight',
    snapshot: 'Snapshot Cards',
    stats: 'Statistics',
    featured_collections: 'Featured Collections',
    favorites: 'Favorites',
    starter_pack: 'Starter Pack',
    changelog: 'Public Changelog',
    archive: 'Archive Grid',
    characters: 'Favorite Characters',
};

export default function AccountSettings() {
    const { user, updateUser, uploadAvatar, logout } = useAuth();
    const { library } = useLibrary();
    const { collections } = useCollections();
    const [activeTab, setActiveTab] = useState<SettingsTab>('Profile');
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
    const [bannerUrl, setBannerUrl] = useState(user?.bannerUrl || '');
    const [location, setLocation] = useState(user?.location || '');
    const [website, setWebsite] = useState(user?.website || '');
    const [twitterHandle, setTwitterHandle] = useState(user?.twitterHandle || '');
    const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false);
    const [showStats, setShowStats] = useState(user?.showStats ?? true);
    const [primaryColor, setPrimaryColor] = useState(user?.customColors?.primary || '#F77F00');
    const [backgroundColor, setBackgroundColor] = useState(user?.customColors?.background || '#000000');
    const [profileSections, setProfileSections] = useState<ProfileSectionsConfig>(user?.profileSections || DEFAULT_PROFILE_SECTIONS);
    const [profilePrivacy, setProfilePrivacy] = useState<ProfilePrivacyConfig>(user?.profilePrivacy || DEFAULT_PROFILE_PRIVACY);
    const [featuredCollections, setFeaturedCollections] = useState<string[]>(user?.featuredCollections || []);
    const [snapshotCards, setSnapshotCards] = useState<SnapshotCardId[]>(user?.snapshotCards || ['archive_overview', 'completion_ratio', 'top_genre']);
    const [nowReadingId, setNowReadingId] = useState<string | null>(user?.nowReadingId || null);
    
    // Favorites & Pinned Management
    const [favoriteCharacters, setFavoriteCharacters] = useState<Character[]>(user?.favoriteCharacters || []);
    const [favoriteMangaOrder, setFavoriteMangaOrder] = useState<string[]>(user?.favoriteMangaOrder || []);
    const [pinnedMangaIds, setPinnedMangaIds] = useState<string[]>(user?.pinnedMangaIds || []);
    
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setDisplayName(user?.displayName || '');
        setUsername(user?.username || '');
        setBio(user?.bio || '');
        setAvatarUrl(user?.avatarUrl || '');
        setBannerUrl(user?.bannerUrl || '');
        setLocation(user?.location || '');
        setWebsite(user?.website || '');
        setTwitterHandle(user?.twitterHandle || '');
        setIsPrivate(user?.isPrivate || false);
        setShowStats(user?.showStats ?? true);
        setPrimaryColor(user?.customColors?.primary || '#F77F00');
        setBackgroundColor(user?.customColors?.background || '#000000');
        setProfileSections(user?.profileSections || DEFAULT_PROFILE_SECTIONS);
        setProfilePrivacy(user?.profilePrivacy || DEFAULT_PROFILE_PRIVACY);
        setFeaturedCollections(user?.featuredCollections || []);
        setSnapshotCards(user?.snapshotCards || ['archive_overview', 'completion_ratio', 'top_genre']);
        setNowReadingId(user?.nowReadingId || null);
        setFavoriteCharacters(user?.favoriteCharacters || []);
        setFavoriteMangaOrder(user?.favoriteMangaOrder || []);
        setPinnedMangaIds(user?.pinnedMangaIds || []);
    }, [user]);

    const curatedCollectionNames = useMemo(() => Array.from(
        new Set(
            [...collections.map((collection) => collection.name), ...library.flatMap((item) => item.customLists || [])]
                .map((name) => name.trim())
                .filter(Boolean)
        )
    ), [collections, library]);

    const readingCandidates = useMemo(() => library.filter((item) => item.status === 'READING'), [library]);
    const favoriteCandidates = useMemo(() => library.filter((item) => item.isFavourite), [library]);

    const togglePinnedManga = (id: string) => {
        setPinnedMangaIds((prev) => {
            if (prev.includes(id)) return prev.filter((pid) => pid !== id);
            if (prev.length >= 4) return prev;
            return [...prev, id];
        });
    };

    const applyThemePreset = (preset: typeof THEME_PRESETS[0]) => {
        setPrimaryColor(preset.primary);
        setBackgroundColor(preset.background);
    };

    const handleExportArchive = () => {
        const data = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            user: {
                displayName,
                username,
                bio,
                customColors: { primary: primaryColor, background: backgroundColor }
            },
            library: library.map(item => ({
                title: item.title,
                status: item.status,
                progress: item.progress,
                score: item.score,
                isFavourite: item.isFavourite,
                genres: item.genres,
                chapters: item.chapters
            }))
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `beachread-archive-${username || 'export'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportArchive = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLoading(true);
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (!data.library) throw new Error('Invalid archive format');
            // Simplified import logic for prototype
            alert(`Detected ${data.library.length} titles. Ready to sync with cloud.`);
        } catch (err) {
            setError('Failed to parse archive file');
        } finally {
            setLoading(false);
        }
    };

    const toggleSectionVisibility = (section: SectionId) => {
        setProfileSections((prev) => ({
            ...prev,
            visible: {
                ...prev.visible,
                [section]: !prev.visible[section],
            },
        }));
    };

    const moveSection = (section: SectionId, direction: 'up' | 'down') => {
        setProfileSections((prev) => {
            const order = [...prev.order];
            const index = order.indexOf(section);
            if (index === -1) return prev;
            const target = direction === 'up' ? index - 1 : index + 1;
            if (target < 0 || target >= order.length) return prev;
            [order[index], order[target]] = [order[target], order[index]];
            return { ...prev, order };
        });
    };

    const toggleFeaturedCollection = (name: string) => {
        setFeaturedCollections((prev) => {
            if (prev.includes(name)) return prev.filter((entry) => entry !== name);
            if (prev.length >= 6) return prev;
            return [...prev, name];
        });
    };

    const toggleSnapshotCard = (cardId: SnapshotCardId) => {
        setSnapshotCards((prev) => {
            if (prev.includes(cardId)) {
                if (prev.length === 1) return prev;
                return prev.filter((id) => id !== cardId);
            }
            if (prev.length >= 4) return prev;
            return [...prev, cardId];
        });
    };

    const handleUpdateProfile = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setSuccess(false);
        setError(null);

        try {
            await updateUser({
                displayName: displayName.trim(),
                username: normalizeUsername(username, user?.email || 'beachreader'),
                bio: bio.trim(),
                avatarUrl: avatarUrl.trim(),
                bannerUrl: bannerUrl.trim(),
                location: location.trim(),
                website: website.trim(),
                twitterHandle: twitterHandle.trim(),
                isPrivate,
                showStats,
                customColors: {
                    primary: primaryColor,
                    background: backgroundColor,
                },
                profileSections,
                profilePrivacy,
                featuredCollections,
                snapshotCards,
                nowReadingId,
                favoriteCharacters,
                favoriteMangaOrder,
                pinnedMangaIds,
            });
            setSuccess(true);
        } catch (err) {
            console.error('Failed to update profile:', err);
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };


    const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        setSuccess(false);
        setError(null);

        try {
            const nextAvatarUrl = await uploadAvatar(file);
            setAvatarUrl(nextAvatarUrl);
            setSuccess(true);
        } catch (err) {
            console.error('Failed to upload avatar:', err);
            setError(err instanceof Error ? err.message : 'Failed to upload avatar');
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    if (!user) return null;

    return (
        <div className="w-full max-w-[1000px] mx-auto pt-[120px] px-6 pb-20">
            <div className="flex items-center gap-4 mb-12">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Settings size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Settings</h1>
                    <p className="text-muted-foreground text-sm font-medium">Manage your archive profile and preferences</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                <div className="lg:col-span-1 space-y-2">
                    {[
                        { icon: User, label: 'Profile' as SettingsTab },
                        { icon: Lock, label: 'Security' as SettingsTab },
                        { icon: CloudDownload, label: 'Sync' as SettingsTab },
                        { icon: Bell, label: 'Notifications' as SettingsTab },
                        { icon: Shield, label: 'Privacy' as SettingsTab },
                    ].map((tab) => (
                        <button
                            key={tab.label}
                            onClick={() => setActiveTab(tab.label)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeTab === tab.label
                                    ? 'bg-foreground text-background shadow-lg'
                                    : 'text-muted-foreground hover:bg-foreground/5'
                            }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                    <div className="pt-4 mt-4 border-t border-border/50">
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-destructive hover:bg-destructive/5 transition-all"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </div>

                <div className="lg:col-span-3 space-y-8">
                    {activeTab === 'Profile' && (
                        <section className="bg-muted/20 border border-border/40 rounded-[24px] p-8">
                            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8">Public Profile</h2>

                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="flex flex-col gap-5 rounded-[28px] border border-border/50 bg-background/60 p-5 md:flex-row md:items-center">
                                    <div className="h-24 w-24 overflow-hidden rounded-[28px] border border-border/50 bg-muted/40">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt={displayName || user.email} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-2xl font-black text-muted-foreground">
                                                {(displayName || user.email).charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Profile Photo</p>
                                            <p className="mt-2 text-sm text-muted-foreground">Upload an avatar or paste an image URL. This photo is used in the navbar and public profile.</p>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/png,image/jpeg,image/webp,image/gif"
                                                onChange={handleAvatarFileChange}
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploadingAvatar}
                                                className="inline-flex h-[44px] items-center justify-center gap-2 rounded-xl border border-border/60 px-5 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-foreground/5 disabled:opacity-60"
                                            >
                                                {uploadingAvatar ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                                {uploadingAvatar ? 'Uploading' : 'Upload Photo'}
                                            </button>
                                            <input
                                                type="url"
                                                value={avatarUrl}
                                                onChange={(e) => setAvatarUrl(e.target.value)}
                                                className="h-[44px] min-w-[260px] flex-1 rounded-xl border border-border/60 bg-background px-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                                                placeholder="Or paste an avatar image URL"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Display Name</label>
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full h-[52px] bg-background border border-border/60 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                                        placeholder="Your Name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Username</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full h-[52px] bg-background border border-border/60 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                                        placeholder="your-handle"
                                    />
                                    <p className="text-[11px] text-muted-foreground">Public URL: `/u/{normalizeUsername(username || user.email, user.email)}`</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email (Immutable)</label>
                                    <input
                                        type="email"
                                        value={user.email}
                                        disabled
                                        className="w-full h-[52px] bg-muted/50 border border-border/30 rounded-xl px-4 text-sm text-muted-foreground cursor-not-allowed"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Banner Image URL</label>
                                    <input
                                        type="url"
                                        value={bannerUrl}
                                        onChange={(e) => setBannerUrl(e.target.value)}
                                        className="w-full h-[52px] bg-background border border-border/60 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                                        placeholder="https://example.com/banner.jpg"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Location</label>
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="w-full h-[52px] bg-background border border-border/60 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                                            placeholder="Tokyo, Japan"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Website</label>
                                        <input
                                            type="url"
                                            value={website}
                                            onChange={(e) => setWebsite(e.target.value)}
                                            className="w-full h-[52px] bg-background border border-border/60 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                                            placeholder="https://yourwebsite.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Twitter (X) Handle</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">@</span>
                                        <input
                                            type="text"
                                            value={twitterHandle}
                                            onChange={(e) => setTwitterHandle(e.target.value)}
                                            className="w-full h-[52px] bg-background border border-border/60 rounded-xl pl-8 pr-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                                            placeholder="username"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Bio</label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        className="w-full min-h-[100px] bg-background border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors resize-y"
                                        placeholder="Tell the archive about your reading taste..."
                                    />
                                </div>

                                <div className="space-y-4 pt-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Theme Presets</label>
                                    <div className="flex flex-wrap gap-2">
                                        {THEME_PRESETS.map((preset) => (
                                            <button
                                                key={preset.name}
                                                type="button"
                                                onClick={() => applyThemePreset(preset)}
                                                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/40 bg-background hover:bg-foreground/5 transition-all group"
                                            >
                                                <div 
                                                    className="w-3 h-3 rounded-full border border-white/20" 
                                                    style={{ backgroundColor: preset.primary }} 
                                                />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{preset.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                        <div className="flex items-center gap-4 p-4 bg-background/40 border border-border/40 rounded-2xl">
                                            <input
                                                type="color"
                                                value={primaryColor}
                                                onChange={(e) => setPrimaryColor(e.target.value)}
                                                className="h-10 w-10 border-none bg-transparent cursor-pointer"
                                            />
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Primary Accent</p>
                                                <p className="text-[11px] text-muted-foreground">{primaryColor.toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-4 bg-background/40 border border-border/40 rounded-2xl">
                                            <input
                                                type="color"
                                                value={backgroundColor}
                                                onChange={(e) => setBackgroundColor(e.target.value)}
                                                className="h-10 w-10 border-none bg-transparent cursor-pointer"
                                            />
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Snapshot BG</p>
                                                <p className="text-[11px] text-muted-foreground">{backgroundColor.toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>


                                <div className="flex flex-col gap-6 pt-2">
                                    <div className="flex items-center justify-between p-4 bg-background/40 border border-border/40 rounded-2xl">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-foreground">Private Profile</p>
                                            <p className="text-[11px] text-muted-foreground mt-1">Hide your profile from public search and non-followers.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsPrivate(!isPrivate)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isPrivate ? 'bg-primary' : 'bg-muted'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPrivate ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-background/40 border border-border/40 rounded-2xl">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-foreground">Show Statistics</p>
                                            <p className="text-[11px] text-muted-foreground mt-1">Display your reading stats and genre breakdown on your profile.</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowStats(!showStats)}
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showStats ? 'bg-primary' : 'bg-muted'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showStats ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Public Sections Visibility</label>
                                    <div className="space-y-2 rounded-2xl border border-border/40 bg-background/40 p-4">
                                        {profileSections.order.filter(section => section !== 'favorites' && section !== 'characters').map((section, index, filteredOrder) => (
                                            <div key={section} className="flex items-center justify-between gap-3 rounded-xl border border-border/30 bg-background/70 px-3 py-2">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSectionVisibility(section)}
                                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${profileSections.visible[section] ? 'bg-primary' : 'bg-muted'}`}
                                                    >
                                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${profileSections.visible[section] ? 'translate-x-5' : 'translate-x-1'}`} />
                                                    </button>
                                                    <span className="text-[11px] font-black uppercase tracking-wider text-foreground">{SECTION_LABELS[section]}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={index === 0}
                                                        onClick={() => moveSection(section, 'up')}
                                                        className="h-7 w-7 rounded-lg border border-border/50 text-xs font-black text-foreground disabled:opacity-30"
                                                    >
                                                        ↑
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={index === filteredOrder.length - 1}
                                                        onClick={() => moveSection(section, 'down')}
                                                        className="h-7 w-7 rounded-lg border border-border/50 text-xs font-black text-foreground disabled:opacity-30"
                                                    >
                                                        ↓
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Pinned Favorites (Starter Pack - up to 4)</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-2xl border border-border/40 bg-background/40 p-4">
                                        {favoriteCandidates.map((manga) => {
                                            const active = pinnedMangaIds.includes(manga.id);
                                            const atLimit = !active && pinnedMangaIds.length >= 4;
                                            return (
                                                <button
                                                    key={manga.id}
                                                    type="button"
                                                    onClick={() => togglePinnedManga(manga.id)}
                                                    disabled={atLimit}
                                                    className={`group relative aspect-[3/4] overflow-hidden rounded-xl border transition-all ${
                                                        active ? 'border-primary ring-2 ring-primary/20' : 'border-border/40 opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                                                    } disabled:opacity-20`}
                                                >
                                                    <img src={sanitizeCoverUrl(manga.coverUrl)} className="w-full h-full object-cover" alt="" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Plus className={`w-6 h-6 text-white ${active ? 'rotate-45' : ''}`} />
                                                    </div>
                                                </button>
                                            );
                                        })}
                                        {favoriteCandidates.length === 0 && (
                                            <p className="col-span-full text-center py-4 text-[11px] text-muted-foreground italic">Add some manga to your favorites first.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Data Portability</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={handleExportArchive}
                                            className="flex items-center justify-between p-4 bg-background/40 border border-border/40 rounded-2xl hover:bg-foreground/5 transition-colors text-left"
                                        >
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-widest text-foreground">Export Archive</p>
                                                <p className="text-[10px] text-muted-foreground mt-1">Download your library as JSON.</p>
                                            </div>
                                            <CloudDownload className="text-primary" size={20} />
                                        </button>
                                        
                                        <div className="relative">
                                            <input
                                                ref={importInputRef}
                                                type="file"
                                                accept=".json"
                                                onChange={handleImportArchive}
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => importInputRef.current?.click()}
                                                className="w-full flex items-center justify-between p-4 bg-background/40 border border-border/40 rounded-2xl hover:bg-foreground/5 transition-colors text-left"
                                            >
                                                <div>
                                                    <p className="text-xs font-black uppercase tracking-widest text-foreground">Import Archive</p>
                                                    <p className="text-[10px] text-muted-foreground mt-1">Restore from a JSON backup.</p>
                                                </div>
                                                <Upload className="text-primary" size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Featured Collections (up to 6)</label>
                                    <div className="flex flex-wrap gap-2 rounded-2xl border border-border/40 bg-background/40 p-4">
                                        {curatedCollectionNames.length ? curatedCollectionNames.map((name) => {
                                            const active = featuredCollections.includes(name);
                                            const atLimit = !active && featuredCollections.length >= 6;
                                            return (
                                                <button
                                                    key={name}
                                                    type="button"
                                                    onClick={() => toggleFeaturedCollection(name)}
                                                    disabled={atLimit}
                                                    className={`rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-colors ${
                                                        active
                                                            ? 'border-primary/40 bg-primary/10 text-primary'
                                                            : 'border-border/50 bg-background text-muted-foreground hover:text-foreground'
                                                    } disabled:opacity-40`}
                                                >
                                                    {name}
                                                </button>
                                            );
                                        }) : (
                                            <p className="text-[11px] text-muted-foreground">Create a collection or add custom lists first.</p>
                                        )}
                                    </div>
                                </div>



                                <div className="space-y-4 pt-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Snapshot Cards (1 to 4)</label>
                                    <div className="flex flex-wrap gap-2 rounded-2xl border border-border/40 bg-background/40 p-4">
                                        {SNAPSHOT_OPTIONS.map((option) => {
                                            const active = snapshotCards.includes(option.id);
                                            const atLimit = !active && snapshotCards.length >= 4;
                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() => toggleSnapshotCard(option.id)}
                                                    disabled={atLimit}
                                                    className={`rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-colors ${
                                                        active
                                                            ? 'border-primary/40 bg-primary/10 text-primary'
                                                            : 'border-border/50 bg-background text-muted-foreground hover:text-foreground'
                                                    } disabled:opacity-40`}
                                                >
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Now Reading Spotlight</label>
                                    <select
                                        value={nowReadingId || ''}
                                        onChange={(e) => setNowReadingId(e.target.value || null)}
                                        className="w-full h-[52px] bg-background border border-border/60 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                                    >
                                        <option value="">None</option>
                                        {readingCandidates.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-4 pt-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Public Privacy Granularity</label>
                                    <div className="space-y-3 rounded-2xl border border-border/40 bg-background/40 p-4">
                                        <ToggleRow
                                            label="Show Scores"
                                            value={profilePrivacy.showScores}
                                            onToggle={() => setProfilePrivacy((prev) => ({ ...prev, showScores: !prev.showScores }))}
                                        />
                                        <ToggleRow
                                            label="Show Progress"
                                            value={profilePrivacy.showProgress}
                                            onToggle={() => setProfilePrivacy((prev) => ({ ...prev, showProgress: !prev.showProgress }))}
                                        />
                                        <ToggleRow
                                            label="Show Dropped & Paused"
                                            value={profilePrivacy.showDroppedPaused}
                                            onToggle={() => setProfilePrivacy((prev) => ({ ...prev, showDroppedPaused: !prev.showDroppedPaused }))}
                                        />
                                        <ToggleRow
                                            label="Hide Adult Content Tags"
                                            value={profilePrivacy.hideAdultContent}
                                            onToggle={() => setProfilePrivacy((prev) => ({ ...prev, hideAdultContent: !prev.hideAdultContent }))}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex items-center gap-4">
                                    <button
                                        type="submit"
                                        disabled={loading || uploadingAvatar}
                                        className="px-8 h-[48px] bg-foreground text-background font-black uppercase tracking-widest text-[10px] rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                        Save Changes
                                    </button>
                                    {success && (
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Updated Successfully</span>
                                    )}
                                    {error && (
                                        <span className="text-[10px] font-black uppercase tracking-widest text-destructive">{error}</span>
                                    )}
                                </div>
                            </form>
                        </section>
                    )}

                    {activeTab === 'Security' && <PasswordForm />}
                    {activeTab === 'Sync' && <TrackingSyncPanel />}
                    {activeTab === 'Notifications' && <NotificationsPanel />}
                    {activeTab === 'Privacy' && <PrivacyPanel />}
                </div>
            </div>
        </div>
    );
}

function ToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
    return (
        <div className="flex items-center justify-between rounded-xl border border-border/30 bg-background/70 px-3 py-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-foreground">{label}</p>
            <button
                type="button"
                onClick={onToggle}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${value ? 'bg-primary' : 'bg-muted'}`}
            >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
        </div>
    );
}
