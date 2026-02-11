import { IdentityIntelligence } from "@/components/home/IdentityIntelligence";
import { PersonalizedInsights } from "@/components/home/PersonalizedInsights";
import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { useData } from "@/context/DataContext";
import { BarChart3, PieChart, TrendingUp, Zap } from "lucide-react";
import { useMemo } from "react";

const Stats = () => {
    const { animeList, mangaList } = useData();

    const allMedia = useMemo(() => [...animeList, ...mangaList], [animeList, mangaList]);

    const genreStats = useMemo(() => {
        const counts: Record<string, number> = {};
        allMedia.forEach(m => {
            m.genres?.forEach(g => {
                counts[g] = (counts[g] || 0) + 1;
            });
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }, [allMedia]);

    return (
        <PageWrapper>
            <PageHeader 
                title="Archive Analysis" 
                subtitle="High-fidelity diagnostic report of your media vault"
                icon={BarChart3}
            />

            <PageContent className="space-y-16">
                {/* 1. Core Diagnostics */}
                <div className="space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 flex items-center gap-4">
                        <Zap className="w-4 h-4" /> Core Metrics <div className="h-px flex-1 bg-white/5" />
                    </h3>
                    <IdentityIntelligence />
                </div>

                {/* 2. Monthly Insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 flex items-center gap-4">
                            <TrendingUp className="w-4 h-4" /> Intelligence Feed <div className="h-px flex-1 bg-white/5" />
                        </h3>
                        <PersonalizedInsights />
                        <div className="bg-surface-elevated1/40 p-8 rounded-[2.5rem] border border-white/5 space-y-4">
                            <p className="text-sm text-white/60 leading-relaxed">
                                Your consumption patterns show a high affinity for <span className="text-primary font-black">{genreStats[0]?.[0]}</span> content. 
                                We recommend maintaining the current synchronization frequency to ensure archival integrity.
                            </p>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60 flex items-center gap-4">
                            <PieChart className="w-4 h-4" /> Top Genre Vectors <div className="h-px flex-1 bg-white/5" />
                        </h3>
                        <div className="bg-surface-elevated1/40 p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                            {genreStats.map(([genre, count], i) => (
                                <div key={genre} className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-white/40">
                                        <span>{genre}</span>
                                        <span className="text-primary">{count}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-primary" 
                                            style={{ width: `${(count / (genreStats[0]?.[1] || 1)) * 100}%`, opacity: 1 - (i * 0.08) }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                </div>

                {/* 3. Deep Analysis Notice */}
                <div className="pt-20 text-center">
                    <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                        Diagnostics complete. All systems nominal.
                    </div>
                </div>
            </PageContent>
        </PageWrapper>
    );
};

export default Stats;
