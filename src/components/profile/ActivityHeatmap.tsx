import { useMemo } from "react";
import { useData } from "@/context/DataContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ActivityHeatmap() {
  const { user } = useData();

  const { weeks, maxCount } = useMemo(() => {
    if (!user?.activityHistory) return { weeks: [], maxCount: 0 };

    const history = user.activityHistory;
    const entries = Object.entries(history).sort(
      ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()
    );

    if (entries.length === 0) return { weeks: [], maxCount: 0 };

    // Build a full year grid
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const dayMap = new Map<string, number>();
    for (const [date, data] of entries) {
      dayMap.set(date, data.count);
    }

    let maxC = 0;
    const allDays: { date: string; count: number; dayOfWeek: number }[] = [];
    const current = new Date(oneYearAgo);

    while (current <= today) {
      const dateStr = current.toISOString().split("T")[0];
      const count = dayMap.get(dateStr) || 0;
      if (count > maxC) maxC = count;
      allDays.push({
        date: dateStr,
        count,
        dayOfWeek: current.getDay(),
      });
      current.setDate(current.getDate() + 1);
    }

    // Group into weeks
    const wks: { date: string; count: number; dayOfWeek: number }[][] = [];
    let currentWeek: typeof allDays = [];

    for (const day of allDays) {
      if (day.dayOfWeek === 0 && currentWeek.length > 0) {
        wks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    }
    if (currentWeek.length > 0) wks.push(currentWeek);

    return { weeks: wks, maxCount: maxC };
  }, [user]);

  if (weeks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No activity data available
      </div>
    );
  }

  function getIntensity(count: number): string {
    if (count === 0) return "bg-secondary";
    const ratio = count / Math.max(maxCount, 1);
    if (ratio > 0.75) return "bg-primary";
    if (ratio > 0.5) return "bg-primary/70";
    if (ratio > 0.25) return "bg-primary/40";
    return "bg-primary/20";
  }

  return (
    <div className="bg-card rounded-lg p-4 border border-border/50">
      <h3 className="text-sm font-medium text-foreground mb-3">
        Activity ({user?.activityHistoryTotal || 0} total updates)
      </h3>
      <div className="flex gap-[3px] overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <Tooltip key={day.date}>
                <TooltipTrigger asChild>
                  <div
                    className={`heatmap-cell w-3 h-3 ${getIntensity(day.count)}`}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {day.count} update{day.count !== 1 ? "s" : ""} on {day.date}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-[3px]">
          <div className="w-3 h-3 rounded-sm bg-secondary" />
          <div className="w-3 h-3 rounded-sm bg-primary/20" />
          <div className="w-3 h-3 rounded-sm bg-primary/40" />
          <div className="w-3 h-3 rounded-sm bg-primary/70" />
          <div className="w-3 h-3 rounded-sm bg-primary" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
