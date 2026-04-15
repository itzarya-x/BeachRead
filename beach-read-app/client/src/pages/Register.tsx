import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { Mail, Lock, User as UserIcon, Loader2, AlertCircle, ArrowLeft, ShieldPlus } from 'lucide-react';
import heroImage from '../assets/hero.png';

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const { register, loginWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await register(email, password, displayName);
            navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        } catch (err: any) {
            setError(err?.message || 'Failed to create account. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setError(null);
        setGoogleLoading(true);
        try {
            await loginWithGoogle();
        } catch (err: any) {
            setError(err?.message || 'Failed to start Google signup.');
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex relative overflow-hidden bg-background">
            {/* Background Aesthetic */}
            <div className="absolute inset-0 z-0">
                <img src={heroImage} className="w-full h-full object-cover opacity-20 scale-110 blur-sm rotate-180" alt="" />
                <div className="absolute inset-0 bg-gradient-to-tl from-background via-background/90 to-primary/10" />
            </div>

            {/* Left Side: Branding (Hidden on mobile) */}
            <div className="hidden lg:flex flex-1 relative z-10 flex-col justify-between p-16 border-r border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-background shadow-lg shadow-primary/20">
                        <ShieldPlus size={24} />
                    </div>
                    <span className="text-xl font-black uppercase tracking-tighter text-foreground">beach<span className="text-primary">Read</span></span>
                </div>

                <div className="space-y-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary">Join the Community</p>
                    <h2 className="text-7xl font-black uppercase tracking-tighter leading-[0.85] text-foreground">Create<br/>Account</h2>
                    <p className="text-lg text-muted-foreground font-medium italic max-w-md leading-relaxed">
                        "Your reading journey starts here. Join thousands of readers documenting their favorite stories."
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-2xl font-black text-foreground">50k+</p>
                            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Manga Titles</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-2xl font-black text-foreground">1.2M</p>
                            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Chapters Read</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Form */}
            <div className="flex-1 flex items-center justify-center relative z-10 p-6">
                <div className="w-full max-w-[440px] bg-background/40 backdrop-blur-2xl border border-white/10 p-10 md:p-12 rounded-[48px] shadow-2xl relative">
                    <Link to="/login" className="absolute top-8 left-8 p-2 hover:bg-white/5 rounded-full transition-colors text-muted-foreground hover:text-foreground flex items-center gap-2">
                        <ArrowLeft size={18} />
                        <span className="text-[9px] font-black uppercase tracking-widest">To Login</span>
                    </Link>

                    <div className="mb-10 text-center">
                        <h1 className="text-3xl font-black tracking-tighter text-foreground uppercase mb-2">Sign Up</h1>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Create your personal profile</p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3 text-destructive text-[11px] font-black uppercase tracking-wider">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <button
                            type="button"
                            onClick={handleGoogleSignup}
                            disabled={googleLoading || loading}
                            className="w-full h-[56px] border border-white/10 bg-white/5 text-foreground font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 active:scale-95"
                        >
                            {googleLoading ? <Loader2 className="animate-spin" size={18} /> : (
                                <>
                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Sign Up With Google
                                </>
                            )}
                        </button>

                        <div className="flex items-center gap-4 py-1">
                            <div className="h-px flex-1 bg-white/10" />
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">OR</span>
                            <div className="h-px flex-1 bg-white/10" />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Display Name</label>
                            <div className="relative group">
                                <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full h-[52px] bg-white/5 border border-white/10 rounded-2xl pl-14 pr-4 text-sm font-medium focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
                                    placeholder="Your Name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-[52px] bg-white/5 border border-white/10 rounded-2xl pl-14 pr-4 text-sm font-medium focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-[52px] bg-white/5 border border-white/10 rounded-2xl pl-14 pr-4 text-sm font-medium focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-[60px] bg-primary text-background font-black uppercase tracking-[0.3em] text-[11px] rounded-2xl hover:brightness-110 transition-all flex items-center justify-center gap-3 mt-6 shadow-[0_20px_40px_rgba(var(--primary-rgb),0.3)] active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                            Already have an account? <Link to="/login" className="text-primary hover:underline">Log In</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
