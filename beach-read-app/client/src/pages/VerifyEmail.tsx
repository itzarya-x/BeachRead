import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import type { EmailOtpType } from '@supabase/supabase-js';
import { XCircle, Loader2, RotateCcw, ArrowLeft, ShieldCheck, MailCheck } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { extractAuthLinkPayload } from '../lib/authLinks';
import heroImage from '../assets/hero.png';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [verifying, setVerifying] = useState(true);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resending, setResending] = useState(false);

    const verifyEmail = useCallback(async () => {
        setVerifying(true);
        setError(null);
        try {
            if (!isSupabaseConfigured()) {
                setVerified(true);
                return;
            }

            const urlError = searchParams.get('error_description') || searchParams.get('error');
            if (urlError) {
                throw new Error(urlError);
            }

            const authLinkPayload = extractAuthLinkPayload(searchParams, ['signup', 'email', 'invite', 'email_change']);

            if (authLinkPayload.kind === 'code') {
                const { error } = await supabase!.auth.exchangeCodeForSession(authLinkPayload.code);
                if (error) throw error;
            } else if (authLinkPayload.kind === 'otp') {
                const { error } = await supabase!.auth.verifyOtp({
                    token_hash: authLinkPayload.tokenHash,
                    type: authLinkPayload.type as EmailOtpType,
                });
                if (error) throw error;
            }

            const { data, error: sessionError } = await supabase!.auth.getSession();
            if (sessionError) throw sessionError;

            setVerified(Boolean(data.session?.user));
            if (data.session?.user) {
                setTimeout(() => navigate('/login'), 3000);
            }
        } catch (err: any) {
            setError(err?.message || 'The verification link may have expired or is invalid.');
            setVerified(false);
        } finally {
            setVerifying(false);
        }
    }, [navigate, searchParams]);

    useEffect(() => {
        verifyEmail();
    }, [verifyEmail]);

    const handleResend = async () => {
        setResending(true);
        try {
            const email = searchParams.get('email');
            if (!email || !isSupabaseConfigured()) {
                return;
            }

            const { error: resendError } = await supabase!.auth.resend({
                type: 'signup',
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}/verify-email?email=${encodeURIComponent(email)}`,
                },
            });
            if (resendError) throw resendError;
        } catch (err) {
            // noop UI
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex relative overflow-hidden bg-background">
            {/* Background Aesthetic */}
            <div className="absolute inset-0 z-0">
                <img src={heroImage} className="w-full h-full object-cover opacity-10 scale-125 blur-md grayscale -rotate-12" alt="" />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-transparent" />
            </div>

            <div className="flex-1 flex items-center justify-center relative z-10 p-6">
                <div className="w-full max-w-[480px] bg-background/40 backdrop-blur-2xl border border-white/10 p-10 md:p-14 rounded-[56px] shadow-2xl relative text-center">
                    
                    {verifying ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-6">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse">Verifying Account</p>
                        </div>
                    ) : verified ? (
                        <div className="animate-in fade-in zoom-in duration-500">
                            <div className="mx-auto w-24 h-24 rounded-[40px] bg-primary/10 flex items-center justify-center text-primary mb-10 border border-primary/20 shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)]">
                                <ShieldCheck size={48} />
                            </div>
                            <div className="space-y-4 mb-10">
                                <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Email Verified</h1>
                                <p className="text-muted-foreground text-sm font-medium leading-relaxed italic mx-auto">
                                    Your account has been successfully validated. Redirecting to login…
                                </p>
                            </div>
                            <div className="flex justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in duration-500">
                            <div className="mx-auto w-24 h-24 rounded-[40px] bg-destructive/10 flex items-center justify-center text-destructive mb-10 border border-destructive/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                                <XCircle size={48} />
                            </div>
                            
                            <div className="space-y-4 mb-10">
                                <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Invalid Link</h1>
                                <p className="text-muted-foreground text-sm font-medium leading-relaxed italic mx-auto">
                                    {error || "The email verification link may be invalid or expired. Please request a new one."}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={handleResend}
                                    disabled={resending}
                                    className="w-full h-[64px] bg-foreground text-background font-black uppercase tracking-[0.4em] text-[11px] rounded-2xl hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    {resending ? <Loader2 className="animate-spin" size={20} /> : <RotateCcw size={20} />}
                                    {resending ? 'Sending…' : 'Resend Email'}
                                </button>
                                
                                <div className="pt-6 border-t border-white/5 mt-6">
                                    <Link to="/login" className="inline-flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group">
                                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Return to Login</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {!verifying && !verified && !error && (
                         <div className="animate-in fade-in zoom-in duration-500">
                            <div className="mx-auto w-24 h-24 rounded-[40px] bg-primary/10 flex items-center justify-center text-primary mb-10 border border-primary/20 shadow-2xl">
                                <MailCheck size={48} />
                            </div>
                            <div className="space-y-4 mb-10">
                                <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Check Inbox</h1>
                                <p className="text-muted-foreground text-sm font-medium leading-relaxed italic mx-auto">
                                    A verification email has been sent. Please confirm your email address to access your library.
                                </p>
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
                </div>
            </div>
        </div>
    );
}
