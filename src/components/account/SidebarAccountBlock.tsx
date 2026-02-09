/**
 * Sidebar Account Block (PHASE 1)
 *
 * Shows user account status at bottom of sidebar.
 * - Not logged in: CTA to sign in
 * - Logged in: Shows user email, cloud status, click to open panel
 *
 * DESIGN PRINCIPLE: Visibility + Control
 * User always knows: am I logged in? who am I? is cloud active?
 */

import { useAuth } from "@/context/AuthContext";
import { useCloudSyncStatus } from "@/hooks/useCloudSyncStatus";
import { Cloud } from "lucide-react";
import { useState } from "react";
import { AccountDetailsPanel } from "./AccountDetailsPanel";
import { LoginModal } from "./LoginModal";

interface SidebarAccountBlockProps {
    collapsed?: boolean;
}

export function SidebarAccountBlock({ collapsed = false }: SidebarAccountBlockProps) {
    const { user, isAuthenticated, loading } = useAuth();
    const syncStatus = useCloudSyncStatus();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showAccountPanel, setShowAccountPanel] = useState(false);

    if (loading) {
        return null;
    }

    if (!isAuthenticated) {
        // Not logged in: Show CTA
        return (
            <>
                <button
                    onClick={() => setShowLoginModal(true)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors text-blue-700 text-sm font-medium ${
                        collapsed ? "justify-center" : ""
                    }`}
                    title="Sign in to enable cloud sync"
                >
                    <Cloud size={16} />
                    {!collapsed && <span>Sign in for sync</span>}
                </button>

                <LoginModal isOpen={showLoginModal} onOpenChange={setShowLoginModal} />
            </>
        );
    }

    // Logged in: Show account info
    if (collapsed) {
        return (
            <>
                <button
                    onClick={() => setShowAccountPanel(true)}
                    className="w-full flex items-center justify-center px-3 py-2.5 rounded-lg hover:bg-surface-2 transition-colors group relative"
                    title={`${user?.email || "Account"} — Click to manage`}
                >
                    {user?.avatar ? (
                        <img src={user.avatar} alt={user.email} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
                            {(user?.email?.[0] || "U").toUpperCase()}
                        </div>
                    )}

                    {/* Status dot */}
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-surface-1" />
                </button>

                <AccountDetailsPanel isOpen={showAccountPanel} onOpenChange={setShowAccountPanel} />
            </>
        );
    }

    return (
        <>
            <button
                onClick={() => setShowAccountPanel(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-2 transition-colors group"
            >
                {/* Avatar */}
                <div className="relative">
                    {user?.avatar ? (
                        <img src={user.avatar} alt={user.email} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {(user?.email?.[0] || "U").toUpperCase()}
                        </div>
                    )}

                    {/* Cloud status dot */}
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-surface-1 animate-pulse" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                        {syncStatus.message}
                    </p>
                </div>
            </button>

            <AccountDetailsPanel isOpen={showAccountPanel} onOpenChange={setShowAccountPanel} />
        </>
    );
}
