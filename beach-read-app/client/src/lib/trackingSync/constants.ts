import type { ConflictMode, ProviderConfig, ProviderId, SyncDraft, SyncMode } from './types';

export const PROVIDERS: ProviderConfig[] = [
  {
    id: 'anilist',
    label: 'AniList',
    description: 'Import from and push your manga tracking data directly with AniList IDs.',
  },
  {
    id: 'mal',
    label: 'MyAnimeList',
    description: 'Import from and push to MAL using stored MAL mappings for each BeachRead series.',
  },
];

export const DEFAULT_SYNC_MODE: SyncMode = 'manual';
export const DEFAULT_CONFLICT_MODE: ConflictMode = 'newest_wins';

export function createDefaultDraft(): Record<ProviderId, SyncDraft> {
  return {
    anilist: {
      username: '',
      accessToken: '',
      refreshToken: null,
      tokenExpiresAt: null,
      syncMode: DEFAULT_SYNC_MODE,
      conflictMode: DEFAULT_CONFLICT_MODE,
    },
    mal: {
      username: '',
      accessToken: '',
      refreshToken: null,
      tokenExpiresAt: null,
      syncMode: DEFAULT_SYNC_MODE,
      conflictMode: DEFAULT_CONFLICT_MODE,
    },
  };
}
