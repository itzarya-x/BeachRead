/**
 * PHASE 3: Authentication Context
 *
 * Manages user authentication state and userId persistence.
 * Supports email login and OAuth (placeholder for Phase 3).
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

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

    // Load persisted auth on mount
    useEffect(() => {
        const loadPersistedAuth = () => {
            try {
                const persisted = localStorage.getItem("yura_auth_user");
                if (persisted) {
                    const parsed = JSON.parse(persisted);
                    setUser(parsed);
                }
            } catch (err) {
                console.error("Failed to load persisted auth:", err);
                localStorage.removeItem("yura_auth_user");
            } finally {
                setLoading(false);
            }
        };

        loadPersistedAuth();
    }, []);

    // TODO: Check Supabase session on mount when cloud is enabled
    // useEffect(() => {
    //     const checkSession = async () => {
    //         const { data: { session } } = await supabase.auth.getSession();
    //         if (session?.user) {
    //             setUser({
    //                 id: session.user.id,
    //                 email: session.user.email || "",
    //                 displayName: session.user.user_metadata?.display_name,
    //                 avatar: session.user.user_metadata?.avatar_url,
    //             });
    //         }
    //         setLoading(false);
    //     };
    //     checkSession();
    // }, []);

    const login = useCallback(async (email: string, password: string) => {
        setLoading(true);
        setError(null);

        try {
            // TODO: Implement Supabase login in Phase 3
            // const { data, error: authError } = await supabase.auth.signInWithPassword({
            //     email,
            //     password,
            // });
            //
            // if (authError) throw authError;
            // if (!data.user) throw new Error("No user returned from auth");
            //
            // const authUser: AuthUser = {
            //     id: data.user.id,
            //     email: data.user.email || "",
            //     displayName: data.user.user_metadata?.display_name,
            //     avatar: data.user.user_metadata?.avatar_url,
            //     accessToken: data.session?.access_token,
            // };

            // For now: mock implementation
            const mockUser: AuthUser = {
                id: `user_${Date.now()}`,
                email,
                displayName: email.split("@")[0],
            };

            setUser(mockUser);
            localStorage.setItem("yura_auth_user", JSON.stringify(mockUser));
        } catch (err) {
            const message = err instanceof Error ? err.message : "Login failed";
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const loginWithOAuth = useCallback(async (provider: "google" | "github") => {
        setLoading(true);
        setError(null);

        try {
            // TODO: Implement OAuth in Phase 3
            // const { data, error: authError } = await supabase.auth.signInWithOAuth({
            //     provider,
            //     options: {
            //         redirectTo: `${window.location.origin}/auth/callback`,
            //     },
            // });
            //
            // if (authError) throw authError;

            throw new Error("OAuth not yet implemented - Phase 3 TODO");
        } catch (err) {
            const message = err instanceof Error ? err.message : "OAuth login failed";
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // TODO: Call Supabase logout
            // await supabase.auth.signOut();

            setUser(null);
            localStorage.removeItem("yura_auth_user");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Logout failed";
            setError(message);
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
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
