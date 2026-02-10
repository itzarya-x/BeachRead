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
            <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center gap-2 text-sm text-yellow-800">
                <WifiOff className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">
                    You're offline. Your changes will sync automatically when you're back online. Sign in unavailable.
                </span>
            </div>
        );
    }

    if (showReconnectMessage) {
        return (
            <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center gap-2 text-sm text-green-800 animate-in fade-in">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Back online! Syncing your changes now...</span>
            </div>
        );
    }

    return null;
}
