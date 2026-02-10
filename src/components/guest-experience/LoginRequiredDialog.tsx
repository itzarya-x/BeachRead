/**
 * Login Required Dialog
 * ======================
 * Shows modal/dialog when guest tries to perform actions that require authentication
 * 
 * PHASE 4 (Guest Experience):
 * - Blocks add/edit/delete operations for guests
 * - Shows login prompt modal
 * - Provides clear call-to-action
 * - Part of graceful degradation pattern
 */

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface LoginRequiredDialogProps {
    isOpen: boolean;
    onClose: () => void;
    action?: string;
}

export function LoginRequiredDialog({
    isOpen,
    onClose,
    action = "this action",
}: LoginRequiredDialogProps) {
    const { login } = useAuth();
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async () => {
        setIsLoggingIn(true);
        try {
            await login();
        } finally {
            setIsLoggingIn(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-sm w-full p-6">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className="text-4xl">🔐</div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-center mb-2 dark:text-gray-100">
                    Sign in required
                </h2>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                    To {action}, you need to sign in with your AniList account.
                </p>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleLogin}
                        disabled={isLoggingIn}
                        className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoggingIn ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                Signing in...
                            </>
                        ) : (
                            <>
                                Sign In
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Hook to use LoginRequiredDialog
 * Simplifies showing the dialog in components
 * 
 * Usage:
 * ```tsx
 * const [loginDialog, handleMissingAuth] = useLoginRequired();
 * 
 * if (!authUser) {
 *   handleMissingAuth("create a new entry");
 *   return;
 * }
 * ```
 */
export function useLoginRequired() {
    const [state, setState] = useState<{
        isOpen: boolean;
        action: string;
    }>({
        isOpen: false,
        action: "perform this action",
    });

    const Dialog = (
        <LoginRequiredDialog
            isOpen={state.isOpen}
            onClose={() => setState(prev => ({ ...prev, isOpen: false }))}
            action={state.action}
        />
    );

    const showLoginPrompt = (action: string = "perform this action") => {
        setState({
            isOpen: true,
            action,
        });
    };

    return [Dialog, showLoginPrompt] as const;
}

export default LoginRequiredDialog;
