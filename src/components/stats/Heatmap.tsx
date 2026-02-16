import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { format, subDays, eachDayOfInterval, isSameDay, startOfMonth, isFirstDayOfMonth } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HeatmapProps {
    data: { date: string; count: number }[];
    days?: number;
}

export function Heatmap({ data, days = 365 }: HeatmapProps) {
    const today = new Date();
    const startDate = subDays(today, days);

    const allDays = useMemo(() => {
        return eachDayOfInterval({ start: startDate, end: today });
    }, [startDate, today]);

    const getColor = (count: number) => {
        if (count === 0) return "bg-white/5";
        if (count < 2) return "bg-primary/20";
        if (count < 5) return "bg-primary/40";
        if (count < 10) return "bg-primary/70";
        return "bg-primary";
    };

    // Group days by week for vertical layout or just keep as list for grid
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];

    allDays.forEach((day) => {
        currentWeek.push(day);
        if (day.getDay() === 6 || isSameDay(day, today)) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });

    return (
        <TooltipProvider>
            <div className="flex flex-col gap-2 overflow-x-auto pb-2 scrollbar-none">
                <div className="flex gap-[3px]">
                    {weeks.map((week, weekIdx) => (
                        <div key={weekIdx} className="flex flex-col gap-[3px]">
                            {/* Month label */}
                            <div className="h-3 text-[8px] font-black uppercase text-white/20">
                                {week.some(d => isFirstDayOfMonth(d)) ? format(week.find(d => isFirstDayOfMonth(d))!, "MMM") : ""}
                            </div>
                            
                            {/* Ensure all weeks have 7 slots (padding for first/last) */}
                            {Array.from({ length: 7 }).map((_, dayIdx) => {
                                const day = week.find(d => d.getDay() === dayIdx);
                                if (!day) return <div key={dayIdx} className="w-3 h-3" />;

                                const dayData = data.find(d => isSameDay(new Date(d.date), day));
                                const count = dayData?.count || 0;

                                return (
                                    <Tooltip key={dayIdx}>
                                        <TooltipTrigger asChild>
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: (weekIdx * 0.01) + (dayIdx * 0.005) }}
                                                className={cn(
                                                    "w-3 h-3 rounded-[2px] transition-colors duration-300 hover:ring-1 hover:ring-primary/50 cursor-pointer",
                                                    getColor(count)
                                                )}
                                            />
                                        </TooltipTrigger>
                                        <TooltipContent className="sakura-glass border-white/10 text-[10px] uppercase font-bold tracking-wider">
                                            {count} actions on {format(day, "MMM do, yyyy")}
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    ))}
                </div>
                
                <div className="flex items-center gap-2 text-[9px] font-bold text-white/20 uppercase tracking-tight self-end mr-4">
                    <span>Less</span>
                    <div className="flex gap-[2px]">
                        <div className="w-2.5 h-2.5 rounded-[1px] bg-white/5" />
                        <div className="w-2.5 h-2.5 rounded-[1px] bg-primary/20" />
                        <div className="w-2.5 h-2.5 rounded-[1px] bg-primary/40" />
                        <div className="w-2.5 h-2.5 rounded-[1px] bg-primary/70" />
                        <div className="w-2.5 h-2.5 rounded-[1px] bg-primary" />
                    </div>
                    <span>More</span>
                </div>
            </div>
        </TooltipProvider>
    );
}
