/**
 * First Login Prompt (PHASE 6)
 *
 * Welcome dialog shown on first cloud sign-in.
 * - Celebrates user migration to cloud
 * - Explains cloud sync benefits
 * - One-time display
 */

import { useAuth } from "@/context/AuthContext";
import { Cloud, CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";

const FIRST_LOGIN_STORAGE_KEY = "yura_first_login_shown";

export function FirstLoginPrompt() {
    const { isAuthenticated, user } = useAuth();
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Only show on first login
        if (isAuthenticated && user) {
            const alreadyShown = localStorage.getItem(FIRST_LOGIN_STORAGE_KEY);
            if (!alreadyShown) {
                setShowPrompt(true);
                localStorage.setItem(FIRST_LOGIN_STORAGE_KEY, "true");
            }
        }
    }, [isAuthenticated, user]);

    if (!showPrompt) return null;

    const handleDismiss = () => {
        setShowPrompt(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-surface-1 rounded-lg shadow-lg max-w-md w-full border border-surface-2">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-surface-2">
                    <h2 className="text-xl font-bold">Welcome to Cloud Sync!</h2>
                    <button
                        onClick={handleDismiss}
                        className="p-1 hover:bg-surface-2 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Icon */}
                    <div className="flex justify-center">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                            <Cloud className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>

                    {/* Message */}
                    <div className="text-center space-y-2">
                        <p className="text-foreground">
                            Your anime library is now synced to the cloud.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Your data is automatically backed up and secured.
                        </p>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-2 pt-2">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                            <span className="text-sm">Access your lists from any device</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                            <span className="text-sm">Automatic daily backups</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                            <span className="text-sm">Never lose your data again</span>
                        </div>
                    </div>

                    {/* Callout */}
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-xs text-blue-900">
                            💡 Your local data stays on this device. Cloud is completely optional and can be disabled anytime.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-surface-2 flex gap-2">
                    <button
                        onClick={handleDismiss}
                        className="flex-1 px-4 py-2 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors font-medium"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}
