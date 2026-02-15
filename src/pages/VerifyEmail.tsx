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
            <div className="sakura-app-shell relative flex min-h-screen items-center justify-center bg-background p-4">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-[10%] top-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
                    <div className="absolute bottom-0 right-[8%] h-72 w-72 rounded-full bg-accent/80 blur-3xl" />
                </div>
                <div className="w-full max-w-md">
                    <div className="space-y-4 sakura-glass rounded-[var(--radius-lg)] border border-border p-6 text-center backdrop-blur-[20px] shadow-[0_18px_30px_-24px_rgba(0,0,0,0.95)]">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Verifying Email</h1>
                            <p className="text-muted-foreground text-sm mt-2">
                                Please wait while we verify your email address...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (verified) {
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
                            <h1 className="text-2xl font-bold">Email Verified!</h1>
                            <p className="text-muted-foreground text-sm mt-2">
                                Your email has been successfully verified. Redirecting to sign in...
                            </p>
                        </div>
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
                <div className="space-y-4 sakura-glass rounded-[var(--radius-lg)] border border-border p-6 backdrop-blur-[20px] shadow-[0_18px_30px_-24px_rgba(0,0,0,0.95)]">
                    {/* Icon */}
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20">
                        <X className="h-6 w-6 text-destructive" />
                    </div>

                    {/* Content */}
                    <div>
                        <h1 className="text-2xl font-bold">Verification Failed</h1>
                        <p className="text-muted-foreground text-sm mt-2">
                            {error || "The verification link may be invalid or expired."}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                        <button
                            onClick={handleResendEmail}
                            disabled={resending}
                            className="sakura-ripple-button is-default flex w-full items-center justify-center gap-2 px-4 py-2.5 font-medium disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {resending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <RotateCw size={18} />
                                    Resend Verification Email
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => navigate("/login")}
                            className="sakura-ripple-button is-outline w-full px-4 py-2.5 font-medium text-foreground"
                        >
                            Back to Sign In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
