/**
 * OAuth Error UI Component
 *
 * Shows user-friendly error messages for OAuth and auth failures.
 * Maps error reasons to helpful UI with clear next steps.
 */

import { getErrorInfo, OAuthErrorReason } from "@/lib/oauth-errors";
import { AlertCircle, AlertTriangle, Clock, Wifi, WifiOff, Zap } from "lucide-react";

interface OAuthErrorScreenProps {
    reason: OAuthErrorReason;
    onRetry: () => void;
    isRetrying?: boolean;
    isOnline?: boolean;
}

const errorIcons: Record<OAuthErrorReason, React.ReactNode> = {
    offline: <WifiOff className="w-12 h-12 text-yellow-500" />,
    "popup-blocked": <AlertCircle className="w-12 h-12 text-red-500" />,
    "provider-unreachable": <Zap className="w-12 h-12 text-orange-500" />,
    "network-timeout": <Clock className="w-12 h-12 text-orange-500" />,
    "network-error": <Wifi className="w-12 h-12 text-orange-500" />,
    "user-cancelled": <AlertTriangle className="w-12 h-12 text-blue-500" />,
    unknown: <AlertCircle className="w-12 h-12 text-gray-500" />,
};

export function OAuthErrorScreen({ reason, onRetry, isRetrying = false, isOnline = true }: OAuthErrorScreenProps) {
    const errorInfo = getErrorInfo(reason);
    const icon = errorIcons[reason];

    return (
        <div className="space-y-4">
            {/* Icon */}
            <div className="flex justify-center">{icon}</div>

            {/* Title */}
            <div>
                <h3 className="text-lg font-semibold text-foreground text-center">{errorInfo.title}</h3>
                <p className="text-sm text-muted-foreground text-center mt-2">{errorInfo.description}</p>
            </div>

            {/* Advice/Help Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">{errorInfo.advice}</p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
                {/* Main Action Button */}
                <button
                    onClick={onRetry}
                    disabled={isRetrying || (reason === "offline" && !isOnline)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                        reason === "offline" && !isOnline
                            ? "bg-yellow-100 text-yellow-800 cursor-not-allowed opacity-60"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                    } ${isRetrying ? "opacity-75" : ""}`}
                >
                    {reason === "offline" && !isOnline ? (
                        <>
                            <Wifi size={18} />
                            Waiting for connection...
                        </>
                    ) : isRetrying ? (
                        <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Retrying...
                        </>
                    ) : (
                        <>Try again</>
                    )}
                </button>

                {/* Help Text */}
                <p className="text-xs text-muted-foreground text-center">
                    {reason === "popup-blocked" &&
                        "Look for the popup icon in your address bar or check browser settings."}
                    {reason === "provider-unreachable" && "Usually resolves within a few minutes."}
                    {reason === "network-timeout" && "Try a different network if available."}
                    {reason === "offline" && isOnline && "Your connection has been restored."}
                </p>
            </div>
        </div>
    );
}

/**
 * Inline error message (for forms/modals)
 */
export function OAuthErrorMessage({ reason }: { reason: OAuthErrorReason }) {
    const errorInfo = getErrorInfo(reason);

    return (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-900 font-medium">{errorInfo.title}</p>
            <p className="text-sm text-red-800 mt-1">{errorInfo.description}</p>
        </div>
    );
}
