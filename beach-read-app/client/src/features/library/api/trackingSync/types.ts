import type { LibraryItem } from '../../../../shared/types/types';

export type ProviderId = 'anilist' | 'mal';
export type IntegrationStatus = 'disconnected' | 'connected' | 'error';
export type SyncMode = 'manual' | 'import-only' | 'bidirectional';
export type ConflictMode = 'local_wins' | 'provider_wins' | 'newest_wins';
export type SyncDirection = 'import' | 'pull' | 'export' | 'push';
export type SyncJobStatus =
  | 'pending' | 'running' | 'completed' | 'failed'
  | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  | 'AWAITING_CONFLICT_RESOLUTION' | 'RETRYABLE_FAILURE';

export type ProviderConfig = {
  id: ProviderId;
  label: string;
  description: string;
};

export type IntegrationRow = {
  provider: ProviderId;
  status: IntegrationStatus;
  username: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  sync_mode: SyncMode;
  conflict_mode: ConflictMode;
  last_sync_at: string | null;
  last_pull_at: string | null;
  last_push_at: string | null;
  last_error: string | null;
};

export type SyncJobRow = {
  id: string;
  provider: ProviderId;
  direction: SyncDirection;
  /** DB job_type column (e.g. INITIAL_IMPORT, INCREMENTAL_PULL) */
  job_type?: string;
  status: SyncJobStatus;
  items_processed: number;
  items_total: number;
  error_message: string | null;
  created_at: string;
  started_at?: string | null;
  finished_at?: string | null;
  /** JSON summary written by worker on completion: { imported, conflicts, remoteCount } */
  result_summary?: Record<string, number> | null;
};

export type SyncDraft = {
  username: string;
  accessToken: string;
  refreshToken?: string | null;
  tokenExpiresAt?: string | null;
  syncMode: SyncMode;
  conflictMode: ConflictMode;
};

export type ExternalMediaMappingRow = {
  provider: ProviderId;
  series_id: number;
  provider_media_id: string;
  provider_media_type: 'MANGA';
  provider_title: string | null;
  provider_updated_at: string | null;
};

export type LocalMediaRow = {
  user_id: string;
  series_id: number;
  media_type: 'MANGA';
  is_favourite?: boolean | null;
  status: string | null;
  score: number | null;
  progress: number | null;
  progress_volumes: number | null;
  repeat: number | null;
  started_at: string | null;
  completed_at: string | null;
  raw_media: Record<string, unknown> | null;
  raw_list_entry: Record<string, unknown> | null;
  updated_at: string | null;
  deleted: boolean | null;
};

export type ProviderMediaEntry = {
  provider: ProviderId;
  providerMediaId: string;
  seriesId: number | null;
  title: string;
  titles: string[];
  status: string;
  score: number;
  progress: number;
  progressVolumes: number;
  repeat: number;
  priority: number;
  isPrivate: boolean;
  isFavourite: boolean;
  notes: string | null;
  customLists: string[];
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string | null;
  countryOfOrigin?: string | null;
  rawMedia: Record<string, unknown>;
};

export type SyncSummary = {
  total: number;
  processed: number;
  skipped: number;
  conflictsResolved: number;
  notes: string[];
};

export type SyncState = {
  integrations: IntegrationRow[];
  jobs: SyncJobRow[];
};

export type ProviderToLocalOptions = {
  userId: string;
  provider: ProviderId;
  accessToken: string;
  conflictMode: ConflictMode;
  direction: Extract<SyncDirection, 'import' | 'pull'>;
};

export type LocalToProviderOptions = {
  userId: string;
  provider: ProviderId;
  accessToken: string;
  conflictMode: ConflictMode;
  direction: Extract<SyncDirection, 'export' | 'push'>;
};

export type PushableLocalItem = {
  row: LocalMediaRow;
  libraryItem: LibraryItem;
};
