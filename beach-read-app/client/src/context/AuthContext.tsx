import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextUser } from '../lib/types';
import { syncPublicProfileIdentity } from '../lib/publicProfile';
import { normalizeUsername } from '../lib/profileUsername';
import { isMissingTableError, isColumnKnownMissing, recordMissingColumn } from '../lib/supabaseSchema';
import { getSessionUser, isSupabaseConfigured, mapSupabaseUser, supabase } from '../lib/supabaseClient';
import { AuthContext, type AuthContextType } from './auth-context';

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

    if (!isSupabaseConfigured()) {
      throw new Error('Supabase auth is not configured.');
    }

    const metadataPatch: Record<string, any> = {};
    if (patch.displayName !== undefined) metadataPatch.name = patch.displayName || 'Beach Explorer';
    if (patch.username !== undefined) metadataPatch.username = normalizeUsername(patch.username, patch.email || user?.email || 'beachreader');
    if (patch.avatarUrl !== undefined) metadataPatch.avatar_url = patch.avatarUrl || null;
    if (patch.bannerUrl !== undefined) metadataPatch.banner_url = patch.bannerUrl || null;
    if (patch.bio !== undefined) metadataPatch.bio = patch.bio || null;
    if (patch.location !== undefined) metadataPatch.location = patch.location || null;
    if (patch.website !== undefined) metadataPatch.website = patch.website || null;
    if (patch.twitterHandle !== undefined) metadataPatch.twitter_handle = patch.twitterHandle || null;
    if (patch.isPrivate !== undefined) metadataPatch.is_private = patch.isPrivate;
    if (patch.showStats !== undefined) metadataPatch.show_stats = patch.showStats;
    if (patch.customColors !== undefined) metadataPatch.custom_colors = patch.customColors;
    if (patch.favoriteCharacters !== undefined) metadataPatch.favorite_characters = patch.favoriteCharacters;
    if (patch.favoriteMangaOrder !== undefined) metadataPatch.favorite_manga_order = patch.favoriteMangaOrder;
    if (patch.pinnedMangaIds !== undefined) metadataPatch.pinned_manga_ids = patch.pinnedMangaIds;
    if (patch.profileSections !== undefined) metadataPatch.profile_sections = patch.profileSections;
    if (patch.profilePrivacy !== undefined) metadataPatch.profile_privacy = patch.profilePrivacy;
    if (patch.featuredCollections !== undefined) metadataPatch.featured_collections = patch.featuredCollections;
    if (patch.snapshotCards !== undefined) metadataPatch.snapshot_cards = patch.snapshotCards;
    if (patch.nowReadingId !== undefined) metadataPatch.now_reading_id = patch.nowReadingId;
    if (patch.hasOnboarded !== undefined) metadataPatch.has_onboarded = patch.hasOnboarded;
    if (patch.preferences !== undefined) {
      metadataPatch.preferences = patch.preferences;
    }

    const { data, error: updateError } = await supabase!.auth.updateUser({
      data: metadataPatch,
    });

    if (updateError) {
      setError(updateError.message);
      throw updateError;
    }

    const nextUser = mapSupabaseUser(data.user);
    setUser(nextUser);
    if (nextUser) {
      await syncPublicProfileIdentity(nextUser);
    }
  }, [user]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!user) {
      throw new Error('You must be logged in to upload an avatar.');
    }

    if (!isSupabaseConfigured()) {
      throw new Error('Supabase auth is not configured.');
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExt) ? fileExt : 'jpg';
    const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

    const { error: uploadError } = await supabase!.storage
      .from('avatars')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      setError(uploadError.message);
      throw uploadError;
    }

    const { data } = supabase!.storage.from('avatars').getPublicUrl(filePath);
    const publicUrl = data.publicUrl;
    await updateUser({ avatarUrl: publicUrl });
    return publicUrl;
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
      clearError: () => setError(null),
      isAuthenticated: Boolean(user),
    }),
    [user, loading, error, login, loginWithGoogle, register, logout, updateUser, refreshUser, uploadAvatar]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
