/**
 * Offline Banner
 *
 * Shows when user is offline.
 * Informs them that changes will sync when reconnected.
 * Also warns about login unavailability.
 */

import { useOnline } from "@/hooks/useOnline";
import { CheckCircle, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineBanner() {
    const isOnline = useOnline();
    const [wasOffline, setWasOffline] = useState(false);
    const [showReconnectMessage, setShowReconnectMessage] = useState(false);

    useEffect(() => {
        if (isOnline) {
            if (wasOffline) {
                setShowReconnectMessage(true);
                setTimeout(() => setShowReconnectMessage(false), 4000);
            }
            setWasOffline(false);
        } else {
            setWasOffline(true);
        }
    }, [isOnline, wasOffline]);

    if (!isOnline) {
        return (
            <div className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
                <WifiOff className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">
                    You're offline. Your changes will sync automatically when you're back online. Sign in unavailable.
                </span>
            </div>
        );
    }

    if (showReconnectMessage) {
        return (
            <div className="animate-in fade-in flex items-center gap-2 border-b border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Back online! Syncing your changes now...</span>
            </div>
        );
    }

    return null;
}
