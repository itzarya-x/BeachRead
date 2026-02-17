import { DrillDownModal } from "@/components/stats/DrillDownModal";
import { Heatmap } from "@/components/stats/Heatmap";
import { StatsAnchorNav } from "@/components/stats/v2/StatsAnchorNav";
import { StatsAdvancedMetricsPanel } from "@/components/stats/v2/StatsAdvancedMetricsPanel";
import { StatsAdvancedScorePanel } from "@/components/stats/v2/StatsAdvancedScorePanel";
import { StatsBehavioralPanel } from "@/components/stats/v2/StatsBehavioralPanel";
import { StatsFilterBar } from "@/components/stats/v2/StatsFilterBar";
import { StatsHeroSummary } from "@/components/stats/v2/StatsHeroSummary";
import { StatsProgressionPanel } from "@/components/stats/v2/StatsProgressionPanel";
import { StatsScoreIntelligencePanel } from "@/components/stats/v2/StatsScoreIntelligencePanel";
import { StatsTastePanel } from "@/components/stats/v2/StatsTastePanel";
import { StatsTimeAnalyticsPanel } from "@/components/stats/v2/StatsTimeAnalyticsPanel";
import { StatsTrendAnalyticsPanel } from "@/components/stats/v2/StatsTrendAnalyticsPanel";
import { StatsVaultIntegrityPanel } from "@/components/stats/v2/StatsVaultIntegrityPanel";
import {
  CountUp,
  IntelligenceCard,
  STATS_ANIMATION,
} from "@/components/stats/v2/StatsPrimitives";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { StatsCardSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { useData } from "@/context/DataContext";
import type { DisplayMedia } from "@/types/display";
import { safeArray } from "@/utils/safeArray";
import { 
  BrainCircuit,
  RotateCcw, 
  Flame,
  Filter
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useStats } from "@/hooks/useStats";
import { useStatsFilters } from "@/context/StatsFilterContext";
import { useNavigate } from "react-router-dom";

type DrillState = {
  title: string;
  subtitle?: string;
  items: DisplayMedia[];
} | null;

type ScoreChartBucket = {
  range: string;
  count: number;
  items: DisplayMedia[];
};

type TrendYearPoint = {
  year: number | string;
  count: number;
};

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "vault", label: "Vault" },
  { id: "score", label: "Score" },
  { id: "time", label: "Time" },
  { id: "trends", label: "Trends" },
  { id: "taste", label: "Taste" },
  { id: "advanced", label: "Advanced" },
];

export default function Stats() {
  const { user, activities, loading: dataLoading } = useData();
  const { filters, updateFilter, resetFilters } = useStatsFilters();
  const { stats, filtered, hasEntries, filtersActive, totalCount } = useStats();
  const navigate = useNavigate();
  const [drill, setDrill] = useState<DrillState>(null);
  const [activeSection, setActiveSection] = useState("overview");

  const openDrill = (title: string, items: DisplayMedia[], subtitle?: string) => {
    setDrill({ title, subtitle, items });
  };

  const activeFilterSummary = useMemo(() => {
    const summary: string[] = [];
    if (filters.displayType !== "all") summary.push(`Type: ${filters.displayType}`);
    if (filters.mediaType !== "all") summary.push(`Media: ${filters.mediaType}`);
    if (filters.statuses.length > 0) summary.push(`Status: ${filters.statuses.length}`);
    if (filters.genres.length > 0) summary.push(`Genres: ${filters.genres.length}`);
    if (filters.minScore > 0 || filters.maxScore < 100) summary.push(`Score: ${filters.minScore}-${filters.maxScore}`);
    if (filters.years.length > 0) summary.push(`Years: ${filters.years.length}`);
    if (filters.favouritesOnly) summary.push("Favourites");
    return summary;
  }, [filters]);

  const scoreChartData = useMemo<ScoreChartBucket[]>(() => {
    if (!stats) return [];
    return Object.entries(stats.score_intelligence.score_distribution).map(([range, count]) => ({
      range,
      count,
      items: filtered.filter(item => {
        const [min, max] = range.split("-").map(Number);
        return item.score >= min && item.score <= max;
      }),
    }));
  }, [stats, filtered]);

  useEffect(() => {
    const ids = NAV_ITEMS.map(item => item.id);
    const observers: IntersectionObserver[] = [];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: "-35% 0px -55% 0px", threshold: 0.1 }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach(observer => observer.disconnect());
  }, [stats]);

  if (dataLoading) {
    return (
      <PageWrapper>
        <div className="relative z-10 p-6 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card/40 rounded-2xl p-6 border border-white/5">
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <div className="bg-card/40 rounded-2xl p-6 border border-white/5">
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!hasEntries) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <BrainCircuit className="h-12 w-12 text-primary opacity-50" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight">Vault is Empty</h2>
            <p className="text-muted-foreground max-w-xs">Start building your archive to unlock advanced behavioral analytics.</p>
          </div>
          <Button onClick={() => navigate("/anime")} className="h-12 rounded-2xl px-8 shadow-glow">
            Initialize Archive
          </Button>
        </div>
      </PageWrapper>
    );
  }

  if (!stats) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
            <Filter className="h-12 w-12 text-primary opacity-60" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight">No Matches For Current Filters</h2>
            <p className="text-muted-foreground max-w-md">
              Your archive has entries, but the active stats filters excluded everything. Reset filters or pick a broader display type.
            </p>
          </div>
          <Button onClick={resetFilters} className="h-12 rounded-2xl px-8 shadow-glow">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Stats Filters
          </Button>
        </div>
      </PageWrapper>
    );
  }

  const completionPercent = stats?.hero_summary.completion_rate_percent || 0;
  const completionCircleStyle = {
    background: `conic-gradient(hsl(150 78% 55%) ${Math.min(100, Math.max(0, completionPercent))}%, hsl(var(--card) / 0.75) 0)`
  };
  const meanGlow = Math.min(1, Math.max(0, (stats?.hero_summary.overall_mean_score || 0) / 100));
  const meanGlowStyle = {
    textShadow: `0 0 ${10 + meanGlow * 18}px hsl(330 90% 70% / ${0.3 + meanGlow * 0.4})`
  };
  const vaultCardTint = {
    borderColor: `hsl(${Math.max(90, 190 - completionPercent)} 75% 62% / 0.28)`
  };
  const dominantScoreBand = scoreChartData.slice().sort((a, b) => b.count - a.count)[0];
  const scoreInsightText = stats
    ? `You mostly rate within ${dominantScoreBand?.range || "61-80"}. ${stats.score_intelligence.rating_consistency_level === "high" ? "High consistency." : "Adaptive scoring spread."} Volatility ${stats.advanced_metrics.rating_volatility_index.toFixed(1)}.`
    : "";
  const scoredTotal = scoreChartData.reduce((sum, bucket) => sum + bucket.count, 0);
  const trendEntriesData = safeArray<TrendYearPoint>(stats?.trend_analytics?.entries_per_year);
  const trendMeanData = safeArray(stats?.trend_analytics?.mean_score_per_year);
  const peakYear = trendEntriesData.slice().sort((a, b) => b.count - a.count)[0]?.year || "N/A";
  const avgHeatmapIntensity = activities.length > 0
    ? (activities.length / Math.max(1, new Set(activities.map(a => a.createdAt.split("T")[0])).size)).toFixed(1)
    : "0.0";
  const completionInsight = stats
    ? `${stats.hero_summary.completion_rate_percent >= 75 ? "Excellent completion discipline." : "Completion momentum is still maturing."} Drop rate is ${stats.hero_summary.drop_rate_percent}% with ${stats.vault_integrity.planning} items queued.`
    : "";
  const topGenres = safeArray(stats?.taste_intelligence?.top_genres);
  const radarData = topGenres.slice(0, 6).map((genre) => ({
    genre: genre.genre,
    value: genre.percent
  }));
  const xpCurrentLevelBase = Math.max(0, ((stats?.vault_progression.vault_level || 1) - 1) * 500);
  const xpLevelTarget = stats?.vault_progression.next_level_xp || 500;
  const xpProgress = Math.max(0, (stats?.vault_progression.xp_total || 0) - xpCurrentLevelBase);
  const xpNeeded = Math.max(1, xpLevelTarget - xpCurrentLevelBase);
  const xpProgressPercent = Math.min(100, (xpProgress / xpNeeded) * 100);
  const leveledUpRecently = xpProgressPercent <= 8 && (stats?.vault_progression.xp_total || 0) > 0;
  const displayTypeStrip = stats?.hero_summary?.display_type_breakdown
    ? [
        { label: "Anime" as const, value: stats.hero_summary.display_type_breakdown.anime },
        { label: "Donghua" as const, value: stats.hero_summary.display_type_breakdown.donghua },
        { label: "Manga" as const, value: stats.hero_summary.display_type_breakdown.manga },
        { label: "Manhwa" as const, value: stats.hero_summary.display_type_breakdown.manhwa },
        { label: "Manhua" as const, value: stats.hero_summary.display_type_breakdown.manhua },
      ].filter((item) => item.value > 0)
    : [];
  const displayTypeTotal = displayTypeStrip.reduce((sum, item) => sum + item.value, 0);

  return (
    <PageWrapper>
      <motion.div 
        className="relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: STATS_ANIMATION.REVEAL / 1000, ease: "easeOut" }}
      >
        <div className="absolute -top-40 left-0 w-[600px] h-[600px] bg-primary/10 blur-3xl rounded-full pointer-events-none animate-pulse" />
        
        <div className="relative z-10 p-6 space-y-12">
          
          <StatsHeroSummary
            displayName={user?.displayName}
            completionRatePercent={stats.hero_summary.completion_rate_percent}
            totalEntries={stats.hero_summary.total_entries}
            totalDaysInvested={stats.hero_summary.total_days_invested}
            overallMeanScore={stats.hero_summary.overall_mean_score}
            profileType={stats.behavioral_profile.profile_type}
            completionInsight={completionInsight}
            completionCircleStyle={completionCircleStyle}
            meanGlowStyle={meanGlowStyle}
            renderCount={(value, suffix) => <CountUp value={value} suffix={suffix || ""} />}
          />

          <StatsAnchorNav
            items={NAV_ITEMS}
            activeSection={activeSection}
            onNavigate={(id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
          />

          <StatsFilterBar
            filters={filters}
            displayTypeBreakdown={stats?.hero_summary.display_type_breakdown}
            displayTypeStrip={displayTypeStrip}
            displayTypeTotal={displayTypeTotal}
            filtersActive={filtersActive}
            activeFilterSummary={activeFilterSummary}
            filteredCount={filtered.length}
            totalCount={totalCount}
            onUpdateDisplayType={(value) => updateFilter("displayType", value)}
            onResetFilters={resetFilters}
          />

          <div className="stats-wrapper px-2 md:px-0 py-12">
            
            <StatsVaultIntegrityPanel
              stats={stats}
              filtered={filtered}
              vaultCardTint={vaultCardTint}
              onOpenDrill={openDrill}
            />

            <StatsScoreIntelligencePanel
              stats={stats}
              scoreChartData={scoreChartData}
              scoredTotal={scoredTotal}
              scoreInsightText={scoreInsightText}
              onOpenDrill={openDrill}
            />

            <StatsTimeAnalyticsPanel
              stats={stats}
              filtered={filtered}
              onOpenDrill={openDrill}
            />

            {/* 🔥 ACTIVITY HEATMAP */}
            <IntelligenceCard className="order-8 col-span-12" delay={0.2} title="Engagement Heatmap" subtitle="Action intensity over 365 days" icon={Flame}>
              <div className="heatmap-pulse p-4 md:p-6 rounded-2xl border border-white/5 bg-card/20 overflow-x-auto touch-scroll">
                <div className="min-w-[600px]">
                  <Heatmap data={activities.map(a => ({ date: a.createdAt.split('T')[0], count: 1 }))} />
                </div>
              </div>
              <motion.div
                className="mt-4 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2"
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.75, duration: 0.25 }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary/80 mb-1">AI Insight</p>
                <p className="text-xs italic text-primary/90">
                  Activity density averages {avgHeatmapIntensity} actions per active day, indicating {Number(avgHeatmapIntensity) > 2 ? "high" : "moderate"} engagement regularity.
                </p>
              </motion.div>
            </IntelligenceCard>

            <StatsAdvancedMetricsPanel stats={stats} />

            <StatsTrendAnalyticsPanel
              stats={stats}
              trendEntriesData={trendEntriesData}
              trendMeanData={trendMeanData}
              peakYear={peakYear}
            />

            <StatsTastePanel stats={stats} topGenres={topGenres} radarData={radarData} />

            <StatsBehavioralPanel stats={stats} />

            <StatsAdvancedScorePanel stats={stats} />

            <StatsProgressionPanel
              stats={stats}
              leveledUpRecently={leveledUpRecently}
              xpCurrentLevelBase={xpCurrentLevelBase}
              xpLevelTarget={xpLevelTarget}
              xpProgress={xpProgress}
              xpProgressPercent={xpProgressPercent}
            />

          </div>
        </div>
      </motion.div>

      {drill ? (
        <DrillDownModal
          title={drill.title}
          subtitle={drill.subtitle}
          items={drill.items}
          onClose={() => setDrill(null)}
        />
      ) : null}
    </PageWrapper>
  );
}
