/**
 * Empty State Hint (PHASE 7)
 *
 * Subtle promotion of cloud sync features on empty stats/tiers pages.
 * - Shows only when user is NOT logged in AND page is empty
 * - Suggests enabling cloud sync
 * - Dismissible
 */

import { useAuth } from "@/context/AuthContext";
import { Cloud, X } from "lucide-react";
import { useState } from "react";

interface EmptyStateHintProps {
    onSignInClick?: () => void;
}

export function EmptyStateHint({ onSignInClick }: EmptyStateHintProps) {
    const { isAuthenticated } = useAuth();
    const [dismissed, setDismissed] = useState(false);

    // Don't show if logged in or dismissed
    if (isAuthenticated || dismissed) {
        return null;
    }

    return (
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-start gap-3">
                <Cloud className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Sign in to enable cloud sync</p>
                    <p className="text-xs text-blue-700 mt-1">
                        Sync your anime and manga lists across all your devices. Your data stays safe.
                    </p>
                    <button
                        onClick={onSignInClick}
                        className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 underline"
                    >
                        Learn more →
                    </button>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className="p-1 hover:bg-blue-100 rounded transition-colors shrink-0"
                >
                    <X size={16} className="text-blue-600" />
                </button>
            </div>
        </div>
    );
}
