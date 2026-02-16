import { PageContent, PageWrapper } from "@/components/layout/PageWrapper";
import { useData } from "@/context/DataContext";
import { cn, safeDate, safeFormatDistance, safeFormat } from "@/lib/utils";
import type { ActivityLog } from "@/lib/storage/types";
import type { DisplayMedia } from "@/types/display";
import { safeArray } from "@/utils/safeArray";
import { format, isToday, isThisWeek } from "date-fns";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  History, 
  Layers, 
  PlusCircle, 
  RefreshCw, 
  Star, 
  TrendingUp, 
  Trophy,
  Zap,
  XCircle,
  PlayCircle
} from "lucide-react";
import { useMemo, useState } from "react";

const FILTER_OPTIONS: { label: string; type: string | "ALL" }[] = [
  { label: "All", type: "ALL" },
  { label: "Additions", type: "add" },
  { label: "Progress", type: "progress" },
  { label: "Ratings", type: "score_change" },
  { label: "Status", type: "status_change" },
  { label: "Tiers", type: "tier_change" },
  { label: "Sync", type: "sync" },
];

const Activity = () => {
  const { user, loading, animeList, mangaList, getTitle, activities } = useData();
  const [activeFilter, setActiveFilter] = useState<string | "ALL">("ALL");

  const enrichedActivities = useMemo(() => {
    const allMedia = [...safeArray<DisplayMedia>(animeList), ...safeArray<DisplayMedia>(mangaList)];
    const mediaMapBySeriesId = new Map(allMedia.map(m => [m._seriesId, m]));
    const mediaMapByEntryId = new Map(allMedia.map(m => [String(m._entryId), m]));

    return activities.map(activity => {
        let media = activity.mediaId ? mediaMapByEntryId.get(String(activity.mediaId)) : null;
        if (!media && activity.seriesId) {
            media = mediaMapBySeriesId.get(activity.seriesId);
        }

        return {
            ...activity,
            media,
            title: media ? getTitle(media) : activity.details?.title || "Unknown Title",
            coverImage: media?.coverImage || undefined,
        };
    });
  }, [activities, animeList, mangaList, getTitle]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === "ALL") return enrichedActivities;
    // Handle both old and new rating change names
    if (activeFilter === "score_change") {
        return enrichedActivities.filter(e => e.actionType === "score_change" || e.actionType === "rating_change");
    }
    return enrichedActivities.filter(e => e.actionType === activeFilter);
  }, [enrichedActivities, activeFilter]);

  // Group by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, typeof filteredEvents> = {};
    filteredEvents.forEach(event => {
        const d = safeDate(event.createdAt);
        if (!d) return;
        const dateKey = safeFormat(d, "yyyy-MM-dd");
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(event);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredEvents]);

  // Insights for right panel
  const insights = useMemo(() => {
    const today = activities.filter(e => {
        const d = safeDate(e.createdAt);
        return d ? isToday(d) : false;
    });
    const week = activities.filter(e => {
        const d = safeDate(e.createdAt);
        return d ? isThisWeek(d) : false;
    });
    
    const counts: Record<string, { title: string; count: number }> = {};
    activities.forEach(e => {
        const id = String(e.seriesId || e.mediaId);
        if (id === "undefined") return;
        const title = e.details?.title || "Unknown";
        if (!counts[id]) counts[id] = { title, count: 0 };
        counts[id].count++;
    });
    const mostEdited = Object.values(counts).sort((a, b) => b.count - a.count)[0];

    return {
      todayCount: today.length,
      todayRatings: today.filter(e => e.actionType === "score_change" || e.actionType === "rating_change").length,
      todayUpdates: today.filter(e => e.actionType === "progress" || e.actionType === "status_change").length,
      todayTiers: today.filter(e => e.actionType === "tier_change" || e.actionType === "tier_move").length,
      weekCount: week.length,
      mostEditedTitle: mostEdited?.title || "N/A"
    };
  }, [activities]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageWrapper>
      <PageContent className="space-y-8 animate-fade-in">
        <div className="page-container">
          <section className="space-y-2">
            <div className="flex items-center gap-3">
               <History className="h-8 w-8 text-primary" />
               <h1 className="text-4xl font-bold tracking-tight text-white uppercase font-display">
                 Activity
               </h1>
            </div>
            <p className="text-white/40 font-medium uppercase tracking-[0.2em] text-xs">
              Live history of your vault events.
            </p>
          </section>
        </div>

        <div className="page-container">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 xl:col-span-8 space-y-8">
              <div className="flex flex-wrap gap-3 bg-card/60 backdrop-blur-md border border-white/5 rounded-2xl p-4 shadow-depth1">
                {FILTER_OPTIONS.map(opt => (
                  <button
                    key={opt.type}
                    onClick={() => setActiveFilter(opt.type)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      activeFilter === opt.type
                        ? "bg-primary text-white shadow-glow"
                        : "text-white/40 hover:text-white/70 hover:bg-white/5"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-primary/10 to-transparent" />

                <div className="space-y-12 pl-10 md:pl-12">
                  {activities.length === 0 ? (
                    <div className="sakura-glass p-10 text-center space-y-3">
                      <Zap className="h-10 w-10 text-white/10 mx-auto" />
                      <p className="text-white/30 uppercase tracking-widest text-xs font-bold">No activity history detected.</p>
                    </div>
                  ) : filteredEvents.length === 0 ? (
                    <div className="p-10 text-center">
                        <p className="text-white/20 uppercase tracking-widest text-xs font-bold">No events match filter.</p>
                    </div>
                  ) : (
                    groupedEvents.map(([date, events]) => (
                      <div key={date} className="space-y-8">
                        <div className="relative -ml-10 md:-ml-12">
                          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md">
                            <History className="h-3 w-3 text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                {safeFormat(date, "MMMM do, yyyy")}
                            </span>
                          </div>
                        </div>
                        {events.map((event) => (
                          <ActivityItem key={String(event.id)} event={event} />
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-12 xl:col-span-4 space-y-6">
              <div className="sakura-glass p-6 space-y-6 shadow-depth2 sticky top-24">
                 <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Insights</h3>
                 </div>

                 <div className="space-y-4">
                    <InsightCard 
                        label="Today" 
                        items={[
                            { label: "updates", value: insights.todayUpdates, icon: RefreshCw },
                            { label: "ratings", value: insights.todayRatings, icon: Star },
                            { label: "tiers", value: insights.todayTiers, icon: Layers }
                        ]}
                    />

                    <InsightCard 
                        label="This Week" 
                        mainValue={insights.weekCount}
                        mainLabel="Total Actions"
                        icon={Zap}
                    />

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-white/40">
                            <Trophy className="h-3 w-3" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Hot Topic</span>
                        </div>
                        <p className="text-sm font-bold text-white truncate">{insights.mostEditedTitle}</p>
                    </div>
                 </div>

                 <div className="sakura-glass p-6 flex items-center justify-between border-primary/20 bg-primary/5 rounded-2xl">
                    <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="h-2 w-2 rounded-full bg-primary animate-ping absolute inset-0" />
                        <div className="h-2 w-2 rounded-full bg-primary relative" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Real-time Pulse</span>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-primary/50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContent>
    </PageWrapper>
  );
};

const ActivityItem = ({ event }: { event: any }) => {
  const getEventDescription = () => {
    const details = event.details || {};
    switch (event.actionType) {
      case "add": return "Identified and added";
      case "status_change": return `Transitioned to ${details.to}`;
      case "complete": return "Protocol completed";
      case "score_change": 
      case "rating_change":
        return `Calibration set to ${details.to}%`;
      case "progress": 
        return `Frequency updated to ${details.to}`;
      case "tier_change":
      case "tier_move": 
        return `Classification moved to ${details.to || 'Pool'}`;
      case "drop": return "Subject decommissioned";
      case "delete": return "Entry purged from vault";
      default: return "Archive modification";
    }
  };

  const getEventIcon = () => {
    switch (event.actionType) {
        case "add": return PlusCircle;
        case "score_change":
        case "rating_change":
            return Star;
        case "tier_change":
        case "tier_move":
            return Layers;
        case "delete": return XCircle;
        case "progress": return PlayCircle;
        case "complete": return CheckCircle2;
        default: return CheckCircle2;
    }
  };

  const Icon = getEventIcon();

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="relative group"
    >
      <div className="absolute -left-[37px] top-6 h-3 w-3 rounded-full bg-primary shadow-glow group-hover:scale-125 transition-transform" />

      <div className="relative rounded-2xl border border-white/5 bg-gradient-to-br from-white/10 to-white/[0.02] backdrop-blur-md p-5 transition-all hover:border-primary/40 hover:shadow-[0_0_30px_hsl(var(--primary)/0.15)]">
        <div className="flex items-start gap-4">
          {event.coverImage ? (
            <img 
                src={event.coverImage} 
                alt={event.title} 
                className="w-14 h-20 rounded-lg object-cover shadow-depth1 ring-1 ring-white/10" 
            />
          ) : (
            <div className="w-14 h-20 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <Icon className="h-6 w-6 text-white/10" />
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] text-white/30 font-bold uppercase tracking-tighter">
                    {safeFormatDistance(event.createdAt, { addSuffix: true })}
                </span>
                <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">
                    {safeFormat(event.createdAt, "HH:mm")}
                </span>
            </div>

            <h3 className="font-bold text-white text-base truncate">
              {getEventDescription()} <span className="text-primary tracking-tight font-black ml-1 uppercase text-sm">“{event.title}”</span>
            </h3>

            <div className="flex flex-wrap gap-3 pt-1">
              {event.media?.status && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                    <div className="h-1 w-1 rounded-full bg-white/40" />
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-tighter">{event.media.status}</span>
                </div>
              )}
              {(event.media?.score > 0 || (event.actionType === 'score_change' && event.details?.to)) && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                    <Star className="h-2 w-2 text-primary" />
                    <span className="text-[9px] font-black text-primary uppercase tracking-tighter">
                        {event.details?.to || event.media?.score}%
                    </span>
                </div>
              )}
              {event.mediaType && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-tighter">{event.mediaType}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const InsightCard = ({ label, items, mainValue, mainLabel, icon: Icon }: any) => {
    return (
        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{label}</span>
                {Icon && <Icon className="h-3 w-3 text-primary/40" />}
            </div>

            {items ? (
                <div className="grid grid-cols-3 gap-2">
                    {items.map((item: any) => (
                        <div key={item.label} className="text-center">
                            <p className="text-xl font-black text-white">{item.value}</p>
                            <p className="text-[8px] font-bold uppercase tracking-tighter text-white/30 leading-tight">{item.label}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-white tracking-tighter">{mainValue}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">{mainLabel}</p>
                </div>
            )}
        </div>
    );
};

export default Activity;
