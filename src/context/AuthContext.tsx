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
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase-client";

export interface AuthUser {
    id: string; // user_id from Supabase
    email: string;
    displayName?: string;
    avatar?: string;
    accessToken?: string;
}

export interface AuthContextValue {
    user: AuthUser | null;
    loading: boolean;
    error: string | null;
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

    const loginWithOAuth = useCallback(async (provider: "google" | "github") => {
        setLoading(true);
        setError(null);

        try {
            if (!isSupabaseConfigured()) {
                throw new Error("OAuth not available in offline mode");
            }

            const { data, error: oauthError } = await supabase!.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}?auth=callback`,
                },
            });

            if (oauthError) throw oauthError;

            // OAuth redirect will handle the rest
            // This method doesn't return user immediately
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : `${provider} login failed`;
            setError(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const loginWithMagicLink = useCallback(async (email: string) => {
        setLoading(true);
        setError(null);

        try {
            if (!isSupabaseConfigured()) {
                throw new Error("Magic link not available in offline mode");
            }

            const { error: magicLinkError } = await supabase!.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: `${window.location.origin}?auth=callback`,
                },
            });

            if (magicLinkError) throw magicLinkError;

            // Magic link sent - user will receive email
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Magic link failed";
            setError(errorMsg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

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
        login,
        loginWithOAuth,
        loginWithMagicLink,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
