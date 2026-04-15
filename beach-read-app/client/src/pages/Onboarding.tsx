import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { supabase } from '../lib/supabaseClient';
import { isMissingTableError } from '../lib/supabaseSchema';
import { 
    ChevronRight, 
    ChevronLeft, 
    Check, 
    Palette, 
    Import, 
    Loader2,
    ShieldPlus
} from 'lucide-react';

export default function Onboarding() {
    const { user, refreshUser, updateUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = React.useState(1);
    const [loading, setLoading] = React.useState(false);
    
    // Step 1: Sync
    const [provider, setProvider] = React.useState<'ANILIST' | 'MAL' | null>(null);
    const [username, setUsername] = React.useState('');
    const [accessToken, setAccessToken] = React.useState('');
    
    // Step 2: Preferences
    const [theme, setTheme] = React.useState('DARK');
    
    const totalSteps = 3;

    // Force dark mode on onboarding
    React.useEffect(() => {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }, []);

    const handleNext = () => setStep(s => Math.min(s + 1, totalSteps));

    const handlePrev = () => setStep(s => Math.max(s - 1, 1));

    const handleFinish = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await updateUser({
                hasOnboarded: true,
                preferences: {
                    ...(user.preferences || {
                        language: 'en',
                        notifications: true,
                        titleLanguage: 'ROMAJI',
                        scoreFormat: 'POINT_10',
                        adultContent: false,
                    }),
                    theme: theme.toLowerCase() as 'dark' | 'light' | 'system',
                },
            });
            
            if (provider && username) {
                const normalizedProvider = provider.toLowerCase();
                const { error: integrationError } = await supabase!
                    .from('external_integrations')
                    .upsert({
                        user_id: user.id,
                        provider: normalizedProvider,
                        status: accessToken ? 'connected' : 'none',
                        username,
                        access_token: accessToken || null,
                        sync_mode: 'manual',
                        conflict_mode: 'newest_wins',
                        last_sync_at: new Date().toISOString(),
                    }, { onConflict: 'user_id,provider' });

                if (integrationError && !isMissingTableError(integrationError, 'external_integrations')) {
                    throw integrationError;
                }

                const { error: syncJobError } = await supabase!
                    .from('external_sync_jobs')
                    .insert({
                        user_id: user.id,
                        provider: normalizedProvider,
                        direction: 'import',
                        sync_mode: 'manual',
                        status: 'pending',
                    });

                if (syncJobError && !isMissingTableError(syncJobError, 'external_sync_jobs')) {
                    throw syncJobError;
                }
            }

            await refreshUser();
            navigate('/');
        } catch (err) {
            console.error('Onboarding failed:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-2xl bg-white/[0.02] border border-white/5 backdrop-blur-3xl rounded-[48px] p-12 shadow-2xl relative z-10">
                
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-background">
                            <ShieldPlus size={20} />
                        </div>
                        <span className="text-sm font-black uppercase tracking-tighter text-foreground">beach<span className="text-primary">Read</span></span>
                    </div>
                    <div className="flex gap-2">
                        {[...Array(totalSteps)].map((_, i) => (
                            <div 
                                key={i} 
                                className={`h-1 rounded-full transition-all duration-500 ${
                                    i + 1 <= step ? 'w-8 bg-primary' : 'w-4 bg-white/10'
                                }`} 
                            />
                        ))}
                    </div>
                </div>

                {/* Step 1: Connect External Service */}
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4">Step 01</p>
                        <h2 className="text-5xl font-black uppercase tracking-tighter text-foreground mb-6">Import Your<br/>Archive</h2>
                        <p className="text-muted-foreground text-sm font-medium mb-10 max-w-md italic">
                            Connect your existing sequential arts library to synchronize your progress instantly.
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <button 
                                onClick={() => setProvider('ANILIST')}
                                className={`p-6 rounded-[24px] border transition-all flex flex-col items-center gap-4 ${
                                    provider === 'ANILIST' ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                                }`}
                            >
                                <div className="w-12 h-12 bg-[#02A9FF]/20 rounded-xl flex items-center justify-center text-[#02A9FF]">
                                    <span className="font-black text-xl">A</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">AniList</span>
                            </button>
                            <button 
                                onClick={() => setProvider('MAL')}
                                className={`p-6 rounded-[24px] border transition-all flex flex-col items-center gap-4 ${
                                    provider === 'MAL' ? 'bg-primary/10 border-primary text-primary' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                                }`}
                            >
                                <div className="w-12 h-12 bg-[#2E51A2]/20 rounded-xl flex items-center justify-center text-[#2E51A2]">
                                    <span className="font-black text-xl">M</span>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">MyAnimeList</span>
                            </button>
                        </div>

                        {provider && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-2">Provider Username</label>
                                    <input 
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder={`Enter your ${provider === 'ANILIST' ? 'AniList' : 'MAL'} username`}
                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold text-white outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between px-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Access Token (Optional)</label>
                                        <a 
                                            href={provider === 'ANILIST' ? "https://anilist.co/settings/developer" : "https://myanimelist.net/apiconfig-example"} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-[9px] font-black uppercase tracking-widest text-primary hover:underline"
                                        >
                                            Get Token
                                        </a>
                                    </div>
                                    <input 
                                        type="password"
                                        value={accessToken}
                                        onChange={(e) => setAccessToken(e.target.value)}
                                        placeholder="Paste your personal access token"
                                        className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-sm font-bold text-white outline-none focus:border-primary/50 transition-all"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Aesthetics */}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4">Step 02</p>
                        <h2 className="text-5xl font-black uppercase tracking-tighter text-foreground mb-6">Define Your<br/>Aesthetic</h2>
                        <p className="text-muted-foreground text-sm font-medium mb-10 max-w-md italic">
                            Choose how you wish to experience your archive.
                        </p>

                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { id: 'DARK', name: 'Midnight Noir', desc: 'High contrast, deep blacks, pure focus.' },
                                { id: 'LIGHT', name: 'Paper White', desc: 'Classic archival look, bright and clean.' },
                                { id: 'SYSTEM', name: 'Adaptive Sync', desc: 'Follows your device terminal settings.' }
                            ].map((t) => (
                                <button 
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={`p-6 rounded-[24px] border transition-all flex items-center gap-6 text-left ${
                                        theme === t.id ? 'bg-primary/10 border-primary shadow-lg shadow-primary/5' : 'bg-white/5 border-white/10 text-white/40'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${theme === t.id ? 'border-primary text-primary' : 'border-white/10 text-white/10'}`}>
                                        {theme === t.id && <Check size={20} />}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black uppercase tracking-tight text-white mb-1">{t.name}</h4>
                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{t.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Confirmation */}
                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4">Step 03</p>
                        <h2 className="text-5xl font-black uppercase tracking-tighter text-foreground mb-6">Archive Ready<br/>For Launch</h2>
                        <p className="text-muted-foreground text-sm font-medium mb-10 max-w-md italic">
                            Your personal reading command center is initialized and ready.
                        </p>

                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                                    <Import size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Provider Link</p>
                                    <p className="text-xs font-black text-white">{provider ? `${provider}: ${username}` : 'No Import Selected'}</p>
                                </div>
                                <button onClick={() => setStep(1)} className="text-[9px] font-black uppercase text-primary">Edit</button>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                                    <Palette size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Visual Protocol</p>
                                    <p className="text-xs font-black text-white">{theme} MODE</p>
                                </div>
                                <button onClick={() => setStep(2)} className="text-[9px] font-black uppercase text-primary">Edit</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="mt-16 flex items-center justify-between">
                    {step > 1 ? (
                        <button 
                            onClick={handlePrev}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
                        >
                            <ChevronLeft size={16} /> Previous
                        </button>
                    ) : <div />}

                    {step < totalSteps ? (
                        <button 
                            onClick={handleNext}
                            className="h-[60px] px-10 bg-white text-background rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 hover:opacity-90 transition-all active:scale-95"
                        >
                            Continue <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button 
                            onClick={handleFinish}
                            disabled={loading}
                            className="h-[60px] px-10 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 hover:opacity-90 transition-all active:scale-95 shadow-xl shadow-primary/20"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <><Check size={16} /> Initialize Archive</>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
