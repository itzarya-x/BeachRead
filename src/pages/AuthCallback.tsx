/**
 * Auth Callback Handler
 *
 * Purpose: Handle OAuth redirect from Supabase
 * - Reads session from URL
 * - Finalizes authentication
 * - Redirects to home or intended path
 * - Shows error if callback fails
 *
 * Flow:
 * 1. User clicks "Login with Google"
 * 2. Redirected to Supabase OAuth screen
 * 3. User authorizes app
 * 4. Redirected back to /auth/callback
 * 5. This component validates session
 * 6. Redirects to home (or intended path)
 */

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function AuthCallback() {
    const navigate = useNavigate();
    const { loading, user, error } = useAuth();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

    useEffect(() => {
        // Give Supabase client time to process session from URL
        const timer = setTimeout(() => {
            if (user) {
                setStatus("success");
                // Get intended path from sessionStorage
                const intendedPath = sessionStorage.getItem("intendedPath");
                sessionStorage.removeItem("intendedPath");

                // Redirect to intended path or home
                navigate(intendedPath || "/", { replace: true });
            } else if (error) {
                setStatus("error");
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [user, error, navigate]);

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm">Completing sign in…</p>
                </div>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center max-w-md">
                    <p className="text-destructive mb-2 font-semibold text-lg">Sign In Failed</p>
                    <p className="text-sm text-muted-foreground mb-4">
                        {error || "An error occurred during authentication."}
                    </p>
                    <div className="flex gap-2 justify-center flex-wrap">
                        <button
                            onClick={() => navigate("/", { replace: true })}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
                        >
                            Go Home
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 text-sm"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Success state (brief moment before redirect)
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="text-center">
                <div className="text-3xl mb-4">✓</div>
                <p className="text-foreground font-medium">Welcome back!</p>
                <p className="text-muted-foreground text-sm">Redirecting…</p>
            </div>
        </div>
    );
}
