import { useData } from "@/context/DataContext";
import { ensureArray } from "@/lib/utils";
import type { DisplayMedia } from "@/types/display";
import { motion } from "framer-motion";
import { Clock, Database, Heart, TrendingUp, Zap } from "lucide-react";
import { useMemo } from "react";

export function IdentityIntelligence() {
    const { animeList, mangaList } = useData();

    const stats = useMemo(() => {
        const allMedia = [
            ...ensureArray<DisplayMedia>(animeList), 
            ...ensureArray<DisplayMedia>(mangaList)
        ];
        const completed = allMedia.filter(m => m.status === "COMPLETED");
        
        const archiveSize = allMedia.length;
        const completionPower = archiveSize > 0 
            ? Math.round((completed.length / archiveSize) * 100) 
            : 0;

        const totalMinutes = ensureArray<DisplayMedia>(animeList).reduce((acc, m) => acc + (m.progress * (m.duration || 24)), 0);
        const hoursInvested = Math.round(totalMinutes / 60);

        const genreMap: Record<string, number> = {};
        allMedia.forEach(m => {
            ensureArray<string>(m.genres).forEach(g => genreMap[g] = (genreMap[g] || 0) + 1);
        });
        const moodFingerprint = Object.entries(genreMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

        return { archiveSize, hoursInvested, completionPower, moodFingerprint };
    }, [animeList, mangaList]);

    return (
        <section className="space-y-10">
            <div className="flex items-end justify-between px-2">
                <div className="space-y-1">
                    <h2 className="text-[10px] font-semibold uppercase leading-none tracking-[0.4em] text-primary/60">
                        Collector Analytics
                    </h2>
                    <p className="text-4xl md:text-5xl font-black tracking-tighter leading-none">Vault Intelligence</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                    Archive Synced
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <IntelligenceCard 
                    label="Archive Scale" 
                    value={stats.archiveSize} 
                    sub="Recorded Entries"
                    icon={Database} 
                    percentage={Math.min(100, (stats.archiveSize / 1000) * 100)}
                    color="hsl(var(--primary))"
                    delay={0}
                />
                <IntelligenceCard 
                    label="Archival Runtime" 
                    value={`${stats.hoursInvested}h`} 
                    sub="Total Chronology"
                    icon={Clock} 
                    percentage={Math.min(100, (stats.hoursInvested / 2000) * 100)}
                    color="hsl(350 52% 62%)"
                    delay={0.1}
                />
                <IntelligenceCard 
                    label="Completion Efficiency" 
                    value={`${stats.completionPower}%`} 
                    sub="Task Resolution"
                    icon={Zap} 
                    percentage={stats.completionPower}
                    color="hsl(var(--warning))"
                    delay={0.2}
                />
                <IntelligenceCard 
                    label="Core Archetype" 
                    value={stats.moodFingerprint} 
                    sub="Dominant Genre"
                    icon={Heart} 
                    percentage={75}
                    color="hsl(336 68% 62%)"
                    delay={0.3}
                />
            </div>
        </section>
    );
}

interface IntelligenceCardProps {
    label: string;
    value: string | number;
    sub: string;
    icon: React.ElementType;
    percentage: number;
    color: string;
    delay: number;
}

function IntelligenceCard({ label, value, sub, icon: Icon, percentage, color, delay }: IntelligenceCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay, ease: [0.23, 1, 0.32, 1] }}
            className="group relative rounded-[2rem] border border-border bg-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-card"
        >
            <div className="flex justify-between items-start mb-10">
                <div 
                    className="rounded-2xl border border-border bg-muted/50 p-4 transition-all group-hover:scale-105"
                    style={{ color }}
                >
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/70">Nominal</span>
                </div>
            </div>
            
            <div className="space-y-6">
                <div>
                    <p className="text-4xl font-black tracking-tighter tabular-nums text-foreground transition-colors group-hover:text-primary">{value}</p>
                    <h3 className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</h3>
                </div>

                <div className="space-y-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1.5, delay: delay + 0.5, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                        />
                    </div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{sub}</p>
                </div>
            </div>

            <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-primary/0 transition-all duration-500 group-hover:border-primary/20" />
        </motion.div>
    );
}

