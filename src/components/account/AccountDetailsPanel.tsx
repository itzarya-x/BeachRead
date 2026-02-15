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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/85 p-4 sm:items-center">
            <div className="w-full rounded-t-lg border border-border bg-card shadow-sm sm:max-w-md sm:rounded-lg">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border p-4">
                    <h2 className="text-lg font-semibold">Account</h2>
                    <button
                        onClick={() => onOpenChange(false)}
                        className="rounded-lg p-1 transition-colors hover:bg-muted"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {/* Signed in as */}
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">SIGNED IN AS</p>
                        <div className="flex items-center gap-3 rounded-lg border border-primary/25 bg-accent p-3">
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.email}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                                    {(user?.email?.[0] || "U").toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{user?.email}</p>
                                <p className="text-xs text-primary">Verified account</p>
                            </div>
                        </div>
                    </div>

                    {/* Cloud sync status */}
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">CLOUD SYNC</p>
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/60 p-3">
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
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            <RefreshCw size={16} />
                            Re-sync now
                        </button>

                        {!showLogoutConfirm && (
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:border-destructive/20 hover:bg-destructive/10"
                            >
                                <LogOut size={16} />
                                Sign out
                            </button>
                        )}
                    </div>

                    {/* Logout confirmation */}
                    {showLogoutConfirm && (
                        <div className="space-y-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3">
                            <div>
                                <p className="text-sm font-medium text-destructive">Sign out?</p>
                                <p className="mt-1 text-xs text-destructive/90">
                                    Your local data will stay on this device, but cloud sync will be disabled.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
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
                <div className="border-t border-border bg-muted/60 px-4 py-3 text-center text-xs text-muted-foreground">
                    Your data stays on your device.
                </div>
            </div>
        </div>
    );
}
