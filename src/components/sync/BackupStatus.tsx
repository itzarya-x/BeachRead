/**
 * Backup Status Component
 *
 * Displays backup confidence message to user.
 * Shows when vault is safely backed up.
 */

import { BarChart3, Clock, Shield } from "lucide-react";

interface BackupStatusProps {
    isBackedUp: boolean;
    lastBackupTime?: Date;
    itemCount?: number;
}

export function BackupStatus({ isBackedUp, lastBackupTime, itemCount = 0 }: BackupStatusProps) {
    if (!isBackedUp) {
        return (
            <div className="space-y-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-yellow-300" />
                    <h3 className="font-semibold text-yellow-100">Not backed up yet</h3>
                </div>
                <p className="text-sm text-yellow-100/80">
                    Sign in and upload your vault to enable cloud backup and multi-device sync.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-300" />
                <h3 className="font-semibold text-emerald-100">Vault safely backed up</h3>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
                {lastBackupTime && (
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                        <div className="min-w-0">
                            <p className="text-xs text-emerald-100/75">Last backup</p>
                            <p className="font-medium text-emerald-100 truncate">{getTimeAgo(lastBackupTime)}</p>
                        </div>
                    </div>
                )}

                {itemCount > 0 && (
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-emerald-100/75">Items backed up</p>
                            <p className="font-medium text-emerald-100">{itemCount}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Message */}
            <p className="text-xs text-emerald-100/80">
                Your vault is synced across all your devices. Access it anywhere, anytime.
            </p>
        </div>
    );
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
}
