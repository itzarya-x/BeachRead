/**
 * OAuth Error Types & Reasons
 *
 * Defines all possible OAuth failure modes and their user-friendly explanations.
 * Maps technical errors to human-readable messages and recovery steps.
 */

export type OAuthErrorReason =
    | "offline" // User is offline
    | "popup-blocked" // Browser blocked the popup
    | "provider-unreachable" // OAuth provider is down/unreachable
    | "network-timeout" // Request timed out
    | "network-error" // General network error
    | "unknown" // Unknown error
    | "user-cancelled"; // User cancelled the flow

export interface OAuthErrorInfo {
    reason: OAuthErrorReason;
    title: string;
    description: string;
    advice: string;
    icon: string; // emoji or icon name
    isRetryable: boolean;
    requiresNetworkRestore?: boolean; // If true, auto-retry when online
}

/**
 * Map error reasons to user-friendly information
 */
export const OAUTH_ERROR_MAP: Record<OAuthErrorReason, OAuthErrorInfo> = {
    offline: {
        reason: "offline",
        title: "You are offline",
        description: "Internet is required to sign in.",
        advice: "Please check your connection and try again. Your local vault remains available.",
        icon: "📡",
        isRetryable: true,
        requiresNetworkRestore: true,
    },

    "popup-blocked": {
        reason: "popup-blocked",
        title: "Popup blocked",
        description: "Your browser blocked the login popup.",
        advice: "Please enable popups for this site in your browser settings and try again. Look for the popup icon in your address bar.",
        icon: "🚫",
        isRetryable: true,
        requiresNetworkRestore: false,
    },

    "provider-unreachable": {
        reason: "provider-unreachable",
        title: "Login service temporarily unavailable",
        description: "We cannot reach the login provider right now.",
        advice: "This usually resolves quickly. Please try again in a few moments.",
        icon: "⚠️",
        isRetryable: true,
        requiresNetworkRestore: false,
    },

    "network-timeout": {
        reason: "network-timeout",
        title: "Connection timed out",
        description: "The login request took too long to complete.",
        advice: "Check your internet connection and try again. If this persists, try a different network.",
        icon: "⏱️",
        isRetryable: true,
        requiresNetworkRestore: false,
    },

    "network-error": {
        reason: "network-error",
        title: "Network error",
        description: "Something went wrong with your network connection.",
        advice: "Please check your internet connection and try again.",
        icon: "🌐",
        isRetryable: true,
        requiresNetworkRestore: false,
    },

    unknown: {
        reason: "unknown",
        title: "Something went wrong",
        description: "We encountered an unexpected issue during login.",
        advice: "Please try again. If this continues, contact support.",
        icon: "❌",
        isRetryable: true,
        requiresNetworkRestore: false,
    },

    "user-cancelled": {
        reason: "user-cancelled",
        title: "Login cancelled",
        description: "You closed the login window.",
        advice: "Click 'Try again' to restart the login process.",
        icon: "⊘",
        isRetryable: true,
        requiresNetworkRestore: false,
    },
};

/**
 * Detect error reason from various error indicators
 */
export function detectErrorReason(error: unknown, isOnline: boolean, isPopupBlocked?: boolean): OAuthErrorReason {
    // Check offline first
    if (!isOnline) {
        return "offline";
    }

    // Check popup blocked
    if (isPopupBlocked === true) {
        return "popup-blocked";
    }

    // Check error message/type
    if (error instanceof Error) {
        const msg = error.message.toLowerCase();

        if (msg.includes("popup")) {
            return "popup-blocked";
        }

        if (msg.includes("timeout")) {
            return "network-timeout";
        }

        if (msg.includes("network") || msg.includes("fetch")) {
            return "network-error";
        }

        if (msg.includes("unreachable") || msg.includes("unavailable") || msg.includes("not available")) {
            return "provider-unreachable";
        }

        if (msg.includes("cancelled") || msg.includes("aborted")) {
            return "user-cancelled";
        }
    }

    // Default to unknown
    return "unknown";
}

/**
 * Get error info for a specific reason
 */
export function getErrorInfo(reason: OAuthErrorReason): OAuthErrorInfo {
    return OAUTH_ERROR_MAP[reason] || OAUTH_ERROR_MAP.unknown;
}
