export type ActivityType =
  | "add"
  | "progress"
  | "complete"
  | "drop"
  | "score_change"
  | "tier_change"
  | "import"
  | "sync"
  | "delete";

export interface UserActivity {
  id: string;
  user_id: string;
  series_id: number | null;
  media_id: string | number | null;
  action_type: ActivityType;
  media_type: "ANIME" | "MANGA" | null;
  details: Record<string, any>;
  created_at: string;
}
