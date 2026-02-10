/**
 * useAuthToken Hook
 *
 * Manages JWT token lifecycle:
 * - Access token storage (memory)
 * - Refresh token refresh (HTTP-only cookie via backend)
 * - Automatic token refresh on expiration
 * - Token validation
 */

import { useCallback, useEffect, useState } from "react";

export interface TokenPayload {
    sub: string; // user id
    email: string;
    iat: number; // issued at
    exp: number; // expiration
}

export interface AuthToken {
    accessToken: string;
    expiresIn: number;
}

/**
 * Decode JWT token (without verification - client-side only)
 */
export function decodeToken(token: string): TokenPayload | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;

        const decoded = JSON.parse(atob(parts[1]));
        return decoded;
    } catch {
        return null;
    }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string, bufferMs: number = 60000): boolean {
    const payload = decodeToken(token);
    if (!payload) return true;

    const expiresAt = payload.exp * 1000; // convert to ms
    const now = Date.now() + bufferMs; // add 1 minute buffer

    return now >= expiresAt;
}

/**
 * Get time until token expires (ms)
 */
export function getTokenTimeToExpiry(token: string): number {
    const payload = decodeToken(token);
    if (!payload) return 0;

    const expiresAt = payload.exp * 1000; // convert to ms
    const now = Date.now();
    return Math.max(0, expiresAt - now);
}

export function useAuthToken() {
    const [token, setToken] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    /**
     * Set access token in memory
     */
    const setAccessToken = useCallback((newToken: string) => {
        setToken(newToken);
    }, []);

    /**
     * Clear tokens
     */
    const clearTokens = useCallback(() => {
        setToken(null);
    }, []);

    /**
     * Get current token
     */
    const getAccessToken = useCallback((): string | null => {
        return token;
    }, [token]);

    /**
     * Check if token is valid
     */
    const isTokenValid = useCallback((): boolean => {
        if (!token) return false;
        return !isTokenExpired(token);
    }, [token]);

    /**
     * Refresh access token using refresh token (stored in HTTP-only cookie)
     */
    const refreshAccessToken = useCallback(async (): Promise<string | null> => {
        if (refreshing) return token;

        setRefreshing(true);

        try {
            // TODO: Call backend refresh endpoint
            // const response = await fetch("/api/auth/refresh", {
            //     method: "POST",
            //     credentials: "include", // Send cookies (refresh token)
            // });

            // if (!response.ok) {
            //     throw new Error("Token refresh failed");
            // }

            // const data = await response.json();
            // const newToken = data.accessToken;

            // setAccessToken(newToken);
            // return newToken;

            // For now, return null to indicate refresh failed
            return null;
        } catch (error) {
            console.error("Token refresh error:", error);
            // If refresh fails, tokens are invalid - logout will be handled by caller
            setToken(null);
            return null;
        } finally {
            setRefreshing(false);
        }
    }, [token, refreshing]);

    /**
     * Auto-refresh token when near expiration
     */
    useEffect(() => {
        if (!token || isTokenValid()) {
            return;
        }

        const timeToExpiry = getTokenTimeToExpiry(token);

        // Refresh when token is within 1 minute of expiry
        const refreshTime = Math.max(0, timeToExpiry - 60000);

        const timeout = setTimeout(() => {
            refreshAccessToken();
        }, refreshTime);

        return () => clearTimeout(timeout);
    }, [token]);

    return {
        token,
        setAccessToken,
        clearTokens,
        getAccessToken,
        isTokenValid,
        refreshAccessToken,
        isRefreshing: refreshing,
    };
}
