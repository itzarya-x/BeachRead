/**
 * PHASE 2: Login Page (Small, Non-Intrusive)
 *
 * Email magic link and OAuth login.
 * Minimal, frictionless - just for cloud sync identity.
 *
 * PHASE 2.1: Modal in Settings
 * PHASE 2.2: Google OAuth
 * PHASE 2.3: Email magic link
 * OFFLINE: Shows offline message & continues button
 */

import { useAuth } from "@/context/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase-client";
import { Chrome, Mail, WifiOff } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const navigate = useNavigate();
    const { login, loginWithOAuth, loginWithMagicLink, loading, error, isOnline } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [useMagicLink, setUseMagicLink] = useState(false);
    const [magicLinkSent, setMagicLinkSent] = useState(false);
    const [localError, setLocalError] = useState("");

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError("");

        if (!email) {
            setLocalError("Please enter email");
            return;
        }

        try {
            if (useMagicLink) {
                await loginWithMagicLink(email);
                setMagicLinkSent(true);
            } else {
                if (!password) {
                    setLocalError("Please enter password");
                    return;
                }
                await login(email, password);
                navigate("/", { replace: true });
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Login failed";
            setLocalError(errorMsg);
        }
    };

    const handleOAuthLogin = async (provider: "google") => {
        setLocalError("");
        try {
            await loginWithOAuth(provider);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : `${provider} login failed`;
            setLocalError(errorMsg);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase">Yura</h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">Neural Hub Access</p>
                </div>

                {/* Main Bento Card */}
                <div className="sakura-glass p-8 space-y-8 shadow-depth3">
                    {/* Offline Message */}
                    {!isOnline && (
                        <div className="flex gap-4 rounded-2xl border border-warning/20 bg-warning/5 p-5 animate-pulse">
                            <WifiOff className="h-5 w-5 shrink-0 text-warning" />
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-warning">System Offline</p>
                                <p className="mt-1 text-[10px] text-white/50 leading-relaxed">
                                    Cloud synchronisation suspended. Local vault remains accessible.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Magic Link Sent Message */}
                    {magicLinkSent && (
                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-primary">Verification Transmitted</p>
                            <p className="text-[10px] text-white/50">Access fragment sent to: <span className="text-white/80">{email}</span></p>
                        </div>
                    )}

                    {/* Error Message */}
                    {(error || localError) && (
                        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                            <p className="text-destructive text-[10px] font-bold uppercase tracking-widest text-center">{error || localError}</p>
                        </div>
                    )}

                    {!magicLinkSent ? (
                        <>
                            {/* Email/Password or Magic Link Form */}
                            <form onSubmit={handleEmailLogin} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Identity (Email)</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="user@neural.link"
                                        disabled={loading}
                                        className="sakura-input h-12 w-full px-4 text-sm focus-visible:ring-primary/20"
                                    />
                                </div>

                                {!useMagicLink && (
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Key (Password)</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            disabled={loading}
                                            className="sakura-input h-12 w-full px-4 text-sm focus-visible:ring-primary/20"
                                        />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !isOnline}
                                    className="sakura-ripple-button is-default h-12 w-full flex items-center justify-center gap-3 font-black uppercase tracking-[0.15em] text-xs disabled:opacity-30"
                                >
                                    <Mail size={16} />
                                    {loading ? "Transmitting…" : useMagicLink ? "Request Link" : "Establish Link"}
                                </button>
                            </form>

                            {/* Toggle Magic Link */}
                            {isSupabaseConfigured() && (
                                <button
                                    onClick={() => {
                                        setUseMagicLink(!useMagicLink);
                                        setPassword("");
                                        setLocalError("");
                                    }}
                                    className="w-full text-[9px] font-bold uppercase tracking-widest text-white/30 hover:text-primary transition-colors"
                                >
                                    {useMagicLink ? "Switch to primary key" : "Request ephemeral link"}
                                </button>
                            )}

                            {/* Divider */}
                            {isSupabaseConfigured() && (
                                <div className="flex items-center gap-4 py-2">
                                    <div className="h-px flex-1 bg-white/5" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/20">Third Party</span>
                                    <div className="h-px flex-1 bg-white/5" />
                                </div>
                            )}

                            {isSupabaseConfigured() && (
                                <button
                                    onClick={() => handleOAuthLogin("google")}
                                    disabled={loading || !isOnline}
                                    className="sakura-ripple-button is-outline h-12 w-full flex items-center justify-center gap-3 font-black uppercase tracking-[0.15em] text-xs disabled:opacity-30"
                                >
                                    <Chrome size={16} />
                                    Google OAuth
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="text-center space-y-6 py-4">
                            <div className="text-5xl animate-pulse text-primary">📧</div>
                            <div className="space-y-2">
                                <p className="text-sm font-black uppercase tracking-[0.2em]">Transmission Successful</p>
                                <p className="text-xs text-white/40 leading-relaxed">
                                    Verify your identity via the secure link sent to your terminal.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setMagicLinkSent(false);
                                    setEmail("");
                                    setLocalError("");
                                }}
                                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                            >
                                Return to Access Point
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Info Bento */}
                <div className="sakura-glass p-5 flex items-start gap-4 border-white/5 bg-white/5">
                    <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Vault Intelligence</p>
                        <p className="mt-1 text-[10px] text-white/40 leading-relaxed">
                            Skip login to operate in isolated local mode. All data persists encrypted on-device.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
