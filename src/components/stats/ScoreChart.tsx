import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DisplayMedia, MediaType, ScoreFormat } from "@/types/display";
import { formatScoreNumeric } from "@/lib/constants";

interface ScoreChartProps {
  items: DisplayMedia[];
  mediaType: MediaType;
  scoreFormat: ScoreFormat;
  onBucketClick?: (items: DisplayMedia[], label: string) => void;
}

export function ScoreChart({ items, mediaType, scoreFormat, onBucketClick }: ScoreChartProps) {
  const data = useMemo(() => {
    const scored = items.filter((i) => i.score > 0);

    if (scoreFormat === "POINT_100") {
      // Group by 10s
      const buckets = Array.from({ length: 10 }, (_, i) => ({
        label: `${(i + 1) * 10}`,
        range: `${i * 10 + 1}-${(i + 1) * 10}`,
        count: 0,
        items: [] as DisplayMedia[],
      }));
      for (const item of scored) {
        const idx = Math.min(Math.floor((item.score - 1) / 10), 9);
        buckets[idx].count++;
        buckets[idx].items.push(item);
      }
      return buckets;
    }

    if (scoreFormat === "POINT_10" || scoreFormat === "POINT_10_DECIMAL") {
      const buckets = Array.from({ length: 10 }, (_, i) => ({
        label: String(i + 1),
        range: String(i + 1),
        count: 0,
        items: [] as DisplayMedia[],
      }));
      for (const item of scored) {
        const val = Math.min(Math.round(item.score / 10), 10);
        const idx = Math.max(val - 1, 0);
        buckets[idx].count++;
        buckets[idx].items.push(item);
      }
      return buckets;
    }

    if (scoreFormat === "POINT_5") {
      const buckets = Array.from({ length: 5 }, (_, i) => ({
        label: "★".repeat(i + 1),
        range: `${i + 1} star${i > 0 ? "s" : ""}`,
        count: 0,
        items: [] as DisplayMedia[],
      }));
      for (const item of scored) {
        const stars = Math.min(Math.round(item.score / 20), 5);
        const idx = Math.max(stars - 1, 0);
        buckets[idx].count++;
        buckets[idx].items.push(item);
      }
      return buckets;
    }

    // POINT_3
    const buckets = [
      { label: "😞", range: "Bad", count: 0, items: [] as DisplayMedia[] },
      { label: "😐", range: "OK", count: 0, items: [] as DisplayMedia[] },
      { label: "😊", range: "Good", count: 0, items: [] as DisplayMedia[] },
    ];
    for (const item of scored) {
      if (item.score >= 61) {
        buckets[2].count++;
        buckets[2].items.push(item);
      } else if (item.score >= 31) {
        buckets[1].count++;
        buckets[1].items.push(item);
      } else {
        buckets[0].count++;
        buckets[0].items.push(item);
      }
    }
    return buckets;
  }, [items, scoreFormat]);

  const getBarColor = (index: number, total: number) => {
    const ratio = index / Math.max(total - 1, 1);
    if (ratio > 0.7) return "hsl(var(--score-high))";
    if (ratio > 0.3) return "hsl(var(--score-mid))";
    return "hsl(var(--score-low))";
  };

  return (
    <div className="bg-card rounded-lg p-4 border border-border/50">
      <h3 className="text-sm font-medium text-foreground mb-4">
        Score Distribution ({mediaType === "ANIME" ? "Anime" : "Manga"})
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="label"
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <YAxis
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            axisLine={{ stroke: "hsl(var(--border))" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
              color: "hsl(var(--foreground))",
            }}
            formatter={(value: number) => [`${value} entries`, "Count"]}
            labelFormatter={(label) => `Score: ${label}`}
          />
          <Bar 
            dataKey="count" 
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell 
                key={index} 
                fill={getBarColor(index, data.length)}
                onClick={() => {
                  if (onBucketClick && entry.items) {
                    onBucketClick(entry.items, entry.label);
                  }
                }}
                style={{ cursor: onBucketClick ? 'pointer' : 'default' }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
