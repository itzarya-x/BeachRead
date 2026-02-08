import { Card } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import { Sparkles } from "lucide-react";

export function PersonalizedInsights() {
    const { user, animeList, mangaList } = useData();

    if (!user) return null;

    const allMedia = [...animeList, ...mangaList];
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);

    const completedThisMonth = allMedia.filter(item => {
        if (item.status !== "COMPLETED") return false;
        const completedDate = new Date(item.completedAt || item.updatedAt);
        return completedDate >= thisMonthStart;
    }).length;

    const topGenre = allMedia
        .filter(item => item.genres && item.genres.length > 0)
        .reduce(
            (acc, item) => {
                item.genres?.forEach(g => {
                    acc[g] = (acc[g] || 0) + 1;
                });
                return acc;
            },
            {} as Record<string, number>,
        );

    const topGenreName = Object.entries(topGenre).sort(([, a], [, b]) => b - a)[0]?.[0];

    const currentlyWatching = allMedia.filter(item => item.status === "CURRENT");
    const plannedCount = allMedia.filter(item => item.status === "PLANNING").length;

    const insights = [];

    if (completedThisMonth > 0) {
        insights.push(`You completed ${completedThisMonth} series${completedThisMonth === 1 ? "" : "s"} this month`);
    }

    if (topGenreName) {
        insights.push(`Your most-watched genre is ${topGenreName}`);
    }

    if (currentlyWatching.length > plannedCount && currentlyWatching.length > 0) {
        insights.push(`You're actively watching ${currentlyWatching.length} series`);
    }

    if (plannedCount > 0) {
        insights.push(`You have ${plannedCount} series in your ${plannedCount === 1 ? "backlog" : "backlog"}`);
    }

    const randomInsight = insights[Math.floor(Math.random() * insights.length)];

    if (!randomInsight) return null;

    return (
        <Card className="p-4 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 border-primary/20 mb-6">
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 mt-1">
                    <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-primary mb-1">Personal Insight</p>
                    <p className="text-sm text-foreground">{randomInsight}</p>
                </div>
            </div>
        </Card>
    );
}
