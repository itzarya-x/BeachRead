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
        <div className="rounded-xl border border-primary/25 bg-accent p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <Cloud className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Sign in to enable cloud sync</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Sync your anime and manga lists across all your devices. Your data stays safe.
                    </p>
                    <button
                        onClick={onSignInClick}
                        className="mt-2 text-xs font-semibold text-primary hover:text-primary/80 underline"
                    >
                        Learn more →
                    </button>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className="shrink-0 rounded p-1 transition-colors hover:bg-muted"
                >
                    <X size={16} className="text-muted-foreground" />
                </button>
            </div>
        </div>
    );
}
