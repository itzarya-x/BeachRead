/**
 * Session Restore Toast (PHASE 9)
 *
 * Welcome back notification when user's session is restored.
 * - Shows only on auto-login from stored session
 * - Informs user they're synced
 * - Auto-dismisses after 5 seconds
 */

import { useAuth } from "@/context/AuthContext";
import { Cloud, CheckCircle2 } from "lucide-react";
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
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 shadow-lg">
                <div className="flex items-center gap-2 flex-1">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-green-900">Welcome back!</p>
                        <p className="text-xs text-green-700">Your data is synced.</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowToast(false)}
                    className="text-green-600 hover:text-green-700 shrink-0"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
