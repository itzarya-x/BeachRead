import type { ScoreFormat } from "@/types/display";
import { formatScore } from "@/lib/constants";
import { Star } from "lucide-react";

interface ScoreDisplayProps {
  score: number;
  format: ScoreFormat;
  size?: "sm" | "md" | "lg";
}

export function ScoreDisplay({ score, format, size = "md" }: ScoreDisplayProps) {
  if (score === 0) return null;

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  if (format === "POINT_5") {
    const stars = Math.round(score / 20);
    return (
      <div className={`flex items-center gap-0.5 ${sizeClasses[size]}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`${size === "sm" ? "w-3 h-3" : size === "lg" ? "w-5 h-5" : "w-4 h-4"} ${
              i <= stars ? "fill-score-mid text-score-mid" : "text-muted"
            }`}
          />
        ))}
      </div>
    );
  }

  if (format === "POINT_3") {
    return (
      <span className={sizeClasses[size]}>{formatScore(score, format)}</span>
    );
  }

  // Numeric formats
  const scoreColor =
    score >= 75
      ? "text-score-high"
      : score >= 50
        ? "text-score-mid"
        : "text-score-low";

  return (
    <span className={`${sizeClasses[size]} font-semibold ${scoreColor}`}>
      {formatScore(score, format)}
    </span>
  );
}
