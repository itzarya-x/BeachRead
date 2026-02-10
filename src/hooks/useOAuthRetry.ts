/**
 * useOAuthRetry Hook
 *
 * Manages OAuth retry logic with exponential backoff.
 * - Tracks retry attempts
 * - Auto-retries when network comes back online
 * - Prevents retry loops with max attempts
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface RetryState {
    attempts: number;
    lastAttemptTime: number | null;
    isRetrying: boolean;
    canRetry: boolean;
}

interface UseOAuthRetryOptions {
    maxAttempts?: number;
    onlineAutoRetry?: boolean;
}

export function useOAuthRetry(options: UseOAuthRetryOptions = {}) {
    const { maxAttempts = 5, onlineAutoRetry = true } = options;
    const [state, setState] = useState<RetryState>({
        attempts: 0,
        lastAttemptTime: null,
        isRetrying: false,
        canRetry: true,
    });

    const retryTimerRef = useRef<NodeJS.Timeout>();
    const isOnlineRef = useRef(navigator.onLine);

    // Update online state
    useEffect(() => {
        const handleOnline = () => {
            isOnlineRef.current = true;
            // Auto-retry if enabled and we can retry
            if (onlineAutoRetry && state.canRetry && state.attempts > 0) {
                setState(prev => ({ ...prev, isRetrying: true }));
            }
        };

        const handleOffline = () => {
            isOnlineRef.current = false;
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, [state.canRetry, state.attempts, onlineAutoRetry]);

    const recordAttempt = useCallback(() => {
        setState(prev => {
            const newAttempts = prev.attempts + 1;
            const canRetry = newAttempts < maxAttempts && isOnlineRef.current;

            return {
                attempts: newAttempts,
                lastAttemptTime: Date.now(),
                isRetrying: false,
                canRetry,
            };
        });
    }, [maxAttempts]);

    const reset = useCallback(() => {
        if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current);
        }
        setState({
            attempts: 0,
            lastAttemptTime: null,
            isRetrying: false,
            canRetry: true,
        });
    }, []);

    const retry = useCallback(() => {
        if (!state.canRetry) return;

        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delayMs = Math.min(1000 * Math.pow(2, state.attempts), 16000);

        setState(prev => ({ ...prev, isRetrying: true }));

        retryTimerRef.current = setTimeout(() => {
            setState(prev => ({ ...prev, isRetrying: false }));
        }, delayMs);
    }, [state.attempts, state.canRetry]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (retryTimerRef.current) {
                clearTimeout(retryTimerRef.current);
            }
        };
    }, []);

    return {
        attempts: state.attempts,
        isRetrying: state.isRetrying,
        canRetry: state.canRetry,
        lastAttemptTime: state.lastAttemptTime,
        maxAttempts,
        recordAttempt,
        retry,
        reset,
    };
}
