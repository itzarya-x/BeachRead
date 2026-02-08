import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import type { DisplayMedia, MediaType, MediaStatus } from "@/types/display";
import { STATUS_ORDER, STATUS_LABELS } from "@/lib/constants";

interface StatusChartProps {
  items: DisplayMedia[];
  mediaType: MediaType;
  onStatusClick?: (items: DisplayMedia[], status: string) => void;
}

const STATUS_COLOR_MAP: Record<MediaStatus, string> = {
  CURRENT: "hsl(var(--status-current))",
  COMPLETED: "hsl(var(--status-completed))",
  PLANNING: "hsl(var(--status-planning))",
  DROPPED: "hsl(var(--status-dropped))",
  PAUSED: "hsl(var(--status-paused))",
  REPEATING: "hsl(var(--status-repeating))",
};

export function StatusChart({ items, mediaType, onStatusClick }: StatusChartProps) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    const itemsByStatus: Record<string, DisplayMedia[]> = {};
    
    for (const item of items) {
      counts[item.status] = (counts[item.status] || 0) + 1;
      if (!itemsByStatus[item.status]) {
        itemsByStatus[item.status] = [];
      }
      itemsByStatus[item.status].push(item);
    }

    return STATUS_ORDER.filter((s) => counts[s] > 0).map((status) => ({
      name: STATUS_LABELS[status][mediaType],
      value: counts[status],
      status,
      items: itemsByStatus[status] || [],
    }));
  }, [items, mediaType]);

  return (
    <div className="bg-card rounded-lg p-4 border border-border/50">
      <h3 className="text-sm font-medium text-foreground mb-4">
        Status Distribution ({mediaType === "ANIME" ? "Anime" : "Manga"})
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            onClick={(entry: any) => {
              if (onStatusClick && entry?.items && entry?.name) {
                onStatusClick(entry.items, entry.name);
              }
            }}
            style={{ cursor: onStatusClick ? 'pointer' : 'default' }}
          >
            {data.map((entry) => (
              <Cell
                key={entry.status}
                fill={STATUS_COLOR_MAP[entry.status]}
                stroke="hsl(var(--card))"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "6px",
              color: "hsl(var(--foreground))",
            }}
            formatter={(value: number) => [`${value} entries`, "Count"]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 12 }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
