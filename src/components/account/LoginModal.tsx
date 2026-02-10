/**
 * Login Modal (PHASE 2)
 *
 * Simple, non-intrusive login dialog.
 * - Option 1: Google OAuth
 * - Option 2: Email magic link
 * - Auto-closes after successful login
 */

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Mail, X } from "lucide-react";
import { useState } from "react";

interface LoginModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

type LoginMode = "methods" | "magic-link-sent" | "error";

export function LoginModal({ isOpen, onOpenChange }: LoginModalProps) {
    const { loginWithOAuth, loginWithMagicLink } = useAuth();
    const { toast } = useToast();
    const [mode, setMode] = useState<LoginMode>("methods");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOAuthLogin = async () => {
        try {
            setLoading(true);
            setError(null);

            await loginWithOAuth("google");

            toast({
                title: "Welcome!",
                description: "You've been signed in.",
            });

            onOpenChange(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "OAuth login failed");
            setMode("error");
        } finally {
            setLoading(false);
        }
    };

    const handleMagicLinkSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError("Please enter your email");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await loginWithMagicLink(email);

            setMode("magic-link-sent");

            toast({
                title: "Check your email",
                description: "We sent you a magic link to sign in.",
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to send magic link");
            setMode("error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-surface-1 rounded-lg shadow-lg max-w-md w-full border border-surface-2">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-surface-2">
                    <h2 className="text-lg font-semibold">Sign in</h2>
                    <button
                        onClick={() => {
                            onOpenChange(false);
                            setMode("methods");
                            setError(null);
                            setEmail("");
                        }}
                        className="p-1 hover:bg-surface-2 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4">
                    {mode === "methods" && (
                        <div className="space-y-3">
                            <button
                                onClick={handleOAuthLogin}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-white border border-surface-2 hover:bg-surface-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Continue with Google
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-surface-2" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-surface-1 text-muted-foreground">or</span>
                                </div>
                            </div>

                            <form onSubmit={handleMagicLinkSubmit} className="space-y-3">
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-surface-2 bg-surface-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={loading}
                                />

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    <Mail size={18} />
                                    Send magic link
                                </button>
                            </form>
                        </div>
                    )}

                    {mode === "magic-link-sent" && (
                        <div className="text-center space-y-4">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                                <Mail className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="font-semibold">Check your email</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    We sent a link to <span className="font-medium">{email}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setMode("methods");
                                    setEmail("");
                                }}
                                className="w-full px-4 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors"
                            >
                                Back
                            </button>
                        </div>
                    )}

                    {mode === "error" && (
                        <div className="space-y-4">
                            <div className="p-3 rounded-lg bg-red-100 border border-red-300">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setMode("methods");
                                    setError(null);
                                }}
                                className="w-full px-4 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors"
                            >
                                Try again
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-surface-2 bg-surface-2 text-center text-xs text-muted-foreground">
                    Your data stays on your device. Cloud sync is optional.
                </div>
            </div>
        </div>
    );
}
