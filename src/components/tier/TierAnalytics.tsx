/**
 * PHASE 8: Tier Analytics
 */

import type { Tier, TierAssignment } from "@/lib/tierDatabase";
import type { DisplayMedia } from "@/types/display";
import { BarChart3 } from "lucide-react";

interface TierAnalyticsProps {
    tiers: Tier[];
    assignments: TierAssignment[];
    allMedia: DisplayMedia[];
}

export function TierAnalytics({ tiers, assignments, allMedia }: TierAnalyticsProps) {
    // Get media for each tier
    const getMediaForTier = (tierId: string | number | null) => {
        const tierAssignments = assignments.filter(a => String(a.tierId) === String(tierId));
        return tierAssignments.map(a => allMedia.find(m => String(m._entryId) === String(a.mediaId))).filter(Boolean) as DisplayMedia[];
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
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
                <BarChart3 className="w-4 h-4" />
                Tier Analytics
            </h3>
            <div className="space-y-4">
                {/* Overview */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border bg-muted/40 p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Ranked</div>
                        <div className="text-2xl font-extrabold tracking-tight">{totalRanked}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/40 p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Unranked</div>
                        <div className="text-2xl font-extrabold tracking-tight">{totalUnranked}</div>
                    </div>
                </div>

                {/* Tier Distribution */}
                <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Distribution</h4>
                    {tierStats.map(({ tier, count, avgScore, percentage }) => (
                        <div key={tier.id} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded"
                                        style={{ backgroundColor: tier.color }}
                                    />
                                    <span className="font-semibold">{tier.name}</span>
                                </div>
                                <span className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                                    {count} ({percentage.toFixed(1)}%)
                                </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                        width: `${percentage}%`,
                                        backgroundColor: tier.color,
                                    }}
                                />
                            </div>
                            {avgScore > 0 && (
                                <div className="text-[11px] text-muted-foreground">
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
