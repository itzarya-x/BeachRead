import { IdentityIntelligence } from "@/components/home/IdentityIntelligence";
import { PersonalizedInsights } from "@/components/home/PersonalizedInsights";
import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { useData } from "@/context/DataContext";
import type { DisplayMedia } from "@/types/display";
import { safeArray } from "@/utils/safeArray";
import { motion } from "framer-motion";
import { Activity, BarChart3, PieChart, TrendingUp, Zap } from "lucide-react";
import { useMemo } from "react";

const Stats = () => {
    const { animeList, mangaList } = useData();

    const allMedia = useMemo(() => [
        ...safeArray<DisplayMedia>(animeList), 
        ...safeArray<DisplayMedia>(mangaList)
    ], [animeList, mangaList]);

    const genreStats = useMemo(() => {
        const counts: Record<string, number> = {};
        safeArray<DisplayMedia>(allMedia).forEach(m => {
            safeArray<string>(m.genres).forEach(g => counts[g] = (counts[g] || 0) + 1);
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }, [allMedia]);

    return (
        <PageWrapper>
            <PageHeader 
                title="System Intelligence" 
                subtitle="High-fidelity diagnostic report of your archival universe"
                icon={BarChart3}
            />

            <PageContent className="space-y-24">
                {/* 1. Core Diagnostics */}
                <div className="space-y-12">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10 flex items-center gap-6">
                        <Zap className="w-4 h-4" /> Core Matrix <div className="h-px flex-1 bg-white/5" />
                    </h3>
                    <IdentityIntelligence />
                </div>

                {/* 2. Monthly Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                     <div className="space-y-10">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10 flex items-center gap-6">
                            <TrendingUp className="w-4 h-4" /> Intelligence Feed <div className="h-px flex-1 bg-white/5" />
                        </h3>
                        <PersonalizedInsights />
                        <div className="bg-[#101827]/60 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/5 space-y-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Activity className="w-32 h-32" />
                            </div>
                            <p className="text-xl text-white/60 leading-relaxed font-medium tracking-tight relative z-10">
                                Archival patterns indicate a significant synchronization with <span className="text-primary font-black">{genreStats[0]?.[0]}</span> narratives. 
                                System recommends optimizing intake for this specific vector.
                            </p>
                            <div className="flex items-center gap-4 text-[10px] font-black text-primary/40 uppercase tracking-widest relative z-10">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Analysis Verified
                            </div>
                        </div>
                     </div>

                     <div className="space-y-10">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10 flex items-center gap-6">
                            <PieChart className="w-4 h-4" /> Structural Distribution <div className="h-px flex-1 bg-white/5" />
                        </h3>
                        <div className="bg-[#101827]/60 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/5 space-y-8">
                            {genreStats.map(([genre, count], i) => (
                                <div key={genre} className="space-y-3">
                                    <div className="flex justify-between items-end text-[11px] font-black uppercase tracking-[0.2em] text-white/30">
                                        <span className="text-white hover:text-primary transition-colors cursor-default">{genre}</span>
                                        <div className="flex items-end gap-2">
                                            <span className="text-white/60 tabular-nums">{count}</span>
                                            <span className="text-[8px] text-white/10 font-bold tracking-normal mb-0.5">UNITS</span>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden group/bar relative">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(count / (genreStats[0]?.[1] || 1)) * 100}%` }}
                                            transition={{ duration: 1, delay: i * 0.1 }}
                                            className="h-full bg-primary relative" 
                                            style={{ opacity: 1 - (i * 0.08) }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                        </motion.div>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                </div>

                {/* 3. Status Report */}
                <div className="pt-20 border-t border-white/5 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-primary/40" />
                        ))}
                    </div>
                    <div className="inline-flex items-center gap-4 px-8 py-3 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                        Diagnostics complete. Vault integrity at 99.8%.
                    </div>
                </div>
            </PageContent>
        </PageWrapper>
    );
};


export default Stats;
