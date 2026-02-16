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
        <div className="flex min-h-screen items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase">Yura</h1>
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">Join the Intelligence Hub</p>
                </div>

                {/* Main Bento Card */}
                <div className="sakura-glass p-8 space-y-8 shadow-depth3">
                    {/* Form Header */}
                    <div className="text-center space-y-1">
                        <h2 className="text-lg font-black uppercase tracking-widest">Create Identity</h2>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Initialise your personal archive</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Identity (Email)</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={16} />
                                <input
                                    type="email"
                                    placeholder="user@neural.link"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="sakura-input h-12 w-full pl-12 pr-4 text-sm focus-visible:ring-primary/20"
                                    disabled={loading}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 px-1 text-[9px] font-bold uppercase tracking-widest text-destructive">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Name Field */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Callsign (Name)</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={16} />
                                <input
                                    type="text"
                                    placeholder="Explorer"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="sakura-input h-12 w-full pl-12 pr-4 text-sm focus-visible:ring-primary/20"
                                    disabled={loading}
                                />
                            </div>
                            {errors.name && (
                                <p className="mt-1 px-1 text-[9px] font-bold uppercase tracking-widest text-destructive">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Primary Key (Password)</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={16} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
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

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 ml-1">Verify Key</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={16} />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
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

                        {/* Terms Checkbox */}
                        <label className="flex items-center gap-3 px-1 cursor-pointer group">
                            <div className="relative flex items-center justify-center">
                                <input
                                    type="checkbox"
                                    checked={acceptTerms}
                                    onChange={e => setAcceptTerms(e.target.checked)}
                                    className="peer h-5 w-5 appearance-none rounded-lg border border-white/10 bg-white/5 checked:border-primary/50 checked:bg-primary/10 transition-all"
                                    disabled={loading}
                                />
                                <Check className="absolute h-3 w-3 text-primary opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 group-hover:text-white/50 transition-colors">
                                I agree to the <span className="text-primary/60">Protocols</span>
                            </span>
                        </label>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="sakura-ripple-button is-default mt-4 h-12 w-full flex items-center justify-center gap-3 font-black uppercase tracking-[0.15em] text-xs disabled:opacity-30"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                            ) : (
                                <Check size={16} />
                            )}
                            {loading ? "Initialising…" : "Initialise Account"}
                        </button>
                    </form>

                    {/* Footer */}
                    <p className="text-center text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
                        Identity already exists?{" "}
                        <a href="/login" className="text-primary hover:text-primary/80 transition-colors">
                            Access Vault
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
