/**
 * Reset Password Page
 *
 * Password reset form accessed via email link.
 * Token validation and password update with strength requirements.
 */

import { useToast } from "@/hooks/use-toast";
import { Check, Eye, EyeOff, Lock, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

interface PasswordStrength {
    score: number;
    label: string;
    color: string;
}

export function ResetPassword() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { toast } = useToast();

    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState<{
        password?: string;
        confirmPassword?: string;
    }>({});

    useEffect(() => {
        const resetToken = searchParams.get("token");
        if (!resetToken) {
            setVerifying(false);
            return;
        }

        setToken(resetToken);
        validateToken(resetToken);
    }, [searchParams]);

    const validateToken = async (token: string) => {
        try {
            // TODO: Call backend to validate token
            // const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);
            // const data = await response.json();
            // setTokenValid(data.valid);

            // For now, assume token is valid
            setTokenValid(true);
        } catch (error) {
            setTokenValid(false);
            toast({
                title: "Invalid or expired link",
                description: "Please request a new password reset link",
                variant: "destructive",
            });
        } finally {
            setVerifying(false);
        }
    };

    const checkPasswordStrength = (pwd: string): PasswordStrength => {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
        if (/\d/.test(pwd)) score++;
        if (/[^a-zA-Z\d]/.test(pwd)) score++;

        if (score <= 1) return { score, label: "Weak", color: "text-red-600" };
        if (score <= 2) return { score, label: "Fair", color: "text-yellow-600" };
        if (score <= 3) return { score, label: "Good", color: "text-blue-600" };
        return { score, label: "Strong", color: "text-green-600" };
    };

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // TODO: Call backend reset-password endpoint
            // const response = await fetch("/api/auth/reset-password", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify({
            //         token,
            //         password: formData.password,
            //     }),
            // });

            toast({
                title: "Password reset successful",
                description: "You can now sign in with your new password",
            });

            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (error) {
            toast({
                title: "Reset failed",
                description: error instanceof Error ? error.message : "Please try again",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-surface-1 to-surface-2 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-surface-1 border border-surface-2 rounded-xl shadow-lg p-6 text-center">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-muted-foreground mt-3">Verifying reset link...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-surface-1 to-surface-2 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-surface-1 border border-surface-2 rounded-xl shadow-lg p-6 text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
                            <X className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Invalid or Expired Link</h1>
                            <p className="text-muted-foreground text-sm mt-2">
                                This password reset link has expired or is invalid.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("/forgot-password")}
                            className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                        >
                            Request New Link
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const passwordStrength = checkPasswordStrength(formData.password);

    return (
        <div className="min-h-screen bg-gradient-to-br from-surface-1 to-surface-2 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-surface-1 border border-surface-2 rounded-xl shadow-lg p-6">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold">Set New Password</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Enter a strong password to secure your account
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium mb-2">New Password</label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    size={18}
                                />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => {
                                        setFormData({
                                            ...formData,
                                            password: e.target.value,
                                        });
                                        setErrors({});
                                    }}
                                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-surface-2 bg-surface-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="mt-2 space-y-1">
                                    <div className="flex gap-1">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-colors ${
                                                    i < passwordStrength.score ? passwordStrength.color : "bg-surface-2"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <p className={`text-xs ${passwordStrength.color}`}>
                                        Password strength: {passwordStrength.label}
                                    </p>
                                </div>
                            )}

                            {errors.password && (
                                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                                    <X size={12} />
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Confirm Password</label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    size={18}
                                />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={e => {
                                        setFormData({
                                            ...formData,
                                            confirmPassword: e.target.value,
                                        });
                                        setErrors({});
                                    }}
                                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-surface-2 bg-surface-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                                    <X size={12} />
                                    {errors.confirmPassword}
                                </p>
                            )}
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
                                    Resetting...
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    Reset Password
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
