export type ActivityType =
  | "add"
  | "progress"
  | "complete"
  | "drop"
  | "score_change"
  | "tier_change"
  | "import"
  | "sync";

export interface UserActivity {
  id: string;
  user_id: string;
  media_id: string | number | null;
  anilist_media_id: number | null;
  type: ActivityType;
  metadata: Record<string, any>;
  created_at: string;
}
