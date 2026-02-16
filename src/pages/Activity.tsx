import { PageContent, PageWrapper } from "@/components/layout/PageWrapper";
import { useData } from "@/context/DataContext";
import { editHistory } from "@/lib/editHistory";
import { cn } from "@/lib/utils";
import { ActivityEvent, ActivityEventType } from "@/types/activity";
import type { DisplayMedia } from "@/types/display";
import { safeArray } from "@/utils/safeArray";
import { format, formatDistanceToNow, isToday, isThisWeek } from "date-fns";
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
  Zap
} from "lucide-react";
import { useMemo, useState } from "react";

const FILTER_OPTIONS: { label: string; type: ActivityEventType | "ALL" }[] = [
  { label: "All", type: "ALL" },
  { label: "Media Updates", type: "UPDATE_PROGRESS" },
  { label: "Ratings", type: "UPDATE_SCORE" },
  { label: "Tier Changes", type: "TIER_MOVE" },
  { label: "Status", type: "UPDATE_STATUS" },
  { label: "Imports", type: "IMPORT" },
  { label: "Sync", type: "SYNC" },
];

const Activity = () => {
  const { user, loading, animeList, mangaList, getTitle } = useData();
  const [activeFilter, setActiveFilter] = useState<ActivityEventType | "ALL">("ALL");

  const timelineEvents = useMemo(() => {
    const events: ActivityEvent[] = [];
    const allMedia = [...safeArray<DisplayMedia>(animeList), ...safeArray<DisplayMedia>(mangaList)];
    const mediaMap = new Map(allMedia.map(m => [String(m._seriesId), m]));

    // 1. Process explicit edit history
    const history = editHistory.getRecentHistory(200);
    history.forEach(h => {
      const media = mediaMap.get(String(h.entryId));
      let type: ActivityEventType = "UPDATE_PROGRESS";
      
      if (h.action === "create") type = "ADD_ENTRY";
      else if (h.action === "delete") type = "DELETE_ENTRY";
      else if (h.field === "status") type = "UPDATE_STATUS";
      else if (h.field === "score") type = "UPDATE_SCORE";
      else if (h.field === "tierId") type = "TIER_MOVE";
      else if (h.field === "progress" || h.field === "progressVolumes") type = "UPDATE_PROGRESS";

      events.push({
        id: h.id,
        userId: h.userId,
        type,
        timestamp: h.timestamp,
        seriesId: h.entryId,
        media,
        title: media ? getTitle(media) : "Unknown Title",
        coverImage: media?.coverImage || undefined,
        previousValue: h.oldValue,
        newValue: h.newValue,
        field: h.field,
      });
    });

    // 2. Fallback: generate events from updatedAt for items not in history (if any)
    // To avoid duplicates, we only add if timestamp is significant and not already present
    // For now, we trust editHistory if it's working, but let's add the basic updates too
    // if history is empty (e.g. fresh session)
    if (events.length < 5) {
        allMedia.forEach(m => {
            const ts = new Date(m.updatedAt).getTime();
            // Check if we already have an event for this media around this time
            const exists = events.some(e => e.seriesId === m._seriesId && Math.abs(e.timestamp - ts) < 60000);
            if (!exists) {
                events.push({
                    id: `media-${m._seriesId}-${ts}`,
                    userId: user?.id || 0,
                    type: "UPDATE_STATUS", // Generic fallback
                    timestamp: ts,
                    seriesId: m._seriesId,
                    media: m,
                    title: getTitle(m),
                    coverImage: m.coverImage || undefined,
                    newValue: m.status
                });
            }
        });
    }

    return events.sort((a, b) => b.timestamp - a.timestamp);
  }, [animeList, mangaList, getTitle, user]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === "ALL") return timelineEvents;
    return timelineEvents.filter(e => e.type === activeFilter);
  }, [timelineEvents, activeFilter]);

  // Stats for right panel
  const insights = useMemo(() => {
    const today = timelineEvents.filter(e => isToday(e.timestamp));
    const week = timelineEvents.filter(e => isThisWeek(e.timestamp));
    
    // Most edited title
    const counts: Record<string, { title: string; count: number }> = {};
    timelineEvents.forEach(e => {
        const id = String(e.seriesId);
        if (!counts[id]) counts[id] = { title: e.title || "Unknown", count: 0 };
        counts[id].count++;
    });
    const mostEdited = Object.values(counts).sort((a, b) => b.count - a.count)[0];

    return {
      todayCount: today.length,
      todayRatings: today.filter(e => e.type === "UPDATE_SCORE").length,
      todayUpdates: today.filter(e => e.type === "UPDATE_PROGRESS" || e.type === "UPDATE_STATUS").length,
      todayTiers: today.filter(e => e.type === "TIER_MOVE").length,
      weekCount: week.length,
      mostEditedTitle: mostEdited?.title || "N/A"
    };
  }, [timelineEvents]);

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
        {/* Header */}
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
            {/* Main Feed */}
            <div className="col-span-12 xl:col-span-8 space-y-8">
              {/* Filter Bar */}
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

              {/* Timeline Feed */}
              <div className="relative">
                {/* Timeline vertical line */}
                <div className="absolute left-4 md:left-4 top-0 bottom-0 w-px bg-gradient-to-b from-primary/40 via-primary/10 to-transparent" />

                <div className="space-y-12 pl-10 md:pl-12">
                  {filteredEvents.length === 0 ? (
                    <div className="sakura-glass p-10 text-center space-y-3">
                      <Zap className="h-10 w-10 text-white/10 mx-auto" />
                      <p className="text-white/30 uppercase tracking-widest text-xs font-bold">No activity detected in current frequency.</p>
                    </div>
                  ) : (
                    (() => {
                      let lastDate = "";
                      return filteredEvents.map((event, idx) => {
                        const currentDate = format(event.timestamp, "MMMM do, yyyy");
                        const showDate = currentDate !== lastDate;
                        lastDate = currentDate;

                        return (
                          <div key={event.id} className="space-y-6">
                            {showDate && (
                              <div className="relative -ml-10 md:-ml-12 mb-8">
                                <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md">
                                  <History className="h-3 w-3 text-primary" />
                                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{currentDate}</span>
                                </div>
                              </div>
                            )}
                            <ActivityItem event={event} />
                          </div>
                        );
                      });
                    })()
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="col-span-12 xl:col-span-4 space-y-6">
              <div className="sakura-glass p-6 space-y-6 shadow-depth2">
                 <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Activity Insights</h3>
                 </div>

                 <div className="space-y-4">
                    <InsightCard 
                        label="Today" 
                        items={[
                            { label: "updates", value: insights.todayUpdates, icon: RefreshCw },
                            { label: "ratings", value: insights.todayRatings, icon: Star },
                            { label: "tier changes", value: insights.todayTiers, icon: Layers }
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
                            <span className="text-[9px] font-black uppercase tracking-widest">Most Edited</span>
                        </div>
                        <p className="text-sm font-bold text-white truncate">{insights.mostEditedTitle}</p>
                    </div>
                 </div>
              </div>

              {/* Realtime Pulse Indicator */}
              <div className="sakura-glass p-6 flex items-center justify-between border-primary/20 bg-primary/5">
                <div className="flex items-center gap-3">
                   <div className="relative">
                      <div className="h-2 w-2 rounded-full bg-primary animate-ping absolute inset-0" />
                      <div className="h-2 w-2 rounded-full bg-primary relative" />
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Frequency Sync Active</span>
                </div>
                <CheckCircle2 className="h-4 w-4 text-primary/50" />
              </div>
            </div>
          </div>
        </div>
      </PageContent>
    </PageWrapper>
  );
};

const ActivityItem = ({ event }: { event: ActivityEvent }) => {
  const getEventDescription = () => {
    switch (event.type) {
      case "ADD_ENTRY": return "Added to vault";
      case "UPDATE_STATUS": return `Changed status to ${event.newValue}`;
      case "UPDATE_SCORE": return `Rated ${event.newValue}/100`;
      case "UPDATE_PROGRESS": return `Updated progress to ${event.newValue}`;
      case "TIER_MOVE": return `Moved to ${event.newValue} Tier`;
      case "IMPORT": return "Imported from external source";
      case "SYNC": return "Synchronized with cloud";
      default: return "Updated entry";
    }
  };

  const getEventIcon = () => {
    switch (event.type) {
        case "ADD_ENTRY": return PlusCircle;
        case "UPDATE_SCORE": return Star;
        case "TIER_MOVE": return Layers;
        case "SYNC": return RefreshCw;
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
      {/* Timeline Dot */}
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
            <div className="w-14 h-20 rounded-lg bg-white/5 flex items-center justify-center">
                <Icon className="h-6 w-6 text-white/10" />
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-4">
                <span className="text-[10px] text-white/30 font-bold uppercase tracking-tighter">
                    {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                </span>
                <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">
                    {format(event.timestamp, "HH:mm")}
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
              {event.media?.score > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                    <Star className="h-2 w-2 text-primary" />
                    <span className="text-[9px] font-black text-primary uppercase tracking-tighter">{event.media.score}%</span>
                </div>
              )}
              {event.media?.format && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                    <span className="text-[9px] font-bold text-white/30 uppercase tracking-tighter">{event.media.format}</span>
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
