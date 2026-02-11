import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ActivityHeatmapData } from "@/lib/stats-engine";
import { eachDayOfInterval, format, startOfDay, subMonths } from "date-fns";
import { useMemo } from "react";

interface ActivityHeatmapProps {
    data: ActivityHeatmapData[];
    onDayClick?: (data: ActivityHeatmapData) => void;
}

export function ActivityHeatmap({ data, onDayClick }: ActivityHeatmapProps) {
    // Generate last 12 months of days
    const days = useMemo(() => {
        const end = startOfDay(new Date());
        const start = subMonths(end, 12);
        return eachDayOfInterval({ start, end });
    }, []);

    // Map data to a quick lookup
    const dataMap = useMemo(() => {
        const map = new Map<string, ActivityHeatmapData>();
        data.forEach(d => map.set(d.date, d));
        return map;
    }, [data]);

    const getIntensity = (count: number) => {
        if (count === 0) return "bg-zinc-900/50";
        if (count < 3) return "bg-primary/20";
        if (count < 6) return "bg-primary/40";
        if (count < 10) return "bg-primary/70";
        return "bg-primary";
    };

    // Group days by week for the grid
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    
    // Find first Sunday (or whatever day starts the grid)
    // To keep it simple, we just grid them.
    days.forEach((day, i) => {
        currentWeek.push(day);
        if (currentWeek.length === 7 || i === days.length - 1) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });

    return (
        <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm overflow-x-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Activity Intensity</h3>
                    <p className="text-sm text-muted-foreground">Your actions over the last 12 months</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-zinc-900/50" />
                        <div className="w-3 h-3 rounded-sm bg-primary/20" />
                        <div className="w-3 h-3 rounded-sm bg-primary/40" />
                        <div className="w-3 h-3 rounded-sm bg-primary/70" />
                        <div className="w-3 h-3 rounded-sm bg-primary" />
                    </div>
                    <span>More</span>
                </div>
            </div>

            <div className="flex gap-1.5 min-w-max">
                {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-1.5">
                        {week.map((day, di) => {
                            const dateStr = format(day, "yyyy-MM-dd");
                            const dayData = dataMap.get(dateStr);
                            const count = dayData?.count || 0;

                            return (
                                <TooltipProvider key={di}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div
                                                onClick={() => dayData && onDayClick?.(dayData)}
                                                className={`w-3.5 h-3.5 rounded-sm transition-all duration-300 cursor-pointer hover:ring-2 hover:ring-primary/50 hover:scale-110 ${getIntensity(count)}`}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-popover/95 border-primary/20 backdrop-blur-md">
                                            <div className="text-xs">
                                                <p className="font-bold">{format(day, "PPPP")}</p>
                                                <p className="text-primary">{count} actions recorded</p>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        })}
                    </div>
                ))}
            </div>
            
            <div className="flex justify-between mt-4 px-2">
                 {/* Month labels could go here */}
            </div>
        </div>
    );
}
