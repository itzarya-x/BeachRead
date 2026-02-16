/**
 * Forgot Password Page
 *
 * Allows users to request password reset via email.
 * Implements email validation and rate limiting UI hints.
 */

import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Mail } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function ForgotPassword() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email) {
            setError("Please enter your email address");
            return;
        }

        if (!validateEmail(email)) {
            setError("Please enter a valid email address");
            return;
        }

        setLoading(true);

        try {
            // TODO: Call backend forgot-password endpoint
            // const response = await fetch("/api/auth/forgot-password", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify({ email }),
            // });

            // For now, show success message
            setSubmitted(true);
            toast({
                title: "Check your email",
                description: "If an account exists, you'll receive a password reset link.",
            });
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to send reset email");
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Try again",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <div className="w-full max-w-md space-y-8">
                    <div className="sakura-glass p-10 text-center space-y-8 shadow-depth3">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
                            <Check className="h-10 w-10 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-xl font-black uppercase tracking-widest text-foreground">Transmission Sent</h1>
                            <p className="text-xs text-white/40 leading-relaxed">
                                Recovery fragment transmitted to: <br/>
                                <span className="font-bold text-white/80">{email}</span>
                            </p>
                        </div>
                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-[10px] text-white/50 leading-relaxed italic">
                            💡 Check your terminal's spam partition if the transmission is not received.
                        </div>
                        <button
                            onClick={() => navigate("/login")}
                            className="sakura-ripple-button is-default w-full h-12 flex items-center justify-center font-black uppercase tracking-[0.15em] text-xs"
                        >
                            Return to Access Point
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase">Yura</h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">Intelligence Recovery</p>
                </div>

                <div className="sakura-glass p-8 space-y-8 shadow-depth3">
                    <div className="text-center space-y-1">
                        <h2 className="text-lg font-black uppercase tracking-widest">Reset Key</h2>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Restore access to your personal vault</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Identity (Email)</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={16} />
                                <input
                                    type="email"
                                    placeholder="user@neural.link"
                                    value={email}
                                    onChange={e => {
                                        setEmail(e.target.value);
                                        setError("");
                                    }}
                                    className="sakura-input h-12 w-full pl-12 pr-4 text-sm focus-visible:ring-primary/20"
                                    disabled={loading}
                                    autoFocus
                                />
                            </div>
                            {error && <p className="mt-1 px-1 text-[9px] font-bold uppercase tracking-widest text-destructive">{error}</p>}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="sakura-ripple-button is-default h-12 w-full flex items-center justify-center gap-3 font-black uppercase tracking-[0.15em] text-xs disabled:opacity-30"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                            ) : (
                                <Mail size={16} />
                            )}
                            {loading ? "Transmitting…" : "Send Reset Link"}
                        </button>
                    </form>

                    {/* Back Link */}
                    <button
                        onClick={() => navigate("/login")}
                        className="w-full text-center flex items-center justify-center gap-2 group"
                    >
                        <ArrowLeft size={14} className="text-white/20 group-hover:text-primary transition-colors" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/20 group-hover:text-white/50 transition-colors">Return to Login</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
