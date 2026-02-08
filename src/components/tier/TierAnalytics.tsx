/**
 * PHASE 8: Tier Analytics
 */

import type { Tier, TierAssignment } from "@/lib/tierDatabase";
import type { DisplayMedia } from "@/types/display";
import { BarChart3, TrendingUp } from "lucide-react";

interface TierAnalyticsProps {
    tiers: Tier[];
    assignments: TierAssignment[];
    allMedia: DisplayMedia[];
}

export function TierAnalytics({ tiers, assignments, allMedia }: TierAnalyticsProps) {
    // Get media for each tier
    const getMediaForTier = (tierId: number | null) => {
        const tierAssignments = assignments.filter(a => a.tierId === tierId);
        return tierAssignments.map(a => allMedia.find(m => m._entryId === a.mediaId)).filter(Boolean) as DisplayMedia[];
    };

    // Calculate stats
    const tierStats = tiers.map(tier => {
        const media = getMediaForTier(tier.id!);
        const scored = media.filter(m => m.score > 0);
        const avgScore = scored.length > 0 
            ? scored.reduce((sum, m) => sum + m.score, 0) / scored.length 
            : 0;

        return {
            tier,
            count: media.length,
            avgScore,
            percentage: allMedia.length > 0 ? (media.length / allMedia.length) * 100 : 0,
        };
    });

    const totalRanked = assignments.filter(a => a.tierId !== null).length;
    const totalUnranked = allMedia.length - totalRanked;

    return (
        <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Tier Analytics
            </h3>
            <div className="space-y-4">
                {/* Overview */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-secondary/50 rounded-lg p-3">
                        <div className="text-sm text-muted-foreground">Ranked</div>
                        <div className="text-2xl font-bold">{totalRanked}</div>
                    </div>
                    <div className="bg-secondary/50 rounded-lg p-3">
                        <div className="text-sm text-muted-foreground">Unranked</div>
                        <div className="text-2xl font-bold">{totalUnranked}</div>
                    </div>
                </div>

                {/* Tier Distribution */}
                <div className="space-y-2">
                    <h4 className="text-sm font-medium">Distribution</h4>
                    {tierStats.map(({ tier, count, avgScore, percentage }) => (
                        <div key={tier.id} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded"
                                        style={{ backgroundColor: tier.color }}
                                    />
                                    <span>{tier.name}</span>
                                </div>
                                <span className="text-muted-foreground">
                                    {count} ({percentage.toFixed(1)}%)
                                </span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${percentage}%`,
                                        backgroundColor: tier.color,
                                    }}
                                />
                            </div>
                            {avgScore > 0 && (
                                <div className="text-xs text-muted-foreground">
                                    Avg Score: {avgScore.toFixed(1)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
