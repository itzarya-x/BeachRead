import { createClient, type Session, type SupabaseClient, type User as SupabaseUser } from '@supabase/supabase-js';
import { normalizeUsername } from '../../features/profile/utils/profileUsername';
import type { ProfilePrivacyConfig, ProfileSectionsConfig, SectionId, SnapshotCardId, User as BeachUser } from '../types/types';

/** When VITE_SUPABASE_DEV_PROXY is set, Vite proxies /supabase → VITE_SUPABASE_URL (fixes Firefox / strict browsers blocking cross-origin to *.supabase.co). */
const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const useSupabaseDevProxy =
  import.meta.env.DEV &&
  (import.meta.env.VITE_SUPABASE_DEV_PROXY === '1' ||
    import.meta.env.VITE_SUPABASE_DEV_PROXY === 'true');

const supabaseUrl =
  useSupabaseDevProxy && typeof window !== 'undefined' && window.location?.origin
    ? `${window.location.origin}/supabase`
    : envSupabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const authStorageKey = 'beachread_supabase_session';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are not configured. Auth will be unavailable.');
}

export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storageKey: authStorageKey,
      },
    })
  : null;

export const supabaseRealtime: SupabaseClient | null = useSupabaseDevProxy && envSupabaseUrl && supabaseAnonKey
  ? createClient(envSupabaseUrl, supabaseAnonKey, {
      accessToken: async () => {
        const { data } = await supabase!.auth.getSession();
        return data.session?.access_token || null;
      },
    })
  : supabase;

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

const DEFAULT_SECTION_ORDER: SectionId[] = [
  'now_reading',
  'snapshot',
  'stats',
  'featured_collections',
  'favorites',
  'starter_pack',
  'changelog',
  'archive',
  'characters',
];

const DEFAULT_PROFILE_SECTIONS: ProfileSectionsConfig = {
  visible: {
    stats: true,
    snapshot: true,
    now_reading: true,
    featured_collections: true,
    favorites: true,
    starter_pack: true,
    changelog: true,
    archive: true,
    characters: true,
  },
  order: DEFAULT_SECTION_ORDER,
};

const DEFAULT_PROFILE_PRIVACY: ProfilePrivacyConfig = {
  showScores: true,
  showProgress: true,
  showDroppedPaused: true,
  hideAdultContent: false,
};

const DEFAULT_SNAPSHOT_CARDS: SnapshotCardId[] = ['archive_overview', 'completion_ratio', 'top_genre'];

function resolveSectionsConfig(value: unknown): ProfileSectionsConfig {
  const fallback = DEFAULT_PROFILE_SECTIONS;
  if (!value || typeof value !== 'object') return fallback;
  const incoming = value as Partial<ProfileSectionsConfig>;
  const visible = {
    ...fallback.visible,
    ...(incoming.visible || {}),
  };
  const order = Array.isArray(incoming.order)
    ? incoming.order.filter((item): item is SectionId => typeof item === 'string' && item in fallback.visible)
    : fallback.order;
  const normalizedOrder = order.length ? order : fallback.order;
  return { visible, order: normalizedOrder };
}

function resolvePrivacyConfig(value: unknown): ProfilePrivacyConfig {
  if (!value || typeof value !== 'object') return DEFAULT_PROFILE_PRIVACY;
  return {
    ...DEFAULT_PROFILE_PRIVACY,
    ...(value as Partial<ProfilePrivacyConfig>),
  };
}

function resolveSnapshotCards(value: unknown): SnapshotCardId[] {
  if (!Array.isArray(value)) return DEFAULT_SNAPSHOT_CARDS;
  const normalized = value.filter((item): item is SnapshotCardId => typeof item === 'string');
  return normalized.length ? normalized : DEFAULT_SNAPSHOT_CARDS;
}

export function mapSupabaseUser(user: SupabaseUser | null): BeachUser | null {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email || '',
    displayName: user.user_metadata?.name || user.email?.split('@')[0] || 'Beach Explorer',
    username: normalizeUsername(user.user_metadata?.username || user.email?.split('@')[0] || 'beachreader', user.email || 'beachreader'),
    avatarUrl: user.user_metadata?.avatar_url,
    bannerUrl: user.user_metadata?.banner_url,
    bio: user.user_metadata?.bio,
    location: user.user_metadata?.location,
    website: user.user_metadata?.website,
    twitterHandle: user.user_metadata?.twitter_handle,
    isPrivate: user.user_metadata?.is_private ?? false,
    showStats: user.user_metadata?.show_stats ?? true,
    customColors: user.user_metadata?.custom_colors || {
      primary: '#F77F00',
      background: '#000000'
    },
    favoriteCharacters: user.user_metadata?.favorite_characters || [],
    favoriteMangaOrder: user.user_metadata?.favorite_manga_order || [],
    profileSections: resolveSectionsConfig(user.user_metadata?.profile_sections),
    profilePrivacy: resolvePrivacyConfig(user.user_metadata?.profile_privacy),
    featuredCollections: Array.isArray(user.user_metadata?.featured_collections)
      ? user.user_metadata.featured_collections
      : [],
    snapshotCards: resolveSnapshotCards(user.user_metadata?.snapshot_cards),
    nowReadingId: typeof user.user_metadata?.now_reading_id === 'string' ? user.user_metadata.now_reading_id : null,
    hasOnboarded: user.user_metadata?.has_onboarded,
    preferences: user.user_metadata?.preferences || {
      theme: 'system',
      language: 'en',
      notifications: true,
      titleLanguage: 'ROMAJI',
      scoreFormat: 'POINT_10',
      adultContent: false
    },
    createdAt: user.created_at,
  };
}

export function getSessionUser(session: Session | null) {
  return mapSupabaseUser(session?.user ?? null);
}
