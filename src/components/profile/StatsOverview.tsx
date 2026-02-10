import { useData } from "@/context/DataContext";
import { formatMinutes } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { BarChart3, BookOpen, Clock, Hash, TrendingUp, Tv } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function StatsOverview() {
    const { user, animeList, mangaList } = useData();
    const navigate = useNavigate();
    if (!user) return null;

    const { anime, manga } = user.statistics;
    const totalAnime = animeList.length;
    const totalManga = mangaList.length;

    const stats = [
        {
            label: "Total Anime",
            value: anime.count || totalAnime,
            icon: Tv,
            color: "text-status-completed",
            gradient: "from-status-completed/20 to-status-completed/5",
            action: () => navigate("/anime"),
        },
        {
            label: "Episodes Watched",
            value: (anime.progress || 0).toLocaleString(),
            icon: Hash,
            color: "text-primary",
            gradient: "from-primary/20 to-primary/5",
            action: () => navigate("/anime"),
        },
        {
            label: "Time Watched",
            value: formatMinutes(anime.minutesWatched || 0),
            icon: Clock,
            color: "text-status-current",
            gradient: "from-status-current/20 to-status-current/5",
            action: () => navigate("/stats"),
        },
        {
            label: "Mean Score (Anime)",
            value: (anime.meanScore || 0).toFixed(1),
            icon: BarChart3,
            color: "text-score-mid",
            gradient: "from-score-mid/20 to-score-mid/5",
            action: () => navigate("/stats"),
        },
        {
            label: "Total Manga",
            value: manga.count || totalManga,
            icon: BookOpen,
            color: "text-status-planning",
            gradient: "from-status-planning/20 to-status-planning/5",
            action: () => navigate("/manga"),
        },
        {
            label: "Chapters Read",
            value: (manga.progress || 0).toLocaleString(),
            icon: Hash,
            color: "text-primary",
            gradient: "from-primary/20 to-primary/5",
            action: () => navigate("/manga"),
        },
        {
            label: "Volumes Read",
            value: (manga.progressVolumes || 0).toLocaleString(),
            icon: TrendingUp,
            color: "text-status-current",
            gradient: "from-status-current/20 to-status-current/5",
            action: () => navigate("/stats"),
        },
        {
            label: "Mean Score (Manga)",
            value: (manga.meanScore || 0).toFixed(1),
            icon: BarChart3,
            color: "text-score-mid",
            gradient: "from-score-mid/20 to-score-mid/5",
            action: () => navigate("/stats"),
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(stat => (
                <button
                    key={stat.label}
                    onClick={stat.action}
                    className={cn(
                        "stat-card group relative overflow-hidden rounded-xl p-4 border border-border/50 transition-all duration-300",
                        "hover:scale-105 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 cursor-pointer",
                        "bg-gradient-to-br",
                        stat.gradient,
                    )}
                >
                    {/* Shimmer on hover */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full" />

                    <div className="relative">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div
                                className={cn(
                                    "p-1.5 rounded-lg bg-background/50",
                                    "group-hover:bg-background transition-colors",
                                )}
                            >
                                <stat.icon className={cn("w-4 h-4", stat.color)} />
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                        </div>
                        <p className="stat-value text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                    </div>
                </button>
            ))}
        </div>
    );
}
