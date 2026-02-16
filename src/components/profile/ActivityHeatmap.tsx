import { useMemo } from "react";
import { useData } from "@/context/DataContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { startOfDay } from "date-fns";
import { safeDate, safeFormat } from "@/lib/utils";

export function ActivityHeatmap() {
  const { activities } = useData();

  const { weeks, maxCount, totalUpdates } = useMemo(() => {
    if (!activities || activities.length === 0) return { weeks: [], maxCount: 0, totalUpdates: 0 };

    // Group activities by day
    const dayMap = new Map<string, number>();
    activities.forEach(activity => {
        const dateStr = safeFormat(activity.createdAt, "yyyy-MM-dd");
        if (dateStr === "unknown") return;
        dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + 1);
    });

    // Build a full year grid ending today
    const today = startOfDay(new Date());
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    let maxC = 0;
    const allDays: { date: string; count: number; dayOfWeek: number }[] = [];
    const current = new Date(oneYearAgo);

    while (current <= today) {
      const dateStr = safeFormat(current, "yyyy-MM-dd");
      const count = dayMap.get(dateStr) || 0;
      if (count > maxC) maxC = count;
      allDays.push({
        date: dateStr,
        count,
        dayOfWeek: current.getDay(),
      });
      current.setDate(current.getDate() + 1);
    }

    // Group into weeks (starting from first day)
    const wks: { date: string; count: number; dayOfWeek: number }[][] = [];
    let currentWeek: typeof allDays = [];

    // Alignment: fill start of first week if oneYearAgo isn't Sunday (day 0)
    const firstDayOfWeek = allDays[0].dayOfWeek;
    for (let i = 0; i < firstDayOfWeek; i++) {
        // Placeholder or empty? heatmap looks better if we just start exactly where it was
    }

    for (const day of allDays) {
      if (day.dayOfWeek === 0 && currentWeek.length > 0) {
        wks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    }
    if (currentWeek.length > 0) wks.push(currentWeek);

    return { weeks: wks, maxCount: maxC, totalUpdates: activities.length };
  }, [activities]);

  if (weeks.length === 0) {
    return (
      <div className="text-center py-8 text-white/20 text-[10px] font-black uppercase tracking-widest border border-white/5 rounded-2xl bg-white/5">
        No synchronization data available
      </div>
    );
  }

  function getIntensity(count: number): string {
    if (count === 0) return "bg-white/5";
    const ratio = count / Math.max(maxCount, 1);
    if (ratio > 0.75) return "bg-primary shadow-[0_0_10px_rgba(253,75,126,0.4)]";
    if (ratio > 0.5) return "bg-primary/70";
    if (ratio > 0.25) return "bg-primary/40";
    return "bg-primary/20";
  }

  return (
    <div className="rounded-2xl p-6 border border-white/5 bg-white/[0.02] backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Neural Activity</h3>
            <p className="text-[9px] text-white/30 uppercase tracking-widest">Temporal Frequency Mapping</p>
        </div>
        <div className="text-right">
            <p className="text-xl font-black text-white">{totalUpdates}</p>
            <p className="text-[8px] font-bold text-white/20 uppercase tracking-tighter">Total Synchronizations</p>
        </div>
      </div>

      <div className="flex gap-[4px] overflow-x-auto pb-4 scrollbar-hide">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[4px] shrink-0">
            {week.map((day) => (
              <Tooltip key={day.date}>
                <TooltipTrigger asChild>
                  <div
                    className={`heatmap-cell w-3 h-3 rounded-sm transition-all duration-300 hover:scale-125 hover:z-10 ${getIntensity(day.count)}`}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="sakura-tooltip">
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    {day.count} events • {safeFormat(day.date, "MMM d, yyyy")}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-3 mt-2">
        <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Low</span>
        <div className="flex gap-[3px]">
          <div className="w-2 h-2 rounded-[1px] bg-white/5" />
          <div className="w-2 h-2 rounded-[1px] bg-primary/20" />
          <div className="w-2 h-2 rounded-[1px] bg-primary/40" />
          <div className="w-2 h-2 rounded-[1px] bg-primary/70" />
          <div className="w-2 h-2 rounded-[1px] bg-primary" />
        </div>
        <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Peak</span>
      </div>
    </div>
  );
}
