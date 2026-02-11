import { Card } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import ds from "@/styles/design-system";
import { motion } from "framer-motion";
import { Activity, CheckCircle, PlayCircle, Star } from "lucide-react";
import { useMemo } from "react";

export function QuickStatsRibbon() {
    const { animeList, mangaList, user } = useData();

    const stats = useMemo(() => {
        const allMedia = [...animeList, ...mangaList];
        
        const watching = allMedia.filter(m => m.status === "CURRENT").length;
        const completed = allMedia.filter(m => m.status === "COMPLETED").length;
        
        const scoredItems = allMedia.filter(m => m.score > 0);
        const avgScore = scoredItems.length > 0
            ? (scoredItems.reduce((acc, m) => acc + m.score, 0) / scoredItems.length).toFixed(1)
            : "0.0";

        // Mock "This week activity" for now as we don't have easy access to activity logs here without heavy calculation
        // or we could use user.statistics if available, but let's just show Total Items for now or something else.
        // Actually, let's use "Planned" as a quick stat.
        const planned = allMedia.filter(m => m.status === "PLANNING").length;

        return { watching, completed, avgScore, planned };
    }, [animeList, mangaList]);

    return (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsRibbonCard 
                label="Watching" 
                value={stats.watching} 
                icon={PlayCircle} 
                accentColor={ds.status.syncing}
                delay={0}
            />
            <StatsRibbonCard 
                label="Completed" 
                value={stats.completed} 
                icon={CheckCircle} 
                accentColor={ds.status.success}
                delay={0.1}
            />
            <StatsRibbonCard 
                label="Avg Score" 
                value={stats.avgScore} 
                icon={Star} 
                accentColor={ds.status.warning}
                delay={0.2}
            />
             <StatsRibbonCard 
                label="Planning" 
                value={stats.planned} 
                icon={Activity} 
                accentColor={ds.status.info}
                delay={0.3}
            />
        </section>
    );
}

interface StatsRibbonCardProps {
    label: string;
    value: string | number;
    icon: React.ElementType;
    accentColor: string;
    delay: number;
}

function StatsRibbonCard({ label, value, icon: Icon, accentColor, delay }: StatsRibbonCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay }}
            whileHover={{ y: -4 }}
        >
            <Card className="flex items-center gap-5 p-5 border-none shadow-sm bg-surface-1 hover:bg-surface-2 transition-all duration-300 group overflow-hidden relative">
                {/* Decorative background glow */}
                <div 
                    className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity"
                    style={{ backgroundColor: accentColor }}
                />
                
                <div 
                    className="p-3.5 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ 
                        backgroundColor: `${accentColor}15`,
                        color: accentColor
                    }}
                >
                    <Icon className="w-6 h-6" />
                </div>
                
                <div className="relative z-10">
                    <p className="text-2xl font-black text-foreground leading-none tracking-tight">{value}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] mt-2">{label}</p>
                </div>
            </Card>
        </motion.div>
    );
}
