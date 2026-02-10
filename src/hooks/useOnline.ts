/**
 * useOnline Hook
 *
 * Detects network availability and provides reactive updates.
 * - Subscribes to online/offline events
 * - Returns current online state
 * - Auto-updates when connection changes
 */

import { useEffect, useState } from "react";

export function useOnline(): boolean {
    const [isOnline, setIsOnline] = useState(() => {
        // Check initial state from navigator
        return typeof navigator !== "undefined" ? navigator.onLine : true;
    });

    useEffect(() => {
        // Handle online event
        const handleOnline = () => {
            setIsOnline(true);
        };

        // Handle offline event
        const handleOffline = () => {
            setIsOnline(false);
        };

        // Subscribe to online/offline events
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Cleanup
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return isOnline;
}
