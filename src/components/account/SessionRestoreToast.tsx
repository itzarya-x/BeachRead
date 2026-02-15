/**
 * Session Restore Toast (PHASE 9)
 *
 * Welcome back notification when user's session is restored.
 * - Shows only on auto-login from stored session
 * - Informs user they're synced
 * - Auto-dismisses after 5 seconds
 */

import { useAuth } from "@/context/AuthContext";
import { CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";

const SESSION_RESTORE_STORAGE_KEY = "yura_session_restored";

export function SessionRestoreToast() {
    const { isAuthenticated, user, loading } = useAuth();
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        // Check if session was just restored (page refresh with existing session)
        if (!loading && isAuthenticated && user) {
            const wasRestored = sessionStorage.getItem(SESSION_RESTORE_STORAGE_KEY);
            if (!wasRestored) {
                setShowToast(true);
                sessionStorage.setItem(SESSION_RESTORE_STORAGE_KEY, "true");

                // Auto-dismiss after 5 seconds
                const timer = setTimeout(() => {
                    setShowToast(false);
                }, 5000);

                return () => clearTimeout(timer);
            }
        }
    }, [isAuthenticated, user, loading]);

    if (!showToast || loading) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 animate-in slide-in-from-bottom-4">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.3)] backdrop-blur-sm">
                <div className="flex items-center gap-2 flex-1">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-emerald-100">Welcome back</p>
                        <p className="text-xs text-emerald-100/80">Your vault data is synced.</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowToast(false)}
                    aria-label="Dismiss session restore message"
                    className="shrink-0 text-emerald-200 hover:text-white"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
