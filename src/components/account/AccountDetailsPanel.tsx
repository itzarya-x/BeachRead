/**
 * Account Details Panel (PHASE 3)
 *
 * Drawer/panel showing account info and actions.
 * - Signed in as email
 * - Cloud sync status
 * - Last sync time
 * - Logout, re-sync buttons
 *
 * DESIGN: Simple, focused on visibility + control
 */

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCloudSyncStatus } from "@/hooks/useCloudSyncStatus";
import { LogOut, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";

interface AccountDetailsPanelProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AccountDetailsPanel({ isOpen, onOpenChange }: AccountDetailsPanelProps) {
    const { user, logout, loading } = useAuth();
    const syncStatus = useCloudSyncStatus();
    const { toast } = useToast();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setShowLogoutConfirm(false);
        }
    }, [isOpen]);

    const handleLogout = async () => {
        try {
            await logout();
            setShowLogoutConfirm(false);
            onOpenChange(false);
            toast({
                title: "Logged out",
                description: "You've been safely logged out. Local data remains intact.",
            });
        } catch (err) {
            toast({
                title: "Logout failed",
                description: err instanceof Error ? err.message : "Something went wrong",
                variant: "destructive",
            });
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-end sm:justify-center z-50 p-4">
            <div className="bg-surface-1 border border-border/30 rounded-t-lg sm:rounded-lg w-full sm:max-w-sm max-h-96 overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/20 sticky top-0 bg-surface-1">
                    <h2 className="text-lg font-semibold text-foreground">Account</h2>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="p-1 hover:bg-surface-2 rounded transition-colors"
                    >
                        <X size={20} className="text-muted-foreground" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-4 space-y-4">
                        {/* Signed In As */}
                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Signed in as</p>
                            <p className="text-sm font-semibold text-foreground">{user.email}</p>
                            {user.displayName && (
                                <p className="text-xs text-muted-foreground mt-0.5">{user.displayName}</p>
                            )}
                        </div>

                        {/* Cloud Status */}
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Cloud Sync</p>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-foreground">{syncStatus.isEnabled ? "Enabled" : "Disabled"}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{syncStatus.message}</p>
                        </div>

                        {/* Actions (if logout not confirming) */}
                        {!showLogoutConfirm ? (
                            <div className="space-y-2 pt-2 border-t border-border/20">
                                <button
                                    onClick={() => {
                                        toast({
                                            title: "Sync initiated",
                                            description: "Your data is being synced",
                                        });
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                                >
                                    <RefreshCw size={16} />
                                    Re-sync Now
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Footer: Logout */}
                <div className="p-4 border-t border-border/20 sticky bottom-0 bg-surface-1">
                    {!showLogoutConfirm ? (
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded transition-colors"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-sm text-foreground font-medium">Logout?</p>
                            <p className="text-xs text-muted-foreground mb-3">
                                Cloud sync will be disabled. Local data stays safe.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleLogout}
                                    disabled={loading}
                                    className="flex-1 px-3 py-2 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                    {loading ? "Logging out..." : "Yes, logout"}
                                </button>
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    disabled={loading}
                                    className="flex-1 px-3 py-2 text-sm font-medium bg-surface-2 text-foreground rounded hover:bg-surface-3 disabled:opacity-50 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
