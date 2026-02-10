/**
 * Authentication Context
 *
 * Manages user authentication state and cloud sync identity.
 * Purpose: Identify user for cloud sync (NOT social/profiles/monetization)
 *
 * Architecture:
 * - Minimal, invisible, frictionless
 * - User logs in → we get user.id
 * - Everything linked to this user.id in cloud
 * - No breaking changes to existing features
 *
 * PHASE 1: Supabase integration with automatic session restoration
 * - On app start: Check Supabase session (invisible)
 * - If valid: Restore user automatically
 * - If no session: User stays logged out (no interruption)
 * - On login/logout: Sync with Supabase
 *
 * OFFLINE HANDLING:
 * - Detects network state and prevents OAuth attempts offline
 * - Keeps existing sessions intact
 * - Shows user-friendly offline messages
 * - Auto-enables login when network returns
 *
 * OAUTH ERROR HANDLING:
 * - Detects popup blocking before attempting OAuth
 * - Handles network timeouts and provider unreachability
 * - Provides clear, actionable error messages
 * - Logs failures internally for debugging
 */

import { useOnline } from "@/hooks/useOnline";
import {
    logMagicLinkAttempt,
    logMagicLinkFailure,
    logOAuthFailure,
    logOAuthStart,
    logOAuthSuccess,
} from "@/lib/auth-logging";
import { detectErrorReason, OAuthErrorReason } from "@/lib/oauth-errors";
import { isPopupBlocked } from "@/lib/popup-detection";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase-client";

export interface AuthUser {
    id: string; // user_id from Supabase
    email: string;
    displayName?: string;
    avatar?: string;
    accessToken?: string;
}

export interface OAuthErrorDetail {
    reason: OAuthErrorReason;
    message: string;
    isRetryable: boolean;
}

export interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    error: string | null;
    errorDetail: OAuthErrorDetail | null;
    isOnline: boolean;
    login: (email: string, password: string) => Promise<void>;
    loginWithOAuth: (provider: "google" | "github") => Promise<void>;
    loginWithMagicLink: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [errorDetail, setErrorDetail] = useState<OAuthErrorDetail | null>(null);
    const isOnline = useOnline();

    // PHASE 1.2: Session Manager - Check and restore session on app start (invisible)
    useEffect(() => {
        const restoreSession = async () => {
            setLoading(true);

            try {
                if (!isSupabaseConfigured()) {
                    // Fallback: Check localStorage for mock auth
                    const savedUser = localStorage.getItem("yura_auth_user");
                    setUser(savedUser ? JSON.parse(savedUser) : null);
                    setLoading(false);
                    return;
                }

                // Check Supabase for existing session
                const { data, error: sessionError } = await supabase!.auth.getSession();

                if (sessionError) throw sessionError;

                if (data?.session) {
                    // Restore user from Supabase session
                    const supabaseUser = data.session.user;
                    const restoredUser: AuthUser = {
                        id: supabaseUser.id,
                        email: supabaseUser.email || "",
                        displayName: supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0],
                        avatar: supabaseUser.user_metadata?.avatar_url,
                        accessToken: data.session.access_token,
                    };

                    setUser(restoredUser);
                    localStorage.setItem("yura_auth_user", JSON.stringify(restoredUser));
                } else {
                    // No session, user stays logged out (no interruption)
                    setUser(null);
                    localStorage.removeItem("yura_auth_user");
                }
            } catch (err) {
                console.error("Session restoration error:", err);
                // Silently fail - user stays logged out
                setUser(null);
                localStorage.removeItem("yura_auth_user");
            } finally {
                setLoading(false);
            }
        };

        restoreSession();
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        setLoading(true);
        setError(null);

        try {
            if (!isSupabaseConfigured()) {
                // Mock fallback
                const mockUser: AuthUser = {
                    id: `user_${Date.now()}`,
                    email,
                    displayName: email.split("@")[0],
                    accessToken: "mock_token",
                };
                setUser(mockUser);
                localStorage.setItem("yura_auth_user", JSON.stringify(mockUser));
                return;
            }

            const { data, error: loginError } = await supabase!.auth.signInWithPassword({
                email,
                password,
            });

            if (loginError) throw loginError;
            if (!data.session) throw new Error("No session returned");

            const supabaseUser = data.session.user;
            const newUser: AuthUser = {
                id: supabaseUser.id,
                email: supabaseUser.email || "",
                displayName: supabaseUser.user_metadata?.name || supabaseUser.email?.split("@")[0],
                avatar: supabaseUser.user_metadata?.avatar_url,
                accessToken: data.session.access_token,
            };

            setUser(newUser);
            localStorage.setItem("yura_auth_user", JSON.stringify(newUser));
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Login failed";
            setError(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const loginWithOAuth = useCallback(
        async (provider: "google" | "github") => {
            setLoading(true);
            setError(null);
            setErrorDetail(null);

            try {
                logOAuthStart(provider);

                // PHASE 1.1: Check if offline first
                if (!isOnline) {
                    const errorMsg =
                        "You are offline. Internet is required to sign in. Your local vault is still available.";
                    setError(errorMsg);
                    setErrorDetail({
                        reason: "offline",
                        message: errorMsg,
                        isRetryable: true,
                    });
                    logOAuthFailure(provider, "offline");
                    throw new Error("offline");
                }

                // PHASE 1.2: Check if popups are blocked
                const popupBlocked = isPopupBlocked();
                if (popupBlocked) {
                    const errorMsg =
                        "Your browser blocked the login popup. Please enable popups for this site and try again.";
                    setError(errorMsg);
                    setErrorDetail({
                        reason: "popup-blocked",
                        message: errorMsg,
                        isRetryable: true,
                    });
                    logOAuthFailure(provider, "popup-blocked");
                    throw new Error("popup-blocked");
                }

                if (!isSupabaseConfigured()) {
                    const errorMsg = "OAuth is not available in demo mode. Use email login instead.";
                    setErrorDetail({
                        reason: "provider-unreachable",
                        message: errorMsg,
                        isRetryable: false,
                    });
                    setError(errorMsg);
                    logOAuthFailure(provider, "provider-unreachable", {
                        originalError: "OAuth not configured",
                    });
                    throw new Error("provider-unreachable");
                }

                // Add timeout to OAuth attempt (20 seconds)
                const oauthPromise = supabase!.auth.signInWithOAuth({
                    provider,
                    options: {
                        redirectTo: `${window.location.origin}/auth/callback`,
                    },
                });

                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error("network-timeout")), 20000);
                });

                try {
                    await Promise.race([oauthPromise, timeoutPromise]);
                    logOAuthSuccess(provider);
                } catch (timeoutErr) {
                    if (timeoutErr instanceof Error && timeoutErr.message === "network-timeout") {
                        throw new Error("network-timeout");
                    }
                    throw timeoutErr;
                }
            } catch (err) {
                const reason = detectErrorReason(err, isOnline, isPopupBlocked());
                const errorMap = {
                    offline: "You are offline. Internet is required to sign in.",
                    "popup-blocked": "Your browser blocked the popup. Please enable popups and try again.",
                    "provider-unreachable": "The login service is temporarily unavailable. Please try again later.",
                    "network-timeout": "The login request timed out. Please check your connection and try again.",
                    "network-error": "Network error. Please check your connection and try again.",
                    "user-cancelled": "Login was cancelled. Click 'Try again' to restart.",
                    unknown: "Something went wrong with login. Please try again.",
                };

                const errorMsg = errorMap[reason] || errorMap.unknown;
                setError(errorMsg);
                setErrorDetail({
                    reason,
                    message: errorMsg,
                    isRetryable: true,
                });

                logOAuthFailure(provider, reason, {
                    originalError: err instanceof Error ? err.message : String(err),
                });

                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isOnline],
    );

    const loginWithMagicLink = useCallback(
        async (email: string) => {
            setLoading(true);
            setError(null);
            setErrorDetail(null);

            try {
                logMagicLinkAttempt(email);

                // PHASE 1.1: Check if offline first
                if (!isOnline) {
                    const errorMsg =
                        "You are offline. Internet is required to send a magic link. Your local vault is still available.";
                    setError(errorMsg);
                    setErrorDetail({
                        reason: "offline",
                        message: errorMsg,
                        isRetryable: true,
                    });
                    logMagicLinkFailure(email, "offline");
                    throw new Error("offline");
                }

                if (!isSupabaseConfigured()) {
                    const errorMsg = "Magic link is not available in demo mode. Use Google sign-in instead.";
                    setErrorDetail({
                        reason: "provider-unreachable",
                        message: errorMsg,
                        isRetryable: false,
                    });
                    setError(errorMsg);
                    logMagicLinkFailure(email, "provider-unreachable", {
                        originalError: "Magic link not configured",
                    });
                    throw new Error("provider-unreachable");
                }

                // Add timeout (15 seconds)
                const magicLinkPromise = supabase!.auth.signInWithOtp({
                    email,
                    options: {
                        emailRedirectTo: `${window.location.origin}?auth=callback`,
                    },
                });

                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error("network-timeout")), 15000);
                });

                try {
                    const { error: magicLinkError } = await Promise.race([magicLinkPromise, timeoutPromise]);

                    if (magicLinkError) throw magicLinkError;

                    // Magic link sent - user will receive email
                } catch (timeoutErr) {
                    if (timeoutErr instanceof Error && timeoutErr.message === "network-timeout") {
                        throw new Error("network-timeout");
                    }
                    throw timeoutErr;
                }
            } catch (err) {
                const reason = detectErrorReason(err, isOnline);
                const errorMap = {
                    offline: "You are offline. Internet is required to send a magic link.",
                    "provider-unreachable": "The email service is temporarily unavailable. Please try again later.",
                    "network-timeout": "The request timed out. Please check your connection and try again.",
                    "network-error": "Network error. Please check your connection and try again.",
                    unknown: "Something went wrong. Please try again.",
                };

                const errorMsg = errorMap[reason as keyof typeof errorMap] || errorMap.unknown;
                setError(errorMsg);
                setErrorDetail({
                    reason,
                    message: errorMsg,
                    isRetryable: true,
                });

                logMagicLinkFailure(email, reason, {
                    originalError: err instanceof Error ? err.message : String(err),
                });

                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isOnline],
    );

    const logout = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            if (isSupabaseConfigured()) {
                const { error: logoutError } = await supabase!.auth.signOut();
                if (logoutError) throw logoutError;
            }

            setUser(null);
            localStorage.removeItem("yura_auth_user");
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Logout failed";
            setError(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const value: AuthContextValue = {
        user,
        loading,
        error,
        errorDetail,
        isOnline,
        login,
        loginWithOAuth,
        loginWithMagicLink,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
