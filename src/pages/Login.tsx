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
        <div className="sakura-app-shell relative flex min-h-screen items-center justify-center bg-background p-4">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[12%] top-0 h-64 w-64 rounded-full bg-primary/14 blur-3xl" />
                <div className="absolute bottom-0 right-[10%] h-72 w-72 rounded-full bg-[hsl(274_72%_72%_/_0.22)] blur-3xl" />
            </div>
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-primary mb-2">Yura</h1>
                    <p className="text-muted-foreground">Your anime & manga vault</p>
                </div>

                {/* Card */}
                <div className="space-y-6 sakura-glass rounded-[var(--radius-lg)] border border-border p-6 backdrop-blur-[20px] shadow-[0_18px_30px_-24px_rgba(0,0,0,0.95)]">
                    {/* Offline Message */}
                    {!isOnline && (
                        <div className="flex gap-3 rounded-xl border border-[hsl(42_92%_70%_/_0.35)] bg-[hsl(38_64%_20%_/_0.48)] p-4">
                            <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(42_92%_70%)]" />
                            <div>
                                <p className="text-sm font-medium text-[hsl(42_92%_80%)]">You are offline</p>
                                <p className="mt-1 text-xs text-[hsl(42_64%_75%)]">
                                    Internet is required to sign in. Your local vault remains available — all your data
                                    is safe.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Magic Link Sent Message */}
                    {magicLinkSent && (
                        <div className="rounded-xl border border-primary/30 bg-primary/15 p-3">
                            <p className="text-sm font-medium text-[hsl(var(--sakura-soft))]">✓ Check your email for login link</p>
                            <p className="text-muted-foreground text-xs mt-1">We sent a magic link to {email}</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {(error || localError) && (
                        <div className="rounded-xl border border-destructive/35 bg-destructive/20 p-3">
                            <p className="text-destructive text-sm">{error || localError}</p>
                        </div>
                    )}

                    {!magicLinkSent ? (
                        <>
                            {/* Email/Password or Magic Link Form */}
                            <form onSubmit={handleEmailLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        disabled={loading}
                                        className="sakura-input w-full rounded border border-border bg-input px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                                    />
                                </div>

                                {!useMagicLink && (
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-2">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            disabled={loading}
                                        className="sakura-input w-full rounded border border-border bg-input px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                                    />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !isOnline}
                                    className="sakura-ripple-button is-default flex w-full items-center justify-center gap-2 px-4 py-2 font-medium disabled:opacity-50"
                                >
                                    <Mail size={18} />
                                    {loading ? "Sending..." : useMagicLink ? "Send Magic Link" : "Login with Email"}
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
                                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {useMagicLink ? "Use password instead" : "Use magic link instead"}
                                </button>
                            )}

                            {/* Divider */}
                            {isSupabaseConfigured() && (
                                <>
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-border/30" />
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="bg-card px-2 text-muted-foreground">
                                                Or continue with
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleOAuthLogin("google")}
                                        disabled={loading || !isOnline}
                                    className="sakura-ripple-button is-outline flex w-full items-center justify-center gap-2 px-4 py-2 font-medium disabled:opacity-50"
                                >
                                        <Chrome size={18} />
                                        Continue with Google
                                    </button>
                                </>
                            )}

                            {/* Demo Info */}
                            <div className="rounded-xl border border-border bg-card/45 p-3 text-center">
                                <p className="text-sm text-muted-foreground">
                                    {isSupabaseConfigured()
                                        ? "Create account or login with Supabase"
                                        : "Demo: Any email works (offline mode)"}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="text-3xl">📧</div>
                            <div>
                                <p className="text-foreground font-medium">Check your email</p>
                                <p className="text-muted-foreground text-sm mt-1">
                                    We sent a login link to <strong>{email}</strong>
                                </p>
                                <p className="text-muted-foreground text-xs mt-2">
                                    Click the link to login and sync your data
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setMagicLinkSent(false);
                                    setEmail("");
                                    setLocalError("");
                                }}
                                className="text-sm text-primary hover:underline"
                            >
                                Back to login
                            </button>
                        </div>
                    )}

                    {/* Terms */}
                    <p className="text-xs text-muted-foreground text-center">
                        By logging in, you agree to our{" "}
                        <a href="#" className="text-primary hover:underline">
                            Terms of Service
                        </a>
                    </p>
                </div>

                {/* Offline Mode Info */}
                <div className="mt-6 rounded-[var(--radius-md)] border border-border bg-card/55 p-4 backdrop-blur-[16px]">
                    <p className="text-sm text-muted-foreground">
                        <strong>💡 Tip:</strong> Skip login to use local-only mode. Your data stays private on your
                        device.
                    </p>
                    {!isOnline && (
                        <p className="mt-2 text-sm font-medium text-[hsl(42_92%_74%)]">
                            📡 You're currently offline — sign in will be available when you reconnect.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
