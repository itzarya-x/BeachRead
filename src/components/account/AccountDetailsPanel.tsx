/**
 * Account Details Panel (PHASE 3)
 *
 * Shows account information and provides logout action.
 * - Displays signed-in email
 * - Shows cloud sync status
 * - Re-sync button to manually trigger sync
 * - Logout with confirmation
 */

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCloudSyncStatus } from "@/hooks/useCloudSyncStatus";
import { ChevronRight, LogOut, RefreshCw, X } from "lucide-react";
import { useState } from "react";

interface AccountDetailsPanelProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AccountDetailsPanel({ isOpen, onOpenChange }: AccountDetailsPanelProps) {
    const { user, logout } = useAuth();
    const syncStatus = useCloudSyncStatus();
    const { toast } = useToast();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await logout();

            toast({
                title: "Signed out",
                description: "Cloud sync has been disabled.",
            });

            onOpenChange(false);
            setShowLogoutConfirm(false);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to sign out. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleResync = async () => {
        try {
            // TODO: Trigger manual sync through sync engine
            toast({
                title: "Syncing",
                description: "Starting cloud sync now.",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to sync. Please try again.",
                variant: "destructive",
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-surface-1 rounded-t-lg sm:rounded-lg shadow-lg w-full sm:max-w-md border border-surface-2">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-surface-2">
                    <h2 className="text-lg font-semibold">Account</h2>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="p-1 hover:bg-surface-2 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Signed in as */}
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">SIGNED IN AS</p>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.email}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                    {(user?.email?.[0] || "U").toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                                <p className="text-xs text-blue-700">Verified account</p>
                            </div>
                        </div>
                    </div>

                    {/* Cloud sync status */}
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">CLOUD SYNC</p>
                        <div className="flex items-center gap-2 p-3 rounded-lg border border-surface-2 bg-surface-2">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                            <div className="flex-1">
                                <p className="text-sm font-medium">Enabled</p>
                                <p className="text-xs text-muted-foreground">{syncStatus.message}</p>
                            </div>
                            <ChevronRight size={16} className="text-muted-foreground" />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2">
                        <button
                            onClick={handleResync}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors font-medium text-sm"
                        >
                            <RefreshCw size={16} />
                            Re-sync now
                        </button>

                        {!showLogoutConfirm && (
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors font-medium text-sm border border-transparent hover:border-red-200"
                            >
                                <LogOut size={16} />
                                Sign out
                            </button>
                        )}
                    </div>

                    {/* Logout confirmation */}
                    {showLogoutConfirm && (
                        <div className="space-y-3 p-3 rounded-lg bg-red-50 border border-red-200">
                            <div>
                                <p className="text-sm font-medium text-red-900">Sign out?</p>
                                <p className="text-xs text-red-700 mt-1">
                                    Your local data will stay on this device, but cloud sync will be disabled.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 px-3 py-2 rounded-lg bg-white border border-red-200 text-red-700 hover:bg-red-50 transition-colors text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="flex-1 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoggingOut ? "Signing out..." : "Sign out"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-surface-2 bg-surface-2 text-center text-xs text-muted-foreground">
                    Your data stays on your device.
                </div>
            </div>
        </div>
    );
}
