/**
 * Auth Callback Handler
 *
 * Purpose: Handle OAuth redirect from Supabase
 * - Reads session from URL
 * - Finalizes authentication
 * - Checks if vault migration is needed
 * - Redirects to home or intended path
 * - Shows error if callback fails
 *
 * Flow:
 * 1. User clicks "Login with Google"
 * 2. Redirected to Supabase OAuth screen
 * 3. User authorizes app
 * 4. Redirected back to /auth/callback
 * 5. This component validates session
 * 6. Checks if vault migration is needed
 * 7. Redirects to home (or intended path)
 */

import { useAuth } from "@/context/AuthContext";
import { useSyncUIContext } from "@/context/SyncUIContext";
import { getCloudVaultCount, getLocalVaultCount, isMigrationNeeded } from "@/lib/vault-migration";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function AuthCallback() {
    const navigate = useNavigate();
    const { loading, user, error } = useAuth();
    const syncUI = useSyncUIContext();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

    useEffect(() => {
        // Give Supabase client time to process session from URL
        const timer = setTimeout(async () => {
            if (user) {
                setStatus("success");

                // Check if vault migration is needed
                try {
                    const migrationNeeded = await isMigrationNeeded(user.id);

                    if (migrationNeeded) {
                        // Get counts for dialog
                        const localCount = getLocalVaultCount();
                        const cloudCount = await getCloudVaultCount(user.id);

                        // Show first login dialog with migration options
                        syncUI.showFirstLogin(localCount, cloudCount);
                    } else {
                        // No migration needed, proceed to intended path
                        const intendedPath = sessionStorage.getItem("intendedPath");
                        sessionStorage.removeItem("intendedPath");
                        navigate(intendedPath || "/", { replace: true });
                    }
                } catch (err) {
                    console.error("Migration check failed:", err);
                    // Continue anyway - user can do migration later
                    const intendedPath = sessionStorage.getItem("intendedPath");
                    sessionStorage.removeItem("intendedPath");
                    navigate(intendedPath || "/", { replace: true });
                }
            } else if (error) {
                setStatus("error");
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [user, error, navigate, syncUI]);

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <div className="sakura-glass p-10 text-center max-w-sm w-full space-y-6">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto shadow-glow" />
                    <div className="space-y-2">
                        <p className="text-foreground font-black uppercase tracking-[0.2em] text-xs">Synchronising</p>
                        <p className="text-white/40 text-[10px] uppercase tracking-widest">Finalising Neural Link…</p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <div className="sakura-glass p-10 text-center max-w-md w-full space-y-6 border-destructive/20 bg-destructive/5">
                    <div className="space-y-2">
                        <p className="text-destructive font-black uppercase tracking-[0.2em] text-sm">Authentication Failed</p>
                        <p className="text-white/50 text-xs">
                            {error || "An error occurred during synchronisation."}
                        </p>
                    </div>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => navigate("/", { replace: true })}
                            className="sakura-ripple-button is-outline px-6 py-2.5 text-[10px] font-black uppercase tracking-widest"
                        >
                            Return Home
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="sakura-ripple-button is-default px-6 py-2.5 text-[10px] font-black uppercase tracking-widest"
                        >
                            Retry Link
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Success state (brief moment before redirect)
    return (
        <div className="flex min-h-screen items-center justify-center p-6">
            <div className="sakura-glass p-10 text-center max-w-sm w-full space-y-4">
                <div className="text-4xl text-primary animate-bounce">✓</div>
                <div className="space-y-1">
                    <p className="text-foreground font-black uppercase tracking-[0.2em] text-sm">Welcome Back</p>
                    <p className="text-white/40 text-[10px] uppercase tracking-widest">Redirecting to Intelligence Hub…</p>
                </div>
            </div>
        </div>
    );
}
