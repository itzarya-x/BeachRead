/**
 * Register Page
 *
 * User registration with email verification.
 * Implements form validation, password strength checks, and error handling.
 */

import { useToast } from "@/hooks/use-toast";
import { Check, Eye, EyeOff, Lock, Mail, User, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface FormErrors {
    email?: string;
    password?: string;
    confirmPassword?: string;
    name?: string;
}

interface PasswordStrength {
    score: number;
    label: string;
    color: string;
}

export function Register() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        email: "",
        name: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);

    // Password strength validator
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

    // Form validation
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = "Please enter a valid email";
        }

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        } else if (formData.name.trim().length < 2) {
            newErrors.name = "Name must be at least 2 characters";
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!acceptTerms) {
            toast({
                title: "Terms Required",
                description: "Please accept the terms and conditions",
                variant: "destructive",
            });
            return;
        }

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // TODO: Call backend registration endpoint
            // const response = await fetch("/api/auth/register", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify({
            //         email: formData.email,
            //         password: formData.password,
            //         name: formData.name,
            //     }),
            // });

            // For now, show success message
            toast({
                title: "Registration successful!",
                description: "Check your email to verify your account.",
            });

            // Redirect to home after brief delay
            setTimeout(() => {
                navigate("/", { replace: true });
            }, 2000);
        } catch (error) {
            toast({
                title: "Registration failed",
                description: error instanceof Error ? error.message : "Please try again",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const passwordStrength = checkPasswordStrength(formData.password);

    return (
        <div className="sakura-app-shell relative flex min-h-screen items-center justify-center bg-background p-4">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[10%] top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute bottom-0 right-[8%] h-72 w-72 rounded-full bg-accent/80 blur-3xl" />
            </div>
            <div className="w-full max-w-md">
                <div className="sakura-glass rounded-[var(--radius-lg)] border border-border p-6 backdrop-blur-[20px] shadow-[0_18px_30px_-24px_rgba(0,0,0,0.95)]">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold">Create Account</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Join and start archiving your anime & manga
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
                                    value={formData.email}
                                    onChange={e =>
                                        setFormData({
                                            ...formData,
                                            email: e.target.value,
                                        })
                                    }
                                    className="sakura-input w-full rounded-lg border border-border bg-input py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                                    disabled={loading}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                                    <X size={12} />
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Name Field */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Name</label>
                            <div className="relative">
                                <User
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    size={18}
                                />
                                <input
                                    type="text"
                                    placeholder="Your name"
                                    value={formData.name}
                                    onChange={e =>
                                        setFormData({
                                            ...formData,
                                            name: e.target.value,
                                        })
                                    }
                                    className="sakura-input w-full rounded-lg border border-border bg-input py-2.5 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                                    disabled={loading}
                                />
                            </div>
                            {errors.name && (
                                <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                                    <X size={12} />
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Password</label>
                            <div className="relative">
                                <Lock
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    size={18}
                                />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e =>
                                        setFormData({
                                            ...formData,
                                            password: e.target.value,
                                        })
                                    }
                                    className="sakura-input w-full rounded-lg border border-border bg-input py-2.5 pl-10 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
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
                                                    i < passwordStrength.score ? passwordStrength.color : "bg-muted"
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
                                <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
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
                                    onChange={e =>
                                        setFormData({
                                            ...formData,
                                            confirmPassword: e.target.value,
                                        })
                                    }
                                    className="sakura-input w-full rounded-lg border border-border bg-input py-2.5 pl-10 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
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
                                <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                                    <X size={12} />
                                    {errors.confirmPassword}
                                </p>
                            )}
                        </div>

                        {/* Terms Checkbox */}
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={acceptTerms}
                                onChange={e => setAcceptTerms(e.target.checked)}
                                className="h-4 w-4 rounded border-border bg-input accent-primary"
                                disabled={loading}
                            />
                            <span className="text-muted-foreground">
                                I agree to the{" "}
                                <a href="#" className="text-primary hover:underline">
                                    Terms of Service
                                </a>
                            </span>
                        </label>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="sakura-ripple-button is-default mt-6 flex w-full items-center justify-center gap-2 px-4 py-2.5 font-medium disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-sm text-muted-foreground mt-4">
                        Already have an account?{" "}
                        <a href="/login" className="font-medium text-primary hover:underline">
                            Sign in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
