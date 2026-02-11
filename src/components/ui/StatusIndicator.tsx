/**
 * PHASE 4.1 — SYSTEM STATUS INDICATORS
 * Always show system status: saving, sync, error, offline
 */

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    CheckCircle2,
    Cloud,
    CloudOff,
    Loader2,
    RefreshCw,
    WifiOff
} from "lucide-react";

type StatusType = "idle" | "saving" | "syncing" | "success" | "error" | "offline";

interface StatusIndicatorProps {
    status: StatusType;
    message?: string;
    className?: string;
}

export function StatusIndicator({ status, message, className }: StatusIndicatorProps) {
    if (status === "idle") return null;

    const config = {
        saving: {
            icon: Loader2,
            label: message || "Saving...",
            className: "text-primary",
            animate: true,
        },
        syncing: {
            icon: RefreshCw,
            label: message || "Syncing...",
            className: "text-primary",
            animate: true,
        },
        success: {
            icon: CheckCircle2,
            label: message || "Saved",
            className: "text-green-500",
            animate: false,
        },
        error: {
            icon: AlertCircle,
            label: message || "Error",
            className: "text-destructive",
            animate: false,
        },
        offline: {
            icon: WifiOff,
            label: message || "Offline",
            className: "text-muted-foreground",
            animate: false,
        },
    };

    const { icon: Icon, label, className: statusClass, animate } = config[status];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 text-sm font-medium",
                    statusClass,
                    className
                )}
            >
                <Icon className={cn("w-4 h-4", animate && "animate-spin")} />
                <span>{label}</span>
            </motion.div>
        </AnimatePresence>
    );
}

// Floating Status Badge (for corner of screen)
interface FloatingStatusProps {
    status: StatusType;
    message?: string;
}

export function FloatingStatus({ status, message }: FloatingStatusProps) {
    if (status === "idle") return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-4 right-4 z-50"
        >
            <StatusIndicator status={status} message={message} className="shadow-lg" />
        </motion.div>
    );
}

// Inline Status (for forms, inputs)
interface InlineStatusProps {
    status: "success" | "error" | "loading";
    message: string;
}

export function InlineStatus({ status, message }: InlineStatusProps) {
    const icons = {
        success: CheckCircle2,
        error: AlertCircle,
        loading: Loader2,
    };

    const colors = {
        success: "text-green-500",
        error: "text-destructive",
        loading: "text-primary",
    };

    const Icon = icons[status];

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn("flex items-center gap-2 text-sm", colors[status])}
        >
            <Icon className={cn("w-4 h-4", status === "loading" && "animate-spin")} />
            <span>{message}</span>
        </motion.div>
    );
}

// Connection Status Badge
interface ConnectionStatusProps {
    isOnline: boolean;
    isSynced: boolean;
}

export function ConnectionStatus({ isOnline, isSynced }: ConnectionStatusProps) {
    if (isOnline && isSynced) {
        return (
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                <Cloud className="w-3 h-3" />
                <span>Synced</span>
            </div>
        );
    }

    if (isOnline && !isSynced) {
        return (
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Syncing</span>
            </div>
        );
    }

    return (
        <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
            <CloudOff className="w-3 h-3" />
            <span>Offline</span>
        </div>
    );
}

// Progress Indicator (for long operations)
interface ProgressIndicatorProps {
    progress: number; // 0-100
    label?: string;
}

export function ProgressIndicator({ progress, label }: ProgressIndicatorProps) {
    return (
        <div className="space-y-2">
            {label && (
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-foreground font-medium">{Math.round(progress)}%</span>
                </div>
            )}
            <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-primary rounded-full"
                />
            </div>
        </div>
    );
}
