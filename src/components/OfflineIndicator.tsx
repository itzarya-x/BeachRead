/**
 * Offline Indicator
 *
 * Appears at the top of the app when network is unavailable.
 * Shows helpful message and auto-dismisses when back online.
 */

import { useAuth } from "@/context/AuthContext";
import { Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineIndicator() {
    const { isOnline } = useAuth();
    const [show, setShow] = useState(false);

    // Show notification when going offline
    useEffect(() => {
        if (!isOnline) {
            setShow(true);
        } else if (show) {
            // Fade out when coming back online
            const timer = setTimeout(() => setShow(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, show]);

    if (!show) return null;

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
                isOnline ? "bg-green-500 border-b border-green-600" : "bg-yellow-500 border-b border-yellow-600"
            }`}
        >
            <div className="max-w-full px-4 py-2 flex items-center justify-center gap-2 text-white text-sm font-medium">
                {isOnline ? (
                    <>
                        <Wifi size={16} />
                        You're back online
                    </>
                ) : (
                    <>
                        <WifiOff size={16} />
                        You're offline — sync paused
                    </>
                )}
            </div>
        </div>
    );
}
