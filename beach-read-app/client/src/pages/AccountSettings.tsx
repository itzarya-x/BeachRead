import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../features/auth/context/auth-context';
import {
    User, Lock, Shield, LogOut, Save, Loader2,
    Upload, Wind, Palette, ChevronRight,
    Check, Eye, EyeOff, Mail, MapPin, Link as LinkIcon
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '../app/providers/ToastContext';
import type { SectionId } from '../shared/types/types';
import { TrackingSyncPanel } from '../features/library/components/TrackingSyncPanel';
import { SettingRow, FieldInput, Toggle } from '../shared/ui/Form';
import { Button } from '../shared/ui/Button';
import { Surface } from '../shared/ui/Surface';
import { sanitizeCoverUrl } from '../shared/utils/image';

type TabId = 'profile' | 'preferences' | 'security' | 'integrations';

/* ─── Shared sub-components ──────────────────────────────────────── */

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div className="pb-6 border-b border-border/10 mb-2">
            <h3 className="text-2xl font-serif italic text-foreground">{title}</h3>
            {subtitle && <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-1">{subtitle}</p>}
        </div>
    );
}

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
    return (
        <div className="pt-8 flex justify-end">
            <Button
                onClick={onClick}
                disabled={saving}
                variant="primary"
                size="lg"
                className="rounded-full shadow-lg"
            >
                {saving ? <Loader2 size={15} className="animate-spin mr-3" /> : <Save size={15} className="mr-3" />}
                Preserve Changes
            </Button>
        </div>
    );
}

/* ─── Main component ─────────────────────────────────────────────── */

export default function AccountSettings() {
    const { user, updateUser, uploadAvatar, uploadBanner, logout } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<TabId>('profile');
    const [isSaving, setIsSaving] = useState(false);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });

    const [formData, setFormData] = useState({
        displayName: user?.displayName || '',
        username: user?.username || '',
        bio: user?.bio || '',
        location: user?.location || '',
        website: user?.website || '',
        isPrivate: user?.isPrivate || false,
    });

    const [preferences, setPreferences] = useState<any>(user?.preferences || {
        theme: 'light',
        language: 'en',
        notifications: true,
        releaseAlerts: true,
        titleLanguage: 'ROMAJI',
        globalMediaFilter: 'ALL',
    });

    const [sections, setSections] = useState(user?.profileSections || {
        visible: {
            stats: true, snapshot: true, now_reading: true,
            featured_collections: true, favorites: true,
            starter_pack: true, changelog: true, archive: true, characters: true
        },
        order: ['now_reading', 'changelog', 'favorites', 'archive'] as SectionId[]
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user) {
            setFormData({
                displayName: user.displayName || '',
                username: user.username || '',
                bio: user.bio || '',
                location: user.location || '',
                website: user.website || '',
                isPrivate: user.isPrivate || false,
            });
            setPreferences(user.preferences || {
                theme: 'light', language: 'en', notifications: true,
                releaseAlerts: true, titleLanguage: 'ROMAJI', globalMediaFilter: 'ALL'
            });
            if (user.profileSections) setSections(user.profileSections);
        }
    }, [user]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateUser({ ...formData, profileSections: sections, preferences });
            showToast('Sanctuary settings updated', 'success');
        } catch {
            showToast('Failed to update settings', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setIsSaving(true);
            await uploadAvatar(file);
            showToast('Portrait updated', 'success');
        } catch {
            showToast('Failed to upload portrait', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setIsSaving(true);
            await uploadBanner(file);
            showToast('Sanctuary cover updated', 'success');
        } catch {
            showToast('Failed to upload cover', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const SECTION_LABELS: Record<string, string> = {
        stats: 'Stats Bar', snapshot: 'Snapshot', now_reading: 'Now Reading',
        featured_collections: 'Collections', favorites: 'Favourites',
        starter_pack: 'Starter Pack', changelog: 'Changelog',
        archive: 'Archive', characters: 'Characters'
    };

    const navItems: { id: TabId; label: string; icon: React.ElementType; hint: string }[] = [
        { id: 'profile', label: 'Profile', icon: User, hint: 'Identity & portrait' },
        { id: 'preferences', label: 'Preferences', icon: Palette, hint: 'Display & reading' },
        { id: 'security', label: 'Security', icon: Lock, hint: 'Password & access' },
        { id: 'integrations', label: 'Integrations', icon: Shield, hint: 'External sources' },
    ];

    return (
        <div className="min-h-screen bg-[#faf9f6] pb-24 selection:bg-[#8b7e74] selection:text-white relative pt-24">
            {/* Paper texture */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]"
                style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/natural-paper.png")' }}
            />

            <div className="max-w-[1400px] mx-auto px-8 md:px-[64px] pt-12 relative z-10">

                {/* Page header */}
                <div className="mb-12 border-b border-[#e5e1da] pb-10">
                    <div className="flex items-center gap-3 text-[#8b7e74] mb-4">
                        <Wind className="w-4 h-4 opacity-60" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Sanctuary Configuration</span>
                    </div>
                    <h1 className="text-6xl md:text-7xl font-serif italic text-[#4a443f] tracking-tight leading-none">
                        Settings
                    </h1>
                </div>

                {/* Layout: sticky sidebar + panel */}
                <div className="flex flex-col lg:flex-row gap-12">

                    {/* ── Sidebar ── */}
                    <aside className="lg:w-[260px] shrink-0">
                        <div className="lg:sticky lg:top-[88px] space-y-1">
                            {navItems.map(({ id, label, icon: Icon, hint }) => (
                                <motion.button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-left group ${activeTab === id
                                        ? 'bg-white border border-[#e5e1da] shadow-sm text-[#4a443f]'
                                        : 'text-[#8b7e74] hover:bg-white/60 hover:text-[#4a443f]'
                                        }`}
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${activeTab === id ? 'bg-[#f5f2ed]' : 'bg-transparent group-hover:bg-[#f5f2ed]'
                                        }`}>
                                        <Icon size={16} className={activeTab === id ? 'text-[#8b7e74]' : 'opacity-50'} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[11px] font-bold uppercase tracking-widest leading-none ${activeTab === id ? '' : 'opacity-70'}`}>{label}</p>
                                        <p className="text-[9px] font-serif italic text-[#8b7e74]/60 mt-0.5 leading-none">{hint}</p>
                                    </div>
                                    {activeTab === id && <ChevronRight size={14} className="text-[#8b7e74]/40 shrink-0" />}
                                </motion.button>
                            ))}

                            <div className="pt-6 border-t border-[#e5e1da] mt-6">
                                <button
                                    onClick={() => logout()}
                                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-400 hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100"
                                >
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-red-50">
                                        <LogOut size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-widest leading-none">Sign Out</p>
                                        <p className="text-[9px] font-serif italic text-red-300 mt-0.5 leading-none">Dissolve this session</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* ── Content panel ── */}
                    <main className="flex-1 min-w-0">
                        <Surface variant="paper" className="p-10 md:p-14">

                            {/* ── PROFILE ── */}
                            {activeTab === 'profile' && (
                                <div className="space-y-0 animate-in fade-in duration-500">
                                    <SectionHeading title="Sanctuary Profile" subtitle="Your public identity" />

                                    {/* Avatar */}
                                    <div className="py-8 border-b border-border/10 flex flex-col sm:flex-row items-start gap-8">
                                        <div className="relative group shrink-0">
                                            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-background shadow-lg">
                                                {user?.avatarUrl ? (
                                                    <img 
                                                        src={sanitizeCoverUrl(user.avatarUrl)} 
                                                        alt="avatar" 
                                                        referrerPolicy="no-referrer"
                                                        className="w-full h-full object-cover" 
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-muted/20 flex items-center justify-center">
                                                        <User size={36} className="text-muted-foreground opacity-40" />
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                aria-label="Upload Portrait"
                                                className="absolute bottom-0 right-0 p-2.5 bg-primary text-white rounded-full shadow-lg hover:bg-primary/80 transition-all"
                                            >
                                                <Upload size={14} />
                                            </button>
                                            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-lg font-serif italic text-foreground">{formData.displayName || 'Your Name'}</p>
                                            <p className="text-[10px] font-mono text-muted-foreground">@{formData.username || 'username'}</p>
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
                                            >
                                                Change Portrait
                                            </button>
                                            <p className="text-[8px] font-serif italic text-muted-foreground/60 mt-1">Supports animated GIFs.</p>
                                        </div>
                                    </div>

                                    {/* Banner */}
                                    <div className="py-8 border-b border-border/10">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground mb-4">Sanctuary Cover</p>
                                        <div 
                                            className="relative w-full h-32 rounded-2xl bg-muted/20 overflow-hidden border border-border/40 group shadow-inner"
                                            style={{
                                                backgroundImage: user?.bannerUrl ? `url(${sanitizeCoverUrl(user.bannerUrl)})` : 'none',
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center',
                                            }}
                                        >
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button
                                                    onClick={() => bannerInputRef.current?.click()}
                                                    variant="secondary"
                                                    size="sm"
                                                    className="rounded-full bg-white/90 backdrop-blur-sm text-foreground hover:bg-white"
                                                >
                                                    <Upload size={14} className="mr-2" /> Change Cover
                                                </Button>
                                            </div>
                                            {!user?.bannerUrl && (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Wind size={24} className="text-muted-foreground opacity-20" />
                                                </div>
                                            )}
                                            <input type="file" ref={bannerInputRef} onChange={handleBannerUpload} className="hidden" accept="image/*" />
                                        </div>
                                        <p className="text-[9px] font-serif italic text-muted-foreground mt-3">Recommended size: 1200x400px. Supports animated GIFs.</p>
                                    </div>

                                    <SettingRow label="Display Name" hint="Your visible name across Beach Read">
                                        <FieldInput value={formData.displayName} onChange={(e) => setFormData({ ...formData, displayName: e.target.value })} placeholder="e.g. Arya" icon={User} />
                                    </SettingRow>

                                    <SettingRow label="Username" hint="Unique handle for your public profile">
                                        <FieldInput value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder="e.g. itzarya" mono icon={Mail} />
                                    </SettingRow>

                                    <SettingRow label="Aura · Bio" hint="A brief preface to your archive">
                                        <textarea
                                            rows={3}
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            placeholder="Write the preface of your journey..."
                                            className="w-full bg-foreground/[0.02] border border-border/40 rounded-2xl px-5 py-3 text-sm font-serif italic text-foreground focus:border-primary/40 outline-none transition-all resize-none placeholder:text-muted-foreground/40"
                                        />
                                        <p className="text-[9px] text-muted-foreground/50 font-mono mt-1 text-right">{formData.bio.length} / 200</p>
                                    </SettingRow>

                                    <SettingRow label="Location" hint="Optional, shown on public profile">
                                        <FieldInput value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Mumbai, India" icon={MapPin} />
                                    </SettingRow>

                                    <SettingRow label="Website" hint="Personal link or social handle">
                                        <FieldInput value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://your-site.com" icon={LinkIcon} />
                                    </SettingRow>

                                    <SettingRow label="Privacy" hint="Control who can view your sanctuary">
                                        <Toggle
                                            enabled={formData.isPrivate}
                                            onChange={() => setFormData({ ...formData, isPrivate: !formData.isPrivate })}
                                            label="Private Sanctuary"
                                            hint="Only you can view your full archive"
                                        />
                                    </SettingRow>

                                    <SaveButton onClick={handleSave} saving={isSaving} />
                                </div>
                            )}

                            {/* ── PREFERENCES ── */}
                            {activeTab === 'preferences' && (
                                <div className="space-y-0 animate-in fade-in duration-500">
                                    <SectionHeading title="Preferences" subtitle="Display, reading & discovery" />

                                    <SettingRow label="Title Language" hint="How manga/anime titles are displayed throughout the app">
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { value: 'ROMAJI', label: 'Romaji', sub: 'Standard' },
                                                { value: 'ENGLISH', label: 'English', sub: 'Localised' },
                                                { value: 'NATIVE', label: 'Native', sub: 'Original' },
                                            ].map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setPreferences({ ...preferences, titleLanguage: opt.value })}
                                                    className={`flex flex-col items-center py-3 px-2 rounded-2xl border transition-all ${preferences.titleLanguage === opt.value
                                                        ? 'bg-foreground border-foreground text-background'
                                                        : 'bg-foreground/[0.02] border-border/40 text-muted-foreground hover:border-primary/50'
                                                        }`}
                                                >
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{opt.label}</span>
                                                    <span className={`text-[8px] font-serif italic mt-0.5 ${preferences.titleLanguage === opt.value ? 'opacity-90' : 'text-muted-foreground/80'}`}>{opt.sub}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </SettingRow>

                                    <SettingRow label="Default Viewport" hint="Filter applied globally across Discover and Home">
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { value: 'ALL', label: 'All', sub: 'Universal' },
                                                { value: 'MANGA', label: 'Manga', sub: 'Literature' },
                                                { value: 'ANIME', label: 'Anime', sub: 'Cinematic' },
                                            ].map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setPreferences({ ...preferences, globalMediaFilter: opt.value })}
                                                    className={`flex flex-col items-center py-3 px-2 rounded-2xl border transition-all ${preferences.globalMediaFilter === opt.value
                                                        ? 'bg-primary border-primary text-white'
                                                        : 'bg-foreground/[0.02] border-border/40 text-muted-foreground hover:border-primary/50'
                                                        }`}
                                                >
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{opt.label}</span>
                                                    <span className={`text-[8px] font-serif italic mt-0.5 ${preferences.globalMediaFilter === opt.value ? 'opacity-100' : 'text-muted-foreground/80'}`}>{opt.sub}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </SettingRow>

                                    <SettingRow label="Notifications" hint="Global notification delivery">
                                        <div className="space-y-3">
                                            <Toggle enabled={preferences.notifications} onChange={() => setPreferences({ ...preferences, notifications: !preferences.notifications })} label="Push Notifications" hint="Alerts for updates and echoes" />
                                            <Toggle enabled={preferences.releaseAlerts} onChange={() => setPreferences({ ...preferences, releaseAlerts: !preferences.releaseAlerts })} label="Release Alerts" hint="New chapters from your reading list" />
                                        </div>
                                    </SettingRow>

                                    {/* Tactile Customization */}
                                    <div className="pt-10 pb-6 border-b border-border/10">
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">Tactile Atmosphere</h4>
                                        <p className="text-[10px] text-muted-foreground mt-1 font-serif italic">Personalize the sensory experience of your sanctuary</p>
                                    </div>

                                    <SettingRow label="Font Choice" hint="The literary voice of your archive">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {[
                                                { value: 'serif', label: 'Serif', sub: 'Elegant' },
                                                { value: 'sans', label: 'Sans', sub: 'Modern' },
                                                { value: 'mono', label: 'Mono', sub: 'Technical' },
                                                { value: 'handwritten', label: 'Script', sub: 'Intimate' },
                                            ].map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setPreferences({ ...preferences, fontStyle: opt.value })}
                                                    className={`flex flex-col items-center py-4 px-2 rounded-2xl border transition-all ${preferences.fontStyle === opt.value
                                                        ? 'bg-foreground border-foreground text-background'
                                                        : 'bg-foreground/[0.02] border-border/40 text-muted-foreground hover:border-primary/50'
                                                        }`}
                                                >
                                                    <span className={`text-sm font-bold ${opt.value === 'serif' ? 'font-serif' : opt.value === 'mono' ? 'font-mono' : ''}`}>{opt.label}</span>
                                                    <span className={`text-[8px] uppercase tracking-widest mt-1 ${preferences.fontStyle === opt.value ? 'opacity-90' : 'text-muted-foreground/80'}`}>{opt.sub}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </SettingRow>

                                    <SettingRow label="Paper Texture" hint="The physical feel of your digital pages">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {[
                                                { value: 'clean', label: 'Clean', sub: 'Minimal' },
                                                { value: 'aged', label: 'Aged', sub: 'Vintage' },
                                                { value: 'dark', label: 'Dark', sub: 'Parchment' },
                                                { value: 'none', label: 'None', sub: 'Digital' },
                                            ].map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setPreferences({ ...preferences, paperTexture: opt.value })}
                                                    className={`flex flex-col items-center py-4 px-2 rounded-2xl border transition-all ${preferences.paperTexture === opt.value
                                                        ? 'bg-primary border-primary text-white'
                                                        : 'bg-foreground/[0.02] border-border/40 text-muted-foreground hover:border-primary/50'
                                                        }`}
                                                >
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{opt.label}</span>
                                                    <span className={`text-[8px] font-serif italic mt-0.5 ${preferences.paperTexture === opt.value ? 'opacity-100' : 'text-muted-foreground/80'}`}>{opt.sub}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </SettingRow>

                                    <SettingRow label="Atmosphere" hint="Subtle environmental effects">
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {[
                                                { value: 'none', label: 'Still', icon: EyeOff },
                                                { value: 'rain', label: 'Rain', icon: Wind },
                                                { value: 'petals', label: 'Petals', icon: Wind },
                                                { value: 'dust', label: 'Dust', icon: Wind },
                                            ].map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setPreferences({ ...preferences, atmosphere: opt.value })}
                                                    className={`flex flex-col items-center py-4 px-2 rounded-2xl border transition-all ${preferences.atmosphere === opt.value
                                                        ? 'bg-foreground border-foreground text-background'
                                                        : 'bg-foreground/[0.02] border-border/40 text-muted-foreground hover:border-primary/50'
                                                        }`}
                                                >
                                                    <opt.icon size={16} className="mb-2 opacity-60" />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </SettingRow>

                                    {/* Profile section visibility */}
                                    <div className="py-8 border-b border-border/10">
                                        <div className="mb-6">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">Profile Layout</p>
                                            <p className="text-[10px] font-serif italic text-muted-foreground mt-1">Choose which sections appear on your public profile</p>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {Object.entries(sections.visible).map(([id, isVisible]) => (
                                                <button
                                                    key={id}
                                                    onClick={() => setSections({ ...sections, visible: { ...sections.visible, [id]: !isVisible } })}
                                                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${isVisible
                                                        ? 'bg-muted/30 border-primary/20 text-foreground'
                                                        : 'bg-foreground/[0.02] border-border/40 text-muted-foreground/40 hover:border-primary/20'
                                                        }`}
                                                >
                                                    <span className="text-[9px] font-bold uppercase tracking-widest">{SECTION_LABELS[id] || id}</span>
                                                    {isVisible
                                                        ? <Check size={12} className="text-primary" />
                                                        : <div className="w-3 h-3 rounded-full border border-border" />
                                                    }
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <SaveButton onClick={handleSave} saving={isSaving} />
                                </div>
                            )}

                            {/* ── SECURITY ── */}
                            {activeTab === 'security' && (
                                <div className="space-y-0 animate-in fade-in duration-500">
                                    <SectionHeading title="Security & Access" subtitle="Password and session management" />

                                    <SettingRow label="Email" hint="Your account email — contact support to change">
                                        <div className="flex items-center gap-3 px-5 py-3 bg-muted/20 border border-border/40 rounded-2xl text-sm font-mono text-muted-foreground">
                                            <Mail size={14} className="shrink-0 opacity-50" />
                                            {user?.email || 'user@example.com'}
                                        </div>
                                    </SettingRow>

                                    <SettingRow label="Change Password" hint="Minimum 8 characters">
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <input
                                                    type={showCurrentPw ? 'text' : 'password'}
                                                    value={pwForm.current}
                                                    onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
                                                    placeholder="Current password"
                                                    className="w-full bg-foreground/[0.02] border border-border/40 rounded-2xl pl-5 pr-11 py-3 text-sm font-mono text-foreground focus:border-primary/40 outline-none transition-all placeholder:text-muted-foreground/40"
                                                />
                                                <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors">
                                                    {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type={showNewPw ? 'text' : 'password'}
                                                    value={pwForm.next}
                                                    onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })}
                                                    placeholder="New password"
                                                    className="w-full bg-foreground/[0.02] border border-border/40 rounded-2xl pl-5 pr-11 py-3 text-sm font-mono text-foreground focus:border-primary/40 outline-none transition-all placeholder:text-muted-foreground/40"
                                                />
                                                <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors">
                                                    {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                            <input
                                                type="password"
                                                value={pwForm.confirm}
                                                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                                                placeholder="Confirm new password"
                                                className="w-full bg-foreground/[0.02] border border-border/40 rounded-2xl px-5 py-3 text-sm font-mono text-foreground focus:border-primary/40 outline-none transition-all placeholder:text-muted-foreground/40"
                                            />
                                            <Button
                                                onClick={() => {}}
                                                disabled={!pwForm.current || pwForm.next !== pwForm.confirm || pwForm.next.length < 8}
                                                variant="archival"
                                                className="mt-1"
                                            >
                                                <Lock size={13} className="mr-3" /> Update Password
                                            </Button>
                                            {pwForm.next && pwForm.confirm && pwForm.next !== pwForm.confirm && (
                                                <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Passwords do not match</p>
                                            )}
                                        </div>
                                    </SettingRow>

                                    <SettingRow label="Active Sessions" hint="Devices currently signed into your account">
                                        <div className="p-5 rounded-2xl bg-foreground/[0.02] border border-border/40 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[11px] font-bold uppercase tracking-widest text-foreground">This device</p>
                                                    <p className="text-[9px] font-serif italic text-muted-foreground mt-0.5">Active now · Web Browser</p>
                                                </div>
                                                <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Current
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => showToast('All other sessions terminated', 'success')}
                                                className="w-full py-2.5 border border-red-200 text-red-400 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-all"
                                            >
                                                Revoke All Other Sessions
                                            </button>
                                        </div>
                                    </SettingRow>

                                    <SettingRow label="Danger Zone" hint="Irreversible actions">
                                        <div className="p-5 rounded-2xl border border-red-100 bg-red-50/30 space-y-3">
                                            <p className="text-[10px] font-serif italic text-muted-foreground leading-relaxed">
                                                Deleting your account will permanently remove all archive data, notes, and collections. This action cannot be undone.
                                            </p>
                                            <button className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 hover:underline transition-colors">
                                                Request Account Deletion
                                            </button>
                                        </div>
                                    </SettingRow>
                                </div>
                            )}

                            {/* ── INTEGRATIONS ── */}
                            {activeTab === 'integrations' && (
                                <div className="animate-in fade-in duration-500">
                                    <SectionHeading title="External Echoes" subtitle="Sync with your existing accounts" />
                                    <div className="pt-6">
                                        <TrackingSyncPanel />
                                    </div>
                                </div>
                            )}

                        </Surface>
                    </main>
                </div>
            </div>
        </div>
    );
}
