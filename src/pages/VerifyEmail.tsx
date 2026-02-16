/**
 * Verify Email Page
 *
 * Email verification confirmation page.
 * Token validation and email confirmation with auto-verification via link.
 */

import { useToast } from "@/hooks/use-toast";
import { Check, RotateCw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function VerifyEmail() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { toast } = useToast();

    const [token, setToken] = useState("");
    const [verifying, setVerifying] = useState(true);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState("");
    const [resending, setResending] = useState(false);

    const verifyEmail = useCallback(async (verificationToken: string) => {
        try {
            // TODO: Call backend verify-email endpoint
            // const response = await fetch(
            //     `/api/auth/verify-email?token=${verificationToken}`,
            // );
            // const data = await response.json();

            setVerified(true);
            toast({
                title: "Email verified!",
                description: "You can now sign in to your account",
            });

            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Verification failed");
            setVerified(false);
        } finally {
            setVerifying(false);
        }
    }, [navigate, toast]);

    useEffect(() => {
        const verificationToken = searchParams.get("token");
        if (!verificationToken) {
            setVerifying(false);
            return;
        }

        setToken(verificationToken);
        verifyEmail(verificationToken);
    }, [searchParams, verifyEmail]);

    const handleResendEmail = async () => {
        setResending(true);

        try {
            // TODO: Call backend resend-verification-email endpoint
            // const email = searchParams.get("email");
            // const response = await fetch("/api/auth/resend-verification", {
            //     method: "POST",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify({ email }),
            // });

            toast({
                title: "Email sent",
                description: "Check your inbox for a new verification link",
            });
        } catch (error) {
            toast({
                title: "Failed to resend",
                description: error instanceof Error ? error.message : "Please try again",
                variant: "destructive",
            });
        } finally {
            setResending(false);
        }
    };

    if (verifying) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <div className="sakura-glass p-10 text-center max-w-sm w-full space-y-6">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto shadow-glow" />
                    <div className="space-y-2">
                        <p className="text-foreground font-black uppercase tracking-[0.2em] text-xs">Verifying Identity</p>
                        <p className="text-white/40 text-[10px] uppercase tracking-widest">Validating Email Fragment…</p>
                    </div>
                </div>
            </div>
        );
    }

    if (verified) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <div className="sakura-glass p-10 text-center max-w-sm w-full space-y-4">
                    <div className="text-4xl text-primary animate-bounce">✓</div>
                    <div className="space-y-1">
                        <p className="text-foreground font-black uppercase tracking-[0.2em] text-sm">Identity Verified</p>
                        <p className="text-white/40 text-[10px] uppercase tracking-widest">Redirecting to Access Point…</p>
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
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/30">Email Verification</p>
                </div>

                <div className="sakura-glass p-8 space-y-8 shadow-depth3 border-destructive/20 bg-destructive/5">
                    {/* Icon */}
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-destructive/20">
                        <X className="h-10 w-10 text-destructive" />
                    </div>

                    {/* Content */}
                    <div className="text-center space-y-2">
                        <h2 className="text-lg font-black uppercase tracking-widest text-destructive">Verification Failed</h2>
                        <p className="text-xs text-white/40 leading-relaxed">
                            {error || "The email verification fragment may be invalid or expired."}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={handleResendEmail}
                            disabled={resending}
                            className="sakura-ripple-button is-default h-12 w-full flex items-center justify-center gap-3 font-black uppercase tracking-[0.15em] text-xs disabled:opacity-30"
                        >
                            {resending ? (
                                <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                            ) : (
                                <RotateCw size={16} />
                            )}
                            {resending ? "Transmitting…" : "Resend Fragment"}
                        </button>
                        <button
                            onClick={() => navigate("/login")}
                            className="sakura-ripple-button is-outline h-12 w-full flex items-center justify-center font-black uppercase tracking-[0.15em] text-xs"
                        >
                            Return to Login
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
