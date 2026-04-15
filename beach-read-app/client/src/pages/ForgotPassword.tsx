import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle, ShieldQuestion } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import heroImage from '../assets/hero.png';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!isSupabaseConfigured()) {
                setSubmitted(true);
                return;
            }

            const { error: resetError } = await supabase!.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (resetError) throw resetError;

            setSubmitted(true);
        } catch (err: any) {
            setError(err?.message || 'Failed to send reset link. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex relative overflow-hidden bg-background">
            {/* Background Aesthetic */}
            <div className="absolute inset-0 z-0">
                <img src={heroImage} className="w-full h-full object-cover opacity-10 scale-125 blur-md grayscale" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
            </div>

            <div className="flex-1 flex items-center justify-center relative z-10 p-6">
                <div className="w-full max-w-[480px] bg-background/40 backdrop-blur-2xl border border-white/10 p-10 md:p-14 rounded-[56px] shadow-2xl relative text-center">
                    
                    {!submitted ? (
                        <>
                            <div className="mx-auto w-20 h-20 rounded-[32px] bg-primary/10 flex items-center justify-center text-primary mb-10 border border-primary/20 shadow-2xl">
                                <ShieldQuestion size={36} />
                            </div>

                            <div className="mb-10">
                                <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase mb-3 leading-none">Recover</h1>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Restore access to your account</p>
                            </div>

                            {error && (
                                <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3 text-destructive text-[11px] font-black uppercase tracking-wider">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2 text-left">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full h-[60px] bg-white/5 border border-white/10 rounded-2xl pl-14 pr-4 text-sm font-medium focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
                                            placeholder="your@email.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-[64px] bg-foreground text-background font-black uppercase tracking-[0.4em] text-[11px] rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Mail size={18} />}
                                    {loading ? 'Sending…' : 'Reset Password'}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="animate-in fade-in zoom-in duration-500">
                            <div className="mx-auto w-24 h-24 rounded-[40px] bg-primary/10 flex items-center justify-center text-primary mb-10 border border-primary/20 shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)]">
                                <CheckCircle2 size={48} />
                            </div>
                            <div className="space-y-4 mb-10">
                                <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Email Sent</h1>
                                <p className="text-muted-foreground text-sm font-medium leading-relaxed italic max-w-xs mx-auto">
                                    A password reset link has been sent to <span className="text-foreground font-bold not-italic underline decoration-primary/40 underline-offset-4">{email}</span>.
                                </p>
                            </div>
                            <div className="p-6 bg-foreground/5 border border-foreground/10 rounded-3xl text-[10px] text-muted-foreground leading-relaxed font-black uppercase tracking-widest mb-10">
                                Check your spam folder if you do not receive the email within 5 minutes.
                            </div>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full h-[64px] bg-foreground text-background font-black uppercase tracking-[0.4em] text-[11px] rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-3 active:scale-95"
                            >
                                <ArrowLeft size={18} />
                                Return to Login
                            </button>
                        </div>
                    )}

                    {!submitted && (
                        <div className="mt-10 pt-10 border-t border-white/5">
                            <Link to="/login" className="inline-flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group">
                                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Return to Login</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
