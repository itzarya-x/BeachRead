/**
 * PHASE 2: Login Page (Small, Non-Intrusive)
 *
 * Email magic link and OAuth login.
 * Minimal, frictionless - just for cloud sync identity.
 *
 * PHASE 2.1: Modal in Settings
 * PHASE 2.2: Google OAuth
 * PHASE 2.3: Email magic link
 */

import { useAuth } from "@/context/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase-client";
import { Chrome, Mail } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const navigate = useNavigate();
    const { login, loginWithOAuth, loginWithMagicLink, loading, error } = useAuth();

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
                navigate("/");
            }
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : "Login failed");
        }
    };

    const handleOAuthLogin = async (provider: "google") => {
        setLocalError("");
        try {
            await loginWithOAuth(provider);
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : `${provider} login failed`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-surface-2 to-surface-3 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-primary mb-2">Yura</h1>
                    <p className="text-muted-foreground">Your anime & manga vault</p>
                </div>

                {/* Card */}
                <div className="bg-surface-1 border border-border/30 rounded-lg p-6 space-y-6">
                    {/* Magic Link Sent Message */}
                    {magicLinkSent && (
                        <div className="bg-accent/10 border border-accent/30 rounded p-3">
                            <p className="text-accent text-sm font-medium">✓ Check your email for login link</p>
                            <p className="text-muted-foreground text-xs mt-1">We sent a magic link to {email}</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {(error || localError) && (
                        <div className="bg-destructive/10 border border-destructive/30 rounded p-3">
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
                                        className="w-full px-4 py-2 bg-surface-2 border border-border/30 rounded text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
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
                                            className="w-full px-4 py-2 bg-surface-2 border border-border/30 rounded text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                                        />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
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
                                            <span className="px-2 bg-surface-1 text-muted-foreground">
                                                Or continue with
                                            </span>
                                        </div>
                                    </div>

                                    {/* OAuth Button */}
                                    <button
                                        onClick={() => handleOAuthLogin("google")}
                                        disabled={loading}
                                        className="w-full px-4 py-2 bg-surface-2 border border-border/30 rounded font-medium text-foreground hover:bg-surface-3 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Chrome size={18} />
                                        Continue with Google
                                    </button>
                                </>
                            )}

                            {/* Demo Info */}
                            <div className="bg-accent/10 border border-accent/30 rounded p-3 text-center">
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
                <div className="mt-6 p-4 bg-surface-2 rounded border border-border/30">
                    <p className="text-sm text-muted-foreground">
                        <strong>💡 Tip:</strong> Skip login to use local-only mode. Your data stays private on your
                        device.
                    </p>
                </div>
            </div>
        </div>
    );
}
