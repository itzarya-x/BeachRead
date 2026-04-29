import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { EmailOtpType } from '@supabase/supabase-js';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ShieldX, KeyRound } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../shared/api/supabaseClient';
import { extractAuthLinkPayload } from '../features/auth/api/authLinks';
import heroImage from "../shared/assets/hero.png";

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const verifyToken = async () => {
            try {
                if (!isSupabaseConfigured()) {
                    setTokenValid(true);
                    return;
                }

                const urlError = searchParams.get('error_description') || searchParams.get('error');
                if (urlError) {
                    throw new Error(urlError);
                }

                const authLinkPayload = extractAuthLinkPayload(searchParams, ['recovery']);

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
                setTokenValid(Boolean(data.session?.user));
            } catch {
                setTokenValid(false);
            } finally {
                setVerifying(false);
            }
        };

        verifyToken();
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isSupabaseConfigured()) {
                const { error: updateError } = await supabase!.auth.updateUser({ password });
                if (updateError) throw updateError;
            }

            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err: any) {
            setError(err?.message || 'Failed to reset password. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex relative overflow-hidden bg-background">
            {/* Background Aesthetic */}
            <div className="absolute inset-0 z-0">
                <img src={heroImage} className="w-full h-full object-cover opacity-10 scale-125 blur-md grayscale rotate-90" alt="" />
                <div className="absolute inset-0 bg-gradient-to-b from-background via-background/90 to-transparent" />
            </div>

            <div className="flex-1 flex items-center justify-center relative z-10 p-6">
                <div className="w-full max-w-[480px] bg-background/40 backdrop-blur-2xl border border-white/10 p-10 md:p-14 rounded-[56px] shadow-2xl relative text-center">
                    
                    {verifying ? (
                        <div className="py-20 flex flex-col items-center justify-center gap-6">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="text-sm font-semibold tracking-tight text-muted-foreground animate-pulse">Verifying link...</p>
                        </div>
                    ) : !tokenValid ? (
                        <div className="animate-in fade-in zoom-in duration-500">
                            <div className="mx-auto w-24 h-24 rounded-3xl bg-destructive/10 flex items-center justify-center text-destructive mb-10 border border-destructive/20 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                                <ShieldX size={48} />
                            </div>
                            <div className="space-y-4 mb-10">
                                <h1 className="text-3xl font-semibold tracking-tight text-foreground leading-none">Access Invalid</h1>
                                <p className="text-muted-foreground text-sm font-medium leading-relaxed italic mx-auto">
                                    This password reset link has expired or is no longer valid.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/forgot-password')}
                                className="w-full h-14 bg-foreground text-background font-semibold text-sm rounded-xl hover:opacity-90 transition-all active:scale-95"
                            >
                                Request New Link
                            </button>
                        </div>
                    ) : success ? (
                        <div className="animate-in fade-in zoom-in duration-500">
                            <div className="mx-auto w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-10 border border-primary/20 shadow-[0_0_50px_rgba(var(--primary-rgb),0.2)]">
                                <CheckCircle2 size={48} />
                            </div>
                            <div className="space-y-4 mb-10">
                                <h1 className="text-3xl font-semibold tracking-tight text-foreground leading-none">Password Updated</h1>
                                <p className="text-muted-foreground text-sm font-medium leading-relaxed italic mx-auto">
                                    Your password has been successfully reset. Redirecting to login…
                                </p>
                            </div>
                            <div className="flex justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-10 border border-primary/20 shadow-2xl">
                                <KeyRound size={36} />
                            </div>

                            <div className="mb-10 text-center">
                                <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-3 leading-none">Reset Password</h1>
                                <p className="text-sm font-medium text-muted-foreground">Choose a new secure password</p>
                            </div>

                            {error && (
                                <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3 text-destructive text-sm font-medium">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2 text-left">
                                    <label className="text-xs font-semibold tracking-tight text-muted-foreground ml-1">New Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full h-14 bg-white/5 border border-white/10 rounded-xl pl-14 pr-14 text-sm font-medium focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
                                            placeholder="••••••••"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 text-left">
                                    <label className="text-xs font-semibold tracking-tight text-muted-foreground ml-1">Confirm Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full h-14 bg-white/5 border border-white/10 rounded-xl pl-14 pr-14 text-sm font-medium focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-14 bg-foreground text-background font-semibold text-sm rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Lock size={18} />}
                                    {loading ? 'Verifying…' : 'Reset Password'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
