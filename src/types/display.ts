export type MediaStatus =
  | "CURRENT"
  | "PLANNING"
  | "COMPLETED"
  | "DROPPED"
  | "PAUSED"
  | "REPEATING";

export type MediaType = "ANIME" | "MANGA";

export type ScoreFormat =
  | "POINT_100"
  | "POINT_10_DECIMAL"
  | "POINT_10"
  | "POINT_5"
  | "POINT_3";

export type TitleLanguage = "ROMAJI" | "ENGLISH" | "NATIVE";

export interface MediaStatistics {
  count: number;
  minutesWatched: number;
  progress: number;
  progressVolumes: number;
  meanScore: number;
  standardDeviation: number;
}

export interface DisplayUser {
  id: number; // User ID from GDPR
  displayName: string;
  userName: string; // login email / username
  email: string;
  about: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  profileColor: string;
  scoreFormat: ScoreFormat;
  titleLanguage: TitleLanguage;
  customListNames: {
    anime: string[];
    manga: string[];
  };
  statistics: {
    anime: MediaStatistics;
    manga: MediaStatistics;
  };
  activityHistory: Record<string, { count: number; color: string }>;
  activityHistoryTotal: number;
  createdAt: string;
  updatedAt: string;

  // Account settings
  listOrder: number;
  forumHomepage: number;
  adultContent: boolean;
  legacyLists: boolean;
  donator: number;
  donatorBadge: string | null;
  notifications: number;
  airingNotifications: boolean;
  privacy: boolean; // true = private
  notificationOptions: string;
  modRoles: number;
  ip: string;

  // Counters from GDPR
  animeWatched: number;
  chaptersRead: number;

  // Advanced scoring config
  advancedScoresActive: boolean;
  advancedScoresNames: string[];

  // Hidden categories
  hiddenCategories: unknown;

  // Raw stats distributions
  statusDistribution: {
    anime: unknown[];
    manga: unknown[];
  };
  scoreDistribution: {
    anime: unknown[];
    manga: unknown[];
  };

  // Favourites
  favourites: {
    anime: number[]; // favourite_id values where favourite_type = 1
    manga: number[]; // favourite_id values where favourite_type = 2
    characters: number[]; // favourite_id values where favourite_type = 3
    staff: number[]; // favourite_id values where favourite_type = 4
    studios: number[]; // favourite_id values where favourite_type = 5
  };
}

export interface DisplayMedia {
  // From GDPR (source of truth)
  status: MediaStatus;
  score: number;
  progress: number;
  progressVolumes: number;
  repeat: number;
  priority: number;
  tierId: number | null; // TASK 14: Tier assignment
  isPrivate: boolean;
  notes: string | null;
  customLists: string[];
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  mediaType: MediaType;
  advancedScores: number[];
  hiddenDefault: boolean;

  // From API (enrichment only)
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
  };
  coverImage: string | null;
  bannerImage: string | null;
  format: string | null;
  episodes: number | null;
  chapters: number | null;
  volumes: number | null;
  genres: string[];
  season: string | null;
  seasonYear: number | null;
  description: string | null;
  originType: OriginType; // Auto-classified: manga, manhua, or manhwa

  // Internal only - never shown in UI
  _seriesId: number;
  _entryId: number; // GDPR entry ID
  _userId: number; // GDPR user ID
  _enriched: boolean;
}

export type OriginType = "manga" | "manhua" | "manhwa";

export interface AniListMediaResponse {
  id: number;
  title: {
    romaji: string;
    english: string | null;
    native: string | null;
  };
  coverImage: {
    large: string;
    medium: string;
  } | null;
  bannerImage: string | null;
  format: string | null;
  episodes: number | null;
  chapters: number | null;
  volumes: number | null;
  genres: string[];
  tags: Array<{ name: string; category?: string }>; // TASK 2: Added tags
  season: string | null;
  seasonYear: number | null;
  description: string | null;
  countryOfOrigin: string | null; // ISO country code (JP, CN, KR, etc.)
  averageScore: number | null; // TASK 2: Added averageScore
  popularity: number | null; // TASK 2: Added popularity
}
