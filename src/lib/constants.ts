import type { MediaStatus, MediaType, ScoreFormat, TitleLanguage } from "@/types/display";

export const STATUS_MAP: Record<number, MediaStatus> = {
  0: "CURRENT",
  1: "PLANNING",
  2: "COMPLETED",
  3: "DROPPED",
  4: "PAUSED",
  5: "REPEATING",
};

export const STATUS_LABELS: Record<MediaStatus, Record<MediaType, string>> = {
  CURRENT: { ANIME: "Watching", MANGA: "Reading" },
  PLANNING: { ANIME: "Plan to Watch", MANGA: "Plan to Read" },
  COMPLETED: { ANIME: "Completed", MANGA: "Completed" },
  DROPPED: { ANIME: "Dropped", MANGA: "Dropped" },
  PAUSED: { ANIME: "Paused", MANGA: "Paused" },
  REPEATING: { ANIME: "Rewatching", MANGA: "Rereading" },
};

export const STATUS_ORDER: MediaStatus[] = [
  "CURRENT",
  "COMPLETED",
  "PLANNING",
  "PAUSED",
  "DROPPED",
  "REPEATING",
];

export const STATUS_COLORS: Record<MediaStatus, string> = {
  CURRENT: "var(--status-current)",
  COMPLETED: "var(--status-completed)",
  PLANNING: "var(--status-planning)",
  DROPPED: "var(--status-dropped)",
  PAUSED: "var(--status-paused)",
  REPEATING: "var(--status-repeating)",
};

export const MEDIA_TYPE_MAP: Record<number, MediaType> = {
  0: "ANIME",
  1: "MANGA",
};

export const SCORE_FORMAT_MAP: Record<number, ScoreFormat> = {
  1: "POINT_100",
  2: "POINT_10_DECIMAL",
  3: "POINT_10",
  4: "POINT_5",
  5: "POINT_3",
};

export const TITLE_LANGUAGE_MAP: Record<number, TitleLanguage> = {
  1: "ROMAJI",
  2: "ENGLISH",
  3: "NATIVE",
};

export const ANILIST_CDN = "https://s4.anilist.co/file/anilistcdn";

export function formatScore(score: number, format: ScoreFormat): string {
  if (score === 0) return "–";
  switch (format) {
    case "POINT_100":
      return String(score);
    case "POINT_10_DECIMAL":
      return (score / 10).toFixed(1);
    case "POINT_10":
      return String(Math.round(score / 10));
    case "POINT_5":
      return "★".repeat(Math.round(score / 20)) + "☆".repeat(5 - Math.round(score / 20));
    case "POINT_3": {
      if (score >= 61) return "😊";
      if (score >= 31) return "😐";
      return "😞";
    }
    default:
      return String(score);
  }
}

export function formatScoreNumeric(score: number, format: ScoreFormat): number {
  if (score === 0) return 0;
  switch (format) {
    case "POINT_100":
      return score;
    case "POINT_10_DECIMAL":
      return parseFloat((score / 10).toFixed(1));
    case "POINT_10":
      return Math.round(score / 10);
    case "POINT_5":
      return Math.round(score / 20);
    case "POINT_3":
      if (score >= 61) return 3;
      if (score >= 31) return 2;
      return 1;
    default:
      return score;
  }
}

export function formatDate(dateNum: number): string | null {
  if (!dateNum) return null;
  const str = String(dateNum);
  if (str.length !== 8) return null;
  const y = str.slice(0, 4);
  const m = str.slice(4, 6);
  const d = str.slice(6, 8);
  return `${y}-${m}-${d}`;
}

export function formatMinutes(minutes: number): string {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days} days, ${hours} hours`;
  return `${hours} hours`;
}

export function getAvatarUrl(avatarFilename: string | null): string | null {
  if (!avatarFilename) return null;
  return `${ANILIST_CDN}/user/avatar/large/${avatarFilename}`;
}
