/**
 * Login Modal (PHASE 2)
 *
 * Simple, non-intrusive dialog for logging in.
 * Options: Google OAuth, Email magic link
 * Auto-closes after login.
 *
 * DESIGN: Small dialog, not a full page
 */

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured } from "@/lib/supabase-client";
import { Chrome, Mail, X } from "lucide-react";
import { useEffect, useState } from "react";

interface LoginModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LoginModal({ isOpen, onOpenChange }: LoginModalProps) {
    const { loginWithOAuth, loginWithMagicLink, loading, error } = useAuth();
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [magicLinkSent, setMagicLinkSent] = useState(false);
    const [localError, setLocalError] = useState("");

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setEmail("");
            setMagicLinkSent(false);
            setLocalError("");
        }
    }, [isOpen]);

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError("");

        if (!email) {
            setLocalError("Please enter your email");
            return;
        }

        try {
            await loginWithMagicLink(email);
            setMagicLinkSent(true);
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : "Failed to send magic link");
        }
    };

    const handleGoogle = async () => {
        setLocalError("");
        try {
            await loginWithOAuth("google");
            onOpenChange(false);
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : "Google login failed");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-surface-1 border border-border/30 rounded-lg max-w-sm w-full space-y-4 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Sign In</h2>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="p-1 hover:bg-surface-2 rounded transition-colors"
                    >
                        <X size={20} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Magic Link Sent State */}
                {magicLinkSent ? (
                    <div className="space-y-4 py-6">
                        <div className="text-center space-y-2">
                            <div className="text-4xl">📧</div>
                            <p className="font-medium text-foreground">Check your email</p>
                            <p className="text-sm text-muted-foreground">
                                We sent a login link to <strong>{email}</strong>
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setMagicLinkSent(false);
                                setEmail("");
                            }}
                            className="w-full px-3 py-2 text-sm text-primary hover:text-primary/80 transition-colors"
                        >
                            Back to login
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Errors */}
                        {(error || localError) && (
                            <div className="bg-destructive/10 border border-destructive/30 rounded p-3">
                                <p className="text-sm text-destructive">{error || localError}</p>
                            </div>
                        )}

                        {/* Magic Link Form */}
                        <form onSubmit={handleMagicLink} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    disabled={loading}
                                    className="w-full px-3 py-2 bg-surface-2 border border-border/30 rounded text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-3 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <Mail size={16} />
                                {loading ? "Sending..." : "Send Magic Link"}
                            </button>
                        </form>

                        {/* Divider */}
                        {isSupabaseConfigured() && (
                            <>
                                <div className="relative my-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-border/30" />
                                    </div>
                                    <div className="relative flex justify-center text-xs">
                                        <span className="px-2 bg-surface-1 text-muted-foreground">Or</span>
                                    </div>
                                </div>

                                {/* Google Button */}
                                <button
                                    onClick={handleGoogle}
                                    disabled={loading}
                                    className="w-full px-3 py-2 bg-surface-2 border border-border/30 rounded text-sm font-medium text-foreground hover:bg-surface-3 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Chrome size={16} />
                                    Continue with Google
                                </button>
                            </>
                        )}

                        {/* Info */}
                        <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border/20">
                            We&rsquo;ll sync your data across your devices.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
