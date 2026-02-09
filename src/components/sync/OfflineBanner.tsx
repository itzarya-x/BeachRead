/**
 * Offline Banner
 *
 * Shows when user is offline.
 * Informs them that changes will sync when reconnected.
 */

import { CheckCircle, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineBanner() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [wasOffline, setWasOffline] = useState(false);
    const [showReconnectMessage, setShowReconnectMessage] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            if (wasOffline) {
                setShowReconnectMessage(true);
                setTimeout(() => setShowReconnectMessage(false), 4000);
            }
            setWasOffline(false);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setWasOffline(true);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [wasOffline]);

    if (!isOnline) {
        return (
            <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center gap-2 text-sm text-yellow-800">
                <WifiOff className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">
                    You're offline. Your changes will sync automatically when you're back online.
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
