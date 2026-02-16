/**
 * Reset Password Page
 *
 * Password reset form accessed via email link.
 * Token validation and password update with strength requirements.
 */

import { useToast } from "@/hooks/use-toast";
import { Check, Eye, EyeOff, Lock, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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

    const validateToken = useCallback(async (token: string) => {
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
    }, [toast]);

    useEffect(() => {
        const resetToken = searchParams.get("token");
        if (!resetToken) {
            setVerifying(false);
            return;
        }

        setToken(resetToken);
        validateToken(resetToken);
    }, [searchParams, validateToken]);

    const checkPasswordStrength = (pwd: string): PasswordStrength => {
        let score = 0;
        if (pwd.length >= 8) score++;
        if (pwd.length >= 12) score++;
        if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
        if (/\d/.test(pwd)) score++;
        if (/[^a-zA-Z\d]/.test(pwd)) score++;

        if (score <= 1) return { score, label: "Weak", color: "text-red-600" };
        if (score <= 2) return { score, label: "Fair", color: "text-yellow-600" };
        if (score <= 3) return { score, label: "Good", color: "text-primary" };
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
            <div className="flex min-h-screen items-center justify-center p-6">
                <div className="sakura-glass p-10 text-center max-w-sm w-full space-y-6">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto shadow-glow" />
                    <div className="space-y-2">
                        <p className="text-foreground font-black uppercase tracking-[0.2em] text-xs">Verifying Link</p>
                        <p className="text-white/40 text-[10px] uppercase tracking-widest">Validating Reset Fragment…</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <div className="w-full max-w-md space-y-8">
                    <div className="sakura-glass p-10 text-center space-y-8 shadow-depth3 border-destructive/20 bg-destructive/5">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-destructive/20">
                            <X className="h-10 w-10 text-destructive" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-xl font-black uppercase tracking-widest text-destructive">Invalid Sequence</h1>
                            <p className="text-xs text-white/40 leading-relaxed">
                                This recovery fragment has expired or is cryptographically invalid.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("/forgot-password")}
                            className="sakura-ripple-button is-default w-full h-12 flex items-center justify-center font-black uppercase tracking-[0.15em] text-xs"
                        >
                            Request New Fragment
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const passwordStrength = checkPasswordStrength(formData.password);

    return (
        <div className="flex min-h-screen items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase">Yura</h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">Intelligence Hub Recovery</p>
                </div>

                <div className="sakura-glass p-8 space-y-8 shadow-depth3">
                    <div className="text-center space-y-1">
                        <h2 className="text-lg font-black uppercase tracking-widest">Update Key</h2>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Secure your account with a new primary key</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">New Key</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={16} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => {
                                        setFormData({ ...formData, password: e.target.value });
                                        setErrors({});
                                    }}
                                    className="sakura-input h-12 w-full pl-12 pr-12 text-sm focus-visible:ring-primary/20"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>

                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="mt-3 space-y-2 px-1">
                                    <div className="flex gap-1.5">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "h-1 flex-1 rounded-full transition-all duration-500",
                                                    i < passwordStrength.score ? "bg-primary shadow-glow" : "bg-white/5"
                                                )}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/30">
                                        Strength Status: <span className="text-primary">{passwordStrength.label}</span>
                                    </p>
                                </div>
                            )}

                            {errors.password && (
                                <p className="mt-1 px-1 text-[9px] font-bold uppercase tracking-widest text-destructive">
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Confirm Key</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={16} />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={e => {
                                        setFormData({ ...formData, confirmPassword: e.target.value });
                                        setErrors({});
                                    }}
                                    className="sakura-input h-12 w-full pl-12 pr-12 text-sm focus-visible:ring-primary/20"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1 px-1 text-[9px] font-bold uppercase tracking-widest text-destructive">
                                    {errors.confirmPassword}
                                </p>
                            )}
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
                                <Check size={16} />
                            )}
                            {loading ? "Updating…" : "Update Sequence"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
