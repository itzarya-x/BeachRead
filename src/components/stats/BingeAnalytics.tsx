import { BingeAnalytics as BingeAnalyticsType, BingeSession } from "@/lib/stats-engine";
import { format } from "date-fns";
import { Clock, Flame, TrendingUp, Zap } from "lucide-react";

interface BingeAnalyticsProps {
    data: BingeAnalyticsType;
    onSessionClick?: (session: BingeSession) => void;
}

export function BingeAnalytics({ data, onSessionClick }: BingeAnalyticsProps) {
    if (data.sessions.length === 0) {
        return (
            <div className="bg-card/50 border border-border/50 rounded-xl p-12 text-center">
                <Flame className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">No binge sessions detected</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                    A binge session is recorded when you watch 3 or more episodes of the same series within a 2-hour window.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Binge Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card/50 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2 text-primary">
                        <Flame className="w-5 h-5" />
                        <span className="text-sm font-medium uppercase tracking-wider">Binge Sessions</span>
                    </div>
                    <div className="text-3xl font-bold">{data.sessions.length}</div>
                    <div className="text-xs text-muted-foreground mt-1">Total high-intensity sessions</div>
                </div>

                <div className="bg-card/50 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2 text-amber-500">
                        <Clock className="w-5 h-5" />
                        <span className="text-sm font-medium uppercase tracking-wider">Avg Session</span>
                    </div>
                    <div className="text-3xl font-bold">{Math.round(data.averageSessionLength)}m</div>
                    <div className="text-xs text-muted-foreground mt-1">Mean duration per binge</div>
                </div>

                <div className="bg-card/50 border border-border/50 rounded-xl p-5 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2 text-emerald-500">
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-sm font-medium uppercase tracking-wider">Deep Focus</span>
                    </div>
                    <div className="text-3xl font-bold">{Math.round(data.totalBingeTime / 60)}h</div>
                    <div className="text-xs text-muted-foreground mt-1">Total time spent in binge mode</div>
                </div>
            </div>

            {/* Longest Session Feature Card */}
            {data.longestSession && (
                <div className="relative group overflow-hidden bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-xl p-6 transition-all hover:border-primary/40">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap className="w-24 h-24 text-primary" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <Flame className="w-4 h-4 fill-primary" />
                            <span className="text-xs font-bold uppercase tracking-widest">Master Binger</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-1">{data.longestSession.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            You watched <span className="text-foreground font-semibold">{data.longestSession.episodes} episodes</span> in one go!
                        </p>
                        
                        <div className="flex gap-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Duration</span>
                                <span className="text-lg font-semibold">{Math.round(data.longestSession.durationMinutes)} mins</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Velocity</span>
                                <span className="text-lg font-semibold">{(data.longestSession.episodes / (data.longestSession.durationMinutes / 60)).toFixed(1)} eps/h</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Date</span>
                                <span className="text-lg font-semibold">{format(new Date(data.longestSession.startTime), "MMM d, yyyy")}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Sessions List */}
            <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground pl-1">Recent Binge History</h4>
                <div className="grid gap-3">
                    {data.sessions.slice(0, 5).map((session, i) => (
                        <div 
                            key={i}
                            onClick={() => onSessionClick?.(session)}
                            className="flex items-center justify-between bg-card/30 border border-border/40 rounded-lg p-4 hover:bg-card/50 hover:border-border transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-semibold text-foreground">{session.title}</div>
                                    <div className="text-xs text-muted-foreground">
                                        {format(new Date(session.startTime), "PPp")}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="text-right">
                                <div className="text-sm font-bold text-primary">{session.episodes} EPISODES</div>
                                <div className="text-[10px] text-muted-foreground uppercase">{Math.round(session.durationMinutes)} mins</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
