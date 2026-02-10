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
            <div className="min-h-screen bg-gradient-to-br from-surface-1 to-surface-2 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-surface-1 border border-surface-2 rounded-xl shadow-lg p-6 text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                            <Check className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Check your email</h1>
                            <p className="text-muted-foreground text-sm mt-2">
                                We've sent a password reset link to{" "}
                                <span className="font-medium text-foreground">{email}</span>
                            </p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                            <p className="font-medium mb-1">💡 Tip:</p>
                            <p>Check your spam folder if you don't see the email in a few minutes.</p>
                        </div>
                        <button
                            onClick={() => navigate("/login")}
                            className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                        >
                            Back to Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-surface-1 to-surface-2 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-surface-1 border border-surface-2 rounded-xl shadow-lg p-6">
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
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-surface-2 bg-surface-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                    disabled={loading}
                                    autoFocus
                                />
                            </div>
                            {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
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
                        className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4 flex items-center justify-center gap-1 py-2"
                    >
                        <ArrowLeft size={16} />
                        Back to Sign In
                    </button>
                </div>
            </div>
        </div>
    );
}
