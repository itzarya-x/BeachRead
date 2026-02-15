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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className="text-4xl">🔐</div>
                </div>

                {/* Title */}
                <h2 className="mb-2 text-center text-xl font-bold text-foreground">
                    Sign in required
                </h2>

                {/* Description */}
                <p className="mb-6 text-center text-muted-foreground">
                    To {action}, you need to sign in with your AniList account.
                </p>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-lg border border-border px-4 py-2 font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleLogin}
                        disabled={isLoggingIn}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary/25 bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
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
