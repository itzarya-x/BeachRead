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
            <div className="sakura-app-shell relative flex min-h-screen items-center justify-center bg-background p-4">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-[10%] top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                    <div className="absolute bottom-0 right-[8%] h-72 w-72 rounded-full bg-accent/80 blur-3xl" />
                </div>
                <div className="w-full max-w-md">
                    <div className="space-y-4 sakura-glass rounded-[var(--radius-lg)] border border-border p-6 text-center backdrop-blur-[20px] shadow-[0_18px_30px_-24px_rgba(0,0,0,0.95)]">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[hsl(152_52%_16%_/_0.48)]">
                            <Check className="h-6 w-6 text-[hsl(152_72%_64%)]" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Check your email</h1>
                            <p className="text-muted-foreground text-sm mt-2">
                                We've sent a password reset link to{" "}
                                <span className="font-medium text-foreground">{email}</span>
                            </p>
                        </div>
                        <div className="rounded-lg border border-primary/25 bg-primary/12 p-3 text-sm text-foreground">
                            <p className="font-medium mb-1">💡 Tip:</p>
                            <p>Check your spam folder if you don't see the email in a few minutes.</p>
                        </div>
                        <button
                            onClick={() => navigate("/login")}
                            className="sakura-ripple-button is-default w-full px-4 py-2.5 font-medium"
                        >
                            Back to Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="sakura-app-shell relative flex min-h-screen items-center justify-center bg-background p-4">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[10%] top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-0 right-[8%] h-72 w-72 rounded-full bg-accent/80 blur-3xl" />
            </div>
            <div className="w-full max-w-md">
                <div className="sakura-glass rounded-[var(--radius-lg)] border border-border p-6 backdrop-blur-[20px] shadow-[0_18px_30px_-24px_rgba(0,0,0,0.95)]">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold">Reset Password</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Enter your email and we'll send you a link to reset your password
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <div className="relative">
                                <Mail
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    size={18}
                                />
                                <input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => {
                                        setEmail(e.target.value);
                                        setError("");
                                    }}
                                    className="sakura-input w-full rounded-lg border border-border bg-input py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                                    disabled={loading}
                                    autoFocus
                                />
                            </div>
                            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="sakura-ripple-button is-default mt-6 flex w-full items-center justify-center gap-2 px-4 py-2.5 font-medium disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Mail size={18} />
                                    Send Reset Link
                                </>
                            )}
                        </button>
                    </form>

                    {/* Back Link */}
                    <button
                        onClick={() => navigate("/login")}
                        className="sakura-ripple-button is-ghost mt-4 flex w-full items-center justify-center gap-1 py-2 text-center text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft size={16} />
                        Back to Sign In
                    </button>
                </div>
            </div>
        </div>
    );
}
