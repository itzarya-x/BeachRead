/**
 * Verify Email Page
 *
 * Email verification confirmation page.
 * Token validation and email confirmation with auto-verification via link.
 */

import { useToast } from "@/hooks/use-toast";
import { Check, RotateCw, X } from "lucide-react";
import { useEffect, useState } from "react";
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

    useEffect(() => {
        const verificationToken = searchParams.get("token");
        const email = searchParams.get("email");

        if (!verificationToken) {
            setVerifying(false);
            return;
        }

        setToken(verificationToken);
        verifyEmail(verificationToken);
    }, [searchParams]);

    const verifyEmail = async (verificationToken: string) => {
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
    };

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
            <div className="min-h-screen bg-gradient-to-br from-surface-1 to-surface-2 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-surface-1 border border-surface-2 rounded-xl shadow-lg p-6 text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
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
            <div className="min-h-screen bg-gradient-to-br from-surface-1 to-surface-2 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-surface-1 border border-surface-2 rounded-xl shadow-lg p-6 text-center space-y-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100">
                            <Check className="w-6 h-6 text-green-600" />
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
        <div className="min-h-screen bg-gradient-to-br from-surface-1 to-surface-2 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-surface-1 border border-surface-2 rounded-xl shadow-lg p-6 space-y-4">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
                        <X className="w-6 h-6 text-red-600" />
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
                            className="w-full px-4 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                            className="w-full px-4 py-2.5 rounded-lg bg-surface-2 text-foreground font-medium hover:bg-surface-3 transition-colors"
                        >
                            Back to Sign In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
