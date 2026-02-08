export interface GdprData {
  user: GdprUser;
  lists: GdprListEntry[];
  favourites?: GdprFavourite[];
  activityReplies?: unknown[];
  forumThreads?: unknown[];
  forumComments?: unknown[];
  reviews?: unknown[];
}

export interface GdprUser {
  id: number;
  user_name: string;
  display_name: string;
  email: string;
  about: string;
  avatar_url: string | null;
  banner_url: string | null;
  title_language: number;
  score_type: number;
  list_order: number;
  forum_homepage: number;
  adult_content: number;
  legacy_lists: number;
  donator: number;
  notifications: number;
  anime_watched: number;
  chapters_read: number;
  custom_lists: {
    anime: string[];
    manga: string[];
  };
  advanced_scores: {
    active: boolean;
    names: string[];
  };
  hidden_categories: unknown;
  stats: GdprStats;
  ip: string;
  created_at: string;
  updated_at: string;
  airing_notifications: number;
  privacy: number;
  profile_color: string;
  donator_badge: string | null;
  notification_options: string;
  statistics: string; // JSON string
  mod_roles: number;
}

export interface GdprStats {
  status_distribution: {
    anime: Record<string, number>[] | unknown[];
    manga: Record<string, number>[] | unknown[];
  };
  score_distribution: {
    anime: Record<string, number>[] | unknown[];
    manga: Record<string, number>[] | unknown[];
  };
  activity_history: Record<string, { count: number; color: string }>;
  activity_history_total: number;
}

export interface GdprListEntry {
  id: number;
  series_type: number; // 0 = ANIME, 1 = MANGA
  user_id: number;
  series_id: number;
  status: number;
  score: number;
  progress: number;
  progress_volume: number;
  priority: number;
  repeat: number;
  private: number;
  notes: string | null;
  custom_lists: string; // JSON string of boolean array e.g. "[0,1,0,0]"
  advanced_scores: string;
  hidden_default: number;
  started_on: number; // YYYYMMDD or 0
  finished_on: number; // YYYYMMDD or 0
  created_at: string;
  updated_at: string;
}

export interface GdprFavourite {
  id: number;
  user_id: number;
  favourite_id: number; // ID of the favourited item
  favourite_type: number; // 1=ANIME, 2=MANGA, 3=CHARACTER, 4=STAFF, 5=STUDIO
  order: number; // Display order
}
