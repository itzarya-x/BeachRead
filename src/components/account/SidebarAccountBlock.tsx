/**
 * Sidebar Account Block (PHASE 1)
 *
 * Shows user account status at bottom of sidebar.
 * - Not logged in: CTA to sign in
 * - Logged in: Shows user email, cloud status, click to open panel
 * - OFFLINE: Shows offline indicator & message
 */

import { useAuth } from "@/context/AuthContext";
import { useCloudSyncStatus } from "@/hooks/useCloudSyncStatus";
import { Cloud, WifiOff } from "lucide-react";
import { useState } from "react";
import { AccountDetailsPanel } from "./AccountDetailsPanel";
import { LoginModal } from "./LoginModal";

interface SidebarAccountBlockProps {
    collapsed?: boolean;
}

export function SidebarAccountBlock({ collapsed = false }: SidebarAccountBlockProps) {
    const { user, isAuthenticated, loading, isOnline } = useAuth();
    const syncStatus = useCloudSyncStatus();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showAccountPanel, setShowAccountPanel] = useState(false);

    if (loading) {
        return null;
    }

    // NOT LOGGED IN - Show login button (disabled if offline)
    if (!isAuthenticated) {
        return (
            <>
                <button
                    onClick={() => setShowLoginModal(true)}
                    disabled={!isOnline}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                        !isOnline
                            ? "bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 text-yellow-700 cursor-not-allowed opacity-60"
                            : "bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700"
                    } ${collapsed ? "justify-center" : ""}`}
                    title={
                        !isOnline ? "You are offline — internet required for sign in" : "Sign in to enable cloud sync"
                    }
                >
                    {!isOnline ? <WifiOff size={16} /> : <Cloud size={16} />}
                    {!collapsed && <span>{!isOnline ? "Offline" : "Sign in for sync"}</span>}
                </button>

                <LoginModal isOpen={showLoginModal} onOpenChange={setShowLoginModal} />
            </>
        );
    }

    // LOGGED IN - Collapsed view (avatar with status dot)
    if (collapsed) {
        return (
            <>
                <button
                    onClick={() => setShowAccountPanel(true)}
                    className="w-full flex items-center justify-center px-3 py-2.5 rounded-lg hover:bg-surface-2 transition-colors group relative"
                    title={`${user?.email || "Account"} — ${!isOnline ? "Offline — sync paused" : "Click to manage"}`}
                >
                    {user?.avatar ? (
                        <img src={user.avatar} alt={user.email} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                            {(user?.email?.[0] || "U").toUpperCase()}
                        </div>
                    )}

                    {/* Status indicator: green when online, yellow when offline */}
                    <div
                        className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-surface-1 ${
                            isOnline ? "bg-green-500" : "bg-yellow-500"
                        }`}
                    />
                </button>

                <AccountDetailsPanel isOpen={showAccountPanel} onOpenChange={setShowAccountPanel} />
            </>
        );
    }

    // LOGGED IN - Full view with email and sync status
    return (
        <>
            <button
                onClick={() => setShowAccountPanel(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-2 transition-colors group"
            >
                <div className="relative">
                    {user?.avatar ? (
                        <img src={user.avatar} alt={user.email} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {(user?.email?.[0] || "U").toUpperCase()}
                        </div>
                    )}

                    {/* Status indicator: green when online, yellow when offline */}
                    <div
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface-1 ${
                            isOnline ? "bg-green-500 animate-pulse" : "bg-yellow-500"
                        }`}
                    />
                </div>

                <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        {!isOnline ? (
                            <>
                                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full inline-block" />
                                Offline — sync paused
                            </>
                        ) : (
                            <>
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                                {syncStatus.message}
                            </>
                        )}
                    </p>
                </div>
            </button>

            <AccountDetailsPanel isOpen={showAccountPanel} onOpenChange={setShowAccountPanel} />
        </>
    );
}
