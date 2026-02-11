import { useData } from "@/context/DataContext";
import { motion } from "framer-motion";
import { Clock, Database, Heart, TrendingUp, Zap } from "lucide-react";
import { useMemo } from "react";

export function IdentityIntelligence() {
    const { animeList, mangaList } = useData();

    const stats = useMemo(() => {
        const allMedia = [...animeList, ...mangaList];
        const completed = allMedia.filter(m => m.status === "COMPLETED");
        
        const archiveSize = allMedia.length;
        const completionPower = archiveSize > 0 
            ? Math.round((completed.length / archiveSize) * 100) 
            : 0;

        const totalMinutes = animeList.reduce((acc, m) => acc + (m.progress * (m.duration || 24)), 0);
        const hoursInvested = Math.round(totalMinutes / 60);

        const genreMap: Record<string, number> = {};
        allMedia.forEach(m => {
            m.genres?.forEach(g => genreMap[g] = (genreMap[g] || 0) + 1);
        });
        const moodFingerprint = Object.entries(genreMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

        return { archiveSize, hoursInvested, completionPower, moodFingerprint };
    }, [animeList, mangaList]);

    return (
        <section className="space-y-10">
            <div className="flex items-end justify-between px-2">
                <div className="space-y-1">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 leading-none">
                        Collector Analytics
                    </h2>
                    <p className="text-4xl md:text-5xl font-black tracking-tighter leading-none">Vault Intelligence</p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                    <div className="w-2 h-2 rounded-full bg-primary shadow-glow animate-pulse" />
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
                    color="#38bdf8"
                    delay={0}
                />
                <IntelligenceCard 
                    label="Archival Runtime" 
                    value={`${stats.hoursInvested}h`} 
                    sub="Total Chronology"
                    icon={Clock} 
                    percentage={Math.min(100, (stats.hoursInvested / 2000) * 100)}
                    color="#818cf8"
                    delay={0.1}
                />
                <IntelligenceCard 
                    label="Completion Efficiency" 
                    value={`${stats.completionPower}%`} 
                    sub="Task Resolution"
                    icon={Zap} 
                    percentage={stats.completionPower}
                    color="#fbbf24"
                    delay={0.2}
                />
                <IntelligenceCard 
                    label="Core Archetype" 
                    value={stats.moodFingerprint} 
                    sub="Dominant Genre"
                    icon={Heart} 
                    percentage={75}
                    color="#f472b6"
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
            className="group relative bg-[#101827]/40 backdrop-blur-xl rounded-[2rem] border border-white/5 p-8 transition-all hover:bg-white/[0.04] hover:-translate-y-2"
        >
            <div className="flex justify-between items-start mb-10">
                <div 
                    className="p-4 rounded-2xl bg-white/5 border border-white/5 transition-all group-hover:scale-110 shadow-xl"
                    style={{ color }}
                >
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest">Nominal</span>
                </div>
            </div>
            
            <div className="space-y-6">
                <div>
                    <p className="text-4xl font-black tracking-tighter tabular-nums text-white group-hover:text-primary transition-colors">{value}</p>
                    <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">{label}</h3>
                </div>

                <div className="space-y-2">
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1.5, delay: delay + 0.5, ease: "easeOut" }}
                            className="h-full rounded-full shadow-glow"
                            style={{ backgroundColor: color }}
                        />
                    </div>
                    <p className="text-[9px] font-bold text-white/10 uppercase tracking-[0.1em]">{sub}</p>
                </div>
            </div>

            {/* Accent Border Glow */}
            <div className="absolute inset-0 rounded-[2rem] border border-primary/0 group-hover:border-primary/20 transition-all duration-500 pointer-events-none" />
        </motion.div>
    );
}


