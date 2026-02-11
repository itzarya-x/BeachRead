import { HabitsAnalytics } from "@/lib/stats-engine";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    XAxis,
    YAxis
} from "recharts";

interface HabitsChartsProps {
    data: HabitsAnalytics;
}

export function HabitsCharts({ data }: HabitsChartsProps) {
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}:00`,
        count: data.hourly[i] || 0,
        rawHour: i
    }));

    const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekdayData = weekdayLabels.map((label, i) => ({
        day: label,
        count: data.weekday[i] || 0
    }));

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover/95 border border-border p-3 rounded-lg shadow-xl backdrop-blur-md">
                    <p className="text-xs font-bold text-foreground">{label}</p>
                    <p className="text-sm text-primary font-semibold">{payload[0].value} actions</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Trends */}
            <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-foreground mb-1">Peak Hours</h3>
                <p className="text-sm text-muted-foreground mb-6">When are you most active?</p>
                
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={hourlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis 
                                dataKey="hour" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 10, fill: "#868e96" }}
                                interval={3}
                            />
                            <YAxis hide />
                            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {hourlyData.map((entry, index) => {
                                    // Highlight night hours
                                    const isNight = entry.rawHour >= 22 || entry.rawHour <= 4;
                                    return <Cell key={`cell-${index}`} fill={isNight ? "#845ef7" : "#339af0"} fillOpacity={0.8} />;
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 mt-4 justify-center">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-[#339af0]" />
                        <span>Daylight</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-[#845ef7]" />
                        <span>Late Night</span>
                    </div>
                </div>
            </div>

            {/* Weekday Trends */}
            <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-foreground mb-1">Weekly Rhythm</h3>
                <p className="text-sm text-muted-foreground mb-6">Activity by day of week</p>
                
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weekdayData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis 
                                dataKey="day" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fontSize: 11, fill: "#868e96" }}
                            />
                            <YAxis hide />
                            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {weekdayData.map((entry, index) => {
                                    const isWeekend = index === 0 || index === 6;
                                    return <Cell key={`cell-${index}`} fill={isWeekend ? "#f06595" : "#20c997"} fillOpacity={0.8} />;
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 mt-4 justify-center">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-[#20c997]" />
                        <span>Weekday</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <div className="w-2 h-2 rounded-full bg-[#f06595]" />
                        <span>Weekend</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
