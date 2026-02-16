import { DrillDownModal } from "@/components/stats/DrillDownModal";
import { Heatmap } from "@/components/stats/Heatmap";
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { YuraRow } from "@/components/yura";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useData } from "@/context/DataContext";
import type { DisplayMedia } from "@/types/display";
import { safeArray } from "@/utils/safeArray";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart
} from "recharts";
import { 
  BarChart3, 
  ChevronDown, 
  Download, 
  RotateCcw, 
  Trophy, 
  Zap, 
  Clock, 
  Star, 
  Compass,
  LayoutGrid,
  History,
  Target,
  AlertCircle,
  Flame,
  Globe,
  Dna,
  TrendingUp,
  BrainCircuit,
  Info,
  FastForward,
  Activity,
  UserCheck
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useStats } from "@/hooks/useStats";
import { useStatsFilters } from "@/context/StatsFilterContext";
import { calculateIntelligence, calculateBehavioralStats } from "@/lib/stats-engine";

type DrillState = {
  title: string;
  subtitle?: string;
  items: DisplayMedia[];
} | null;

// ============= SUB-COMPONENTS =============

function IntelligenceCard({
  title,
  subtitle,
  icon: Icon,
  className,
  children,
  action
}: {
  title: string;
  subtitle?: string;
  icon?: any;
  className?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("stats-section group", className)}>
      <div className="section-header">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:border-primary/40 transition-colors">
              <Icon className="h-4.5 w-4.5 text-primary" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-black tracking-tight text-foreground">{title}</h2>
            {subtitle && <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </div>
  );
}

function InsightBadge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/5 border border-primary/10 text-[10px] font-bold text-primary uppercase tracking-tight", className)}>
      <Zap className="h-2.5 w-2.5" />
      {children}
    </div>
  );
}

function KpiTile({
  label,
  value,
  hint,
  onClick,
  className,
  icon: Icon,
  trend
}: {
  label: string;
  value: string | number;
  hint?: string;
  onClick: () => void;
  className?: string;
  icon?: any;
  trend?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex h-full flex-col justify-center overflow-hidden rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md p-5 text-left transition-all hover:shadow-lg hover:border-primary/40 active:scale-[0.97]",
        className
      )}
    >
      <div className="absolute -right-2 -top-2 h-16 w-16 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-3 w-3 text-primary/60 group-hover:text-primary transition-colors" />}
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground group-hover:text-primary transition-colors">{label}</p>
        </div>
        {trend && <span className="text-[9px] font-black text-primary/80">{trend}</span>}
      </div>
      <p className="text-2xl font-black tracking-tighter text-foreground tabular-nums">
        {value}
      </p>
      {hint ? <p className="mt-1 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tight line-clamp-1">{hint}</p> : null}
    </button>
  );
}

export default function Stats() {
  const { user, activities } = useData();
  const { filters, updateFilter, resetFilters } = useStatsFilters();
  const { stats, filtered, hasEntries, filtersActive } = useStats();
  const [drill, setDrill] = useState<DrillState>(null);

  // INTELLIGENCE & BEHAVIORAL CALCULATIONS
  const intelligence = useMemo(() => calculateIntelligence(filtered, activities), [filtered, activities]);
  const behavioral = useMemo(() => calculateBehavioralStats(activities, filtered), [activities, filtered]);

  const openDrill = (title: string, items: DisplayMedia[], subtitle?: string) => {
    setDrill({ title, subtitle, items });
  };

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
          <Button onClick={() => window.location.href = '/anime'} className="h-12 rounded-2xl px-8 shadow-glow">
            Initialize Archive
          </Button>
        </div>
      </PageWrapper>
    );
  }

  // Formatting distribution for charts
  const scoreChartData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.score_intelligence.score_distribution).map(([range, count]) => ({
      range,
      count,
      items: filtered.filter(item => {
        const [min, max] = range.split('-').map(Number);
        return item.score >= min && item.score <= max;
      })
    }));
  }, [stats, filtered]);

  const topArchetype = stats?.behavioral_profile.profile_type || "strategist";

  return (
    <PageWrapper>
      <div className="relative">
        <div className="absolute -top-40 left-0 w-[600px] h-[600px] bg-primary/10 blur-3xl rounded-full pointer-events-none animate-pulse" />
        
        <div className="relative z-10 p-6 space-y-10">
          
          {/* 🌸 HERO SUMMARY SECTION */}
          {stats && (
            <div className="relative overflow-hidden rounded-[2.5rem] border border-primary/20 bg-gradient-to-br from-primary/20 via-card/80 to-card/40 p-8 md:p-12 shadow-2xl">
              <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/4 -translate-y-1/4 rounded-full bg-primary/10 blur-3xl" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                <div className="h-32 w-32 md:h-40 md:w-40 rounded-full border-4 border-primary/30 bg-card p-1 shadow-glow animate-glow-pulse">
                  <img 
                    src={user?.avatarUrl || "https://avatar.vercel.sh/yura"} 
                    className="h-full w-full rounded-full object-cover"
                    alt="Avatar"
                  />
                </div>
                
                <div className="text-center md:text-left space-y-4">
                  <div className="space-y-1">
                    <Badge className="bg-primary/20 text-primary border-primary/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.25em]">
                      The {stats.behavioral_profile.profile_type}
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground drop-shadow-sm">
                      {user?.displayName || "Archive Explorer"}
                    </h1>
                  </div>
                  
                  <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-2">
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Archives</p>
                      <p className="text-2xl font-black text-foreground">{stats.hero_summary.total_entries}</p>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Investment</p>
                      <p className="text-2xl font-black text-foreground">{Math.round(stats.hero_summary.total_days_invested)}d</p>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Mean</p>
                      <p className="text-2xl font-black text-primary">{stats.hero_summary.overall_mean_score}</p>
                    </div>
                    <div className="h-10 w-px bg-white/10" />
                    <div className="text-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Completion</p>
                      <p className="text-2xl font-black text-foreground">{stats.hero_summary.completion_rate_percent}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🎛 FILTER BAR */}
          <div className="flex flex-wrap items-center gap-3 sakura-glass p-4 rounded-3xl border border-white/5">
            <Select value={filters.mediaType} onValueChange={(val) => updateFilter('mediaType', val as any)}>
              <SelectTrigger className="h-10 w-32 bg-white/5 border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest"><SelectValue /></SelectTrigger>
              <SelectContent className="sakura-select-content">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="anime">Anime</SelectItem>
                <SelectItem value="manga">Manga</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-10 rounded-xl opacity-50 hover:opacity-100 ml-auto">
              <RotateCcw className="h-3.5 w-3.5 mr-2" />
              Reset
            </Button>
          </div>

          <div className="stats-wrapper px-2 md:px-0">
            
            {/* 📊 VAULT INTEGRITY SECTION */}
            {stats && (
              <IntelligenceCard title="Vault Integrity" subtitle="Measurement of archive volume" icon={LayoutGrid}>
                <div className="section-bento">
                  <KpiTile 
                    label="Archive scale" 
                    value={stats.vault_integrity.archive_scale} 
                    hint={`${stats.hero_summary.total_anime} Anime • ${stats.hero_summary.total_manga} Manga`}
                    onClick={() => openDrill("Total Archive", filtered)}
                    className="col-span-12 md:card-md"
                    icon={TrendingUp}
                  />
                  <KpiTile 
                    label="Completed" 
                    value={stats.vault_integrity.completed} 
                    hint={`${stats.hero_summary.completion_rate_percent}% completion rate`}
                    onClick={() => openDrill("Completed Items", filtered.filter(i => i.status === "COMPLETED"))}
                    className="col-span-6 md:card-sm"
                    icon={Trophy}
                  />
                  <KpiTile 
                    label="Rewatched" 
                    value={stats.vault_integrity.rewatched_count} 
                    hint="Returning to favorites"
                    onClick={() => openDrill("Rewatched Items", filtered.filter(i => i.repeat > 0))}
                    className="col-span-6 md:card-sm"
                    icon={RotateCcw}
                  />
                  <KpiTile 
                    label="Dropped" 
                    value={stats.vault_integrity.dropped} 
                    hint={`${stats.hero_summary.drop_rate_percent}% drop rate`}
                    onClick={() => openDrill("Dropped Items", filtered.filter(i => i.status === "DROPPED"))}
                    className="col-span-6 md:card-sm"
                    icon={AlertCircle}
                  />
                  <KpiTile 
                    label="Backlog" 
                    value={stats.vault_integrity.planning} 
                    hint="The future journey"
                    onClick={() => openDrill("Planned Items", filtered.filter(i => i.status === "PLANNING"))}
                    className="col-span-6 md:card-sm"
                    icon={History}
                  />
                </div>
              </IntelligenceCard>
            )}

            {/* ⭐ SCORE INTELLIGENCE (BENTO CARD) */}
            {stats && (
              <IntelligenceCard title="Score Intelligence" subtitle="Rating patterns and standards" icon={Star}>
                <div className="section-bento">
                  <div className="col-span-12 md:card-wide rounded-2xl border border-border/40 bg-card/20 p-4 md:p-6">
                    <div className="flex items-center justify-between mb-6">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Rating Distribution</p>
                      <InsightBadge>
                        {stats.score_intelligence.rating_consistency_level} Consistency
                      </InsightBadge>
                    </div>
                    <div className="h-[200px] w-full overflow-x-auto touch-scroll">
                      <div className="min-w-[400px] h-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={scoreChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.5} />
                            <XAxis dataKey="range" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                            <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                            <ChartTooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]} onClick={(entry: any) => openDrill(`Score ${entry.range}`, entry.items)}>
                              {scoreChartData.map((_, index) => (
                                <Cell key={index} fill={`hsl(var(--primary) / ${0.3 + (index % 8) * 0.1})`} className="hover:opacity-80 transition-opacity" />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-12 md:card-md flex flex-col justify-center gap-4">
                    <KpiTile 
                      label="Harshness Index" 
                      value={`${stats.score_intelligence.harsh_vs_generous_index}`}
                      hint={stats.score_intelligence.harsh_vs_generous_index > 0 ? "You find enjoyment easily." : "You hold a high bar."}
                      onClick={() => {}}
                      className="min-h-[120px]"
                    />
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-center">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Volatility</p>
                      <p className="text-xl font-black text-foreground">{stats.advanced_metrics.rating_volatility_index}</p>
                      <p className="text-[9px] text-muted-foreground uppercase mt-1">Rating spread logic</p>
                    </div>
                  </div>
                </div>
              </IntelligenceCard>
            )}

            {/* ⏳ TIME ANALYTICS SECTION */}
            {stats && (
              <IntelligenceCard title="Time Analytics" subtitle="Journey length and velocity" icon={Clock}>
                <div className="section-bento">
                  <KpiTile 
                    label="Episodes Watched" 
                    value={stats.time_analytics.episodes_watched} 
                    onClick={() => openDrill("Episodes", filtered.filter(i => i.mediaType === 'ANIME'))}
                    className="col-span-6 md:card-sm"
                    icon={Activity}
                  />
                  <KpiTile 
                    label="Chapters Read" 
                    value={stats.time_analytics.chapters_read} 
                    onClick={() => openDrill("Chapters", filtered.filter(i => i.mediaType === 'MANGA'))}
                    className="col-span-6 md:card-sm"
                    icon={Compass}
                  />
                  <KpiTile 
                    label="Drop Velocity" 
                    value={`${stats.time_analytics.average_episodes_before_drop.toFixed(1)} eps`} 
                    hint="Average length before dropping"
                    onClick={() => openDrill("Dropped Items", filtered.filter(i => i.status === "DROPPED"))}
                    className="col-span-12 md:card-md"
                    icon={AlertCircle}
                  />
                  <KpiTile 
                    label="Commitment" 
                    value={`${stats.advanced_metrics.watching_vs_planning_ratio.toFixed(2)}`} 
                    hint="Watching vs Planning"
                    onClick={() => {}}
                    className="col-span-12 md:card-sm"
                    icon={Activity}
                  />
                </div>
              </IntelligenceCard>
            )}

            {/* 🔥 ACTIVITY HEATMAP */}
            <IntelligenceCard title="Engagement Heatmap" subtitle="Action intensity over 365 days" icon={Flame}>
              <div className="p-4 md:p-6 rounded-2xl border border-white/5 bg-card/20 overflow-x-auto touch-scroll">
                <div className="min-w-[600px]">
                  <Heatmap data={activities.map(a => ({ date: a.createdAt.split('T')[0], count: 1 }))} />
                </div>
              </div>
            </IntelligenceCard>

            {/* 🏆 ADVANCED METRICS PANEL */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
                  <ChevronDown className="h-4 w-4" />
                  Show Advanced Metrics
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-6">
                {stats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl border border-white/5 bg-card/40 backdrop-blur-md">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Score Bias</p>
                      <p className="text-2xl font-black">{stats.advanced_metrics.score_bias_vs_platform_estimate}</p>
                      <p className="text-[9px] text-muted-foreground uppercase mt-1">Vs platform estimated mean</p>
                    </div>
                    <div className="p-5 rounded-2xl border border-white/5 bg-card/40 backdrop-blur-md">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Completed Avg</p>
                      <p className="text-2xl font-black">{stats.advanced_metrics.average_score_of_completed.toFixed(1)}</p>
                      <p className="text-[9px] text-muted-foreground uppercase mt-1">Mean score of completed</p>
                    </div>
                    <div className="p-5 rounded-2xl border border-white/5 bg-card/40 backdrop-blur-md">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Dropped Avg</p>
                      <p className="text-2xl font-black">{stats.advanced_metrics.average_score_of_dropped.toFixed(1)}</p>
                      <p className="text-[9px] text-muted-foreground uppercase mt-1">Mean score of dropped</p>
                    </div>
                    <div className="p-5 rounded-2xl border border-white/5 bg-card/40 backdrop-blur-md">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Volatility Index</p>
                      <p className="text-2xl font-black">{stats.advanced_metrics.rating_volatility_index}</p>
                      <p className="text-[9px] text-muted-foreground uppercase mt-1">Rating spread deviation</p>
                    </div>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

          </div>
        </div>
      </div>

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
