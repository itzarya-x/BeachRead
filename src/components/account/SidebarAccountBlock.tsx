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
                            : "border border-primary/25 bg-accent text-primary hover:bg-accent/80"
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
                    className="group relative flex w-full items-center justify-center rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
                    title={`${user?.email || "Account"} — ${!isOnline ? "Offline — sync paused" : "Click to manage"}`}
                >
                    {user?.avatar ? (
                        <img src={user.avatar} alt={user.email} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                            {(user?.email?.[0] || "U").toUpperCase()}
                        </div>
                    )}

                    {/* Status indicator: green when online, yellow when offline */}
                    <div
                        className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-card ${
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
                className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted"
            >
                <div className="relative">
                    {user?.avatar ? (
                        <img src={user.avatar} alt={user.email} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                            {(user?.email?.[0] || "U").toUpperCase()}
                        </div>
                    )}

                    {/* Status indicator: green when online, yellow when offline */}
                    <div
                        className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card ${
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
