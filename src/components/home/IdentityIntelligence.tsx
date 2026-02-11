import { useData } from "@/context/DataContext";
import { motion } from "framer-motion";
import { Activity, Clock, Database, Heart, Zap } from "lucide-react";
import { useMemo } from "react";

export function IdentityIntelligence() {
    const { animeList, mangaList, user } = useData();

    const stats = useMemo(() => {
        const allMedia = [...animeList, ...mangaList];
        const completed = allMedia.filter(m => m.status === "COMPLETED");
        
        // Archive Size (Total unique items)
        const archiveSize = allMedia.length;

        // Completion Power (Percent of total)
        const completionPower = archiveSize > 0 
            ? Math.round((completed.length / archiveSize) * 100) 
            : 0;

        // Hours spent (Estimation based on episodes)
        const totalMinutes = animeList.reduce((acc, m) => acc + (m.progress * (m.duration || 24)), 0);
        const hoursInvested = Math.round(totalMinutes / 60);

        // Top Genre (Mood Fingerprint)
        const genreMap: Record<string, number> = {};
        allMedia.forEach(m => {
            m.genres?.forEach(g => {
                genreMap[g] = (genreMap[g] || 0) + 1;
            });
        });
        const moodFingerprint = Object.entries(genreMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";

        return { archiveSize, hoursInvested, completionPower, moodFingerprint };
    }, [animeList, mangaList]);

    return (
        <section className="space-y-6">
            <div className="flex items-end justify-between px-2">
                <div className="space-y-1">
                    <h2 className="text-[ds.typography.micro.size] font-black uppercase tracking-[0.3em] text-primary/60">
                        Collector Intelligence
                    </h2>
                    <p className="text-2xl font-black tracking-tight">Vault Diagnostics</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">
                    <Activity className="w-3 h-3 text-primary animate-pulse" />
                    Live Sync Active
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <IntelligenceCard 
                    label="Archive Size" 
                    value={stats.archiveSize} 
                    sub="Total Assets"
                    icon={Database} 
                    color="hsl(199, 89%, 58%)"
                    delay={0}
                />
                <IntelligenceCard 
                    label="Time Invested" 
                    value={`${stats.hoursInvested}h`} 
                    sub="Collective Hours"
                    icon={Clock} 
                    color="hsl(280, 100%, 70%)"
                    delay={0.1}
                />
                <IntelligenceCard 
                    label="Completion Power" 
                    value={`${stats.completionPower}%`} 
                    sub="Efficiency Rating"
                    icon={Zap} 
                    color="hsl(45, 100%, 50%)"
                    delay={0.2}
                />
                <IntelligenceCard 
                    label="Mood Fingerprint" 
                    value={stats.moodFingerprint} 
                    sub="Dominant Vector"
                    icon={Heart} 
                    color="hsl(150, 80%, 50%)"
                    delay={0.3}
                />
            </div>
        </section>
    );
}

function IntelligenceCard({ label, value, sub, icon: Icon, color, delay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -5 }}
            className="group relative"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent rounded-2xl border border-white/[0.05] -z-10" />
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div 
                        className="p-2.5 rounded-xl bg-surface-elevated2 border border-white/[0.05] transition-all group-hover:scale-110"
                        style={{ color }}
                    >
                        <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-[10px] font-black tracking-widest text-muted-foreground/30 uppercase group-hover:text-primary/40 transition-colors">
                        Verified
                    </div>
                </div>
                
                <div className="space-y-1">
                    <p className="text-3xl font-black tracking-tighter tabular-nums">{value}</p>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
                        <div className="h-px flex-1 bg-white/[0.05]" />
                    </div>
                    <p className="text-[9px] font-medium text-muted-foreground/40 uppercase tracking-widest">{sub}</p>
                </div>
            </div>

            {/* Subtle glow on hover */}
            <div 
                className="absolute inset-x-4 bottom-0 h-px transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
            />
        </motion.div>
    );
}
