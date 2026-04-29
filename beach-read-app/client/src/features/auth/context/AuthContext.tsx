import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextUser } from '../../../shared/types/types';
import { syncPublicProfileIdentity } from '../../profile/api/publicProfile';
import { normalizeUsername } from '../../profile/utils/profileUsername';
import { isMissingTableError, isColumnKnownMissing, recordMissingColumn } from '../../../shared/api/supabaseSchema';
import { getSessionUser, isSupabaseConfigured, mapSupabaseUser, supabase } from '../../../shared/api/supabaseClient';
import { AuthContext, type AuthContextType } from './auth-context';
import { updateUserMetadata, uploadUserAvatar, uploadUserBanner } from '../../../services/api/accountApi';

function resolveAuthRedirect(path = '/'): string {
  const base = import.meta.env.VITE_AUTH_REDIRECT_URL?.trim() || window.location.origin;
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

function resolveAuthRedirectWithParams(path: string, params: Record<string, string>) {
  const url = new URL(resolveAuthRedirect(path));

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOnboardingStatus = useCallback(async (nextUser: AuthContextUser) => {
    if (typeof nextUser.hasOnboarded === 'boolean' || isColumnKnownMissing('has_onboarded')) {
      return nextUser;
    }

    try {
      const { data: profile, error: profileError } = await supabase!
        .from('public_profiles')
        .select('user_id')
        .eq('user_id', nextUser.id)
        .maybeSingle();

      if (profileError) {
        if (!isMissingTableError(profileError, 'public_profiles')) {
          console.error('[AuthContext] Error fetching profile:', profileError);
        }
      } else if (profile) {
        recordMissingColumn('has_onboarded');
        nextUser.hasOnboarded = true;
      } else {
        nextUser.hasOnboarded = false;
      }

    } catch (profileCatch) {

      console.warn('[AuthContext] Could not fetch onboarded status:', profileCatch);
    }
    return nextUser;
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      setError(null);

      if (!isSupabaseConfigured()) {
        setUser(null);
        setError('Supabase auth is not configured.');
        setLoading(false);
        return;
      }

      try {
        const { data, error: sessionError } = await supabase!.auth.getSession();
        if (sessionError) throw sessionError;
        let nextUser = getSessionUser(data.session);

        if (nextUser) {
          nextUser = await fetchOnboardingStatus(nextUser);
          setUser(nextUser);
          void syncPublicProfileIdentity(nextUser).catch((syncError) => {
            console.error('Failed to sync public profile identity:', syncError);
          });
        } else {
          setUser(null);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to restore session');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();

    if (!isSupabaseConfigured()) return;
    const { data: listener } = supabase!.auth.onAuthStateChange(async (_event, session) => {
      let nextUser = getSessionUser(session);
      if (nextUser) {
        nextUser = await fetchOnboardingStatus(nextUser);
        setUser(nextUser);
        if (nextUser) {
          void syncPublicProfileIdentity(nextUser).catch((syncError) => {
            console.error('Failed to sync public profile identity:', syncError);
          });
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchOnboardingStatus]);


  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase auth is not configured.');
      }

      const { data, error: loginError } = await supabase!.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      const nextUser = mapSupabaseUser(data.user);
      setUser(nextUser);
      if (nextUser) {
        await syncPublicProfileIdentity(nextUser);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to login');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase auth is not configured.');
      }

      const { data, error: signUpError } = await supabase!.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: resolveAuthRedirectWithParams('/verify-email', { email }),
          data: {
            name: displayName || email.split('@')[0],
            username: normalizeUsername(displayName || email.split('@')[0], email),
          },
        },
      });
      if (signUpError) throw signUpError;
      const nextUser = data.session ? mapSupabaseUser(data.user) : null;
      setUser(nextUser);
      if (nextUser) {
        await syncPublicProfileIdentity(nextUser);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to register');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase auth is not configured.');
      }

      const { error: oauthError } = await supabase!.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: resolveAuthRedirect('/'),
        },
      });

      if (oauthError) throw oauthError;
    } catch (e: any) {
      setError(e?.message || 'Failed to sign in with Google');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase auth is not configured.');
      }
      const { error: signOutError } = await supabase!.auth.signOut();
      if (signOutError) throw signOutError;
      setUser(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to logout');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (patch: Partial<AuthContextUser>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));

    try {
      const nextUser = await updateUserMetadata(patch, user?.email);
      if (nextUser) {
        setUser(nextUser);
      }
    } catch (e: any) {
      setError(e?.message);
      throw e;
    }
  }, [user]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!user) throw new Error('You must be logged in to upload an avatar.');
    try {
      const publicUrl = await uploadUserAvatar(user.id, file);
      await updateUser({ avatarUrl: publicUrl });
      return publicUrl;
    } catch (e: any) {
      setError(e?.message);
      throw e;
    }
  }, [updateUser, user]);

  const uploadBanner = useCallback(async (file: File) => {
    if (!user) throw new Error('You must be logged in to upload a banner.');
    try {
      const publicUrl = await uploadUserBanner(user.id, file);
      await updateUser({ bannerUrl: publicUrl });
      return publicUrl;
    } catch (e: any) {
      setError(e?.message);
      throw e;
    }
  }, [updateUser, user]);

  const refreshUser = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const { data, error: sessionError } = await supabase!.auth.getSession();
      if (sessionError) throw sessionError;
      let nextUser = getSessionUser(data.session);
      if (nextUser) {
        nextUser = await fetchOnboardingStatus(nextUser);
        setUser(nextUser);
      }
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  }, [fetchOnboardingStatus]);


  const setGlobalMediaFilter = useCallback((filter: 'ALL' | 'ANIME' | 'MANGA' | 'NOVEL') => {
    if (user) {
      void updateUser({
        preferences: {
          ...(user.preferences || { theme: 'light', language: 'en', notifications: true }),
          globalMediaFilter: filter
        }
      });
    } else {
      localStorage.setItem('beachread_global_filter', filter);
      // Force a re-render for guest by potentially having a local state if needed
      // but usually apps would just use the user object
    }
  }, [user, updateUser]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      error,
      login,
      loginWithGoogle,
      register,
      logout,
      updateUser,
      refreshUser,
      uploadAvatar,
      uploadBanner,
      setGlobalMediaFilter,
      clearError: () => setError(null),
      isAuthenticated: Boolean(user),
    }),
    [user, loading, error, login, loginWithGoogle, register, logout, updateUser, refreshUser, uploadAvatar, uploadBanner, setGlobalMediaFilter]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
