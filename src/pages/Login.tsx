/**
 * PHASE 3.1: Login Page
 *
 * Email and OAuth login support.
 * First touchpoint for new users.
 */

import { useAuth } from "@/context/AuthContext";
import { Chrome, Github, Mail } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const navigate = useNavigate();
    const { login, loginWithOAuth, loading, error } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [localError, setLocalError] = useState("");

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError("");

        if (!email || !password) {
            setLocalError("Please enter email and password");
            return;
        }

        try {
            await login(email, password);
            navigate("/");
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : "Login failed");
        }
    };

    const handleOAuthLogin = async (provider: "google" | "github") => {
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
                    {/* Error Message */}
                    {(error || localError) && (
                        <div className="bg-destructive/10 border border-destructive/30 rounded p-3">
                            <p className="text-destructive text-sm">{error || localError}</p>
                        </div>
                    )}

                    {/* Email Login Form */}
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

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={loading}
                                className="w-full px-4 py-2 bg-surface-2 border border-border/30 rounded text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Mail size={18} />
                            {loading ? "Logging in..." : "Login with Email"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border/30" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-surface-1 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    {/* OAuth Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleOAuthLogin("google")}
                            disabled={loading}
                            className="px-4 py-2 bg-surface-2 border border-border/30 rounded font-medium text-foreground hover:bg-surface-3 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Chrome size={18} />
                            Google
                        </button>

                        <button
                            onClick={() => handleOAuthLogin("github")}
                            disabled={loading}
                            className="px-4 py-2 bg-surface-2 border border-border/30 rounded font-medium text-foreground hover:bg-surface-3 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Github size={18} />
                            GitHub
                        </button>
                    </div>

                    {/* Demo Info */}
                    <div className="bg-accent/10 border border-accent/30 rounded p-3 text-center">
                        <p className="text-sm text-muted-foreground">Demo mode: Any email & password works</p>
                    </div>

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
                        <strong>Tip:</strong> Skip login to use local-only mode. Your data stays private on your device.
                    </p>
                </div>
            </div>
        </div>
    );
}
