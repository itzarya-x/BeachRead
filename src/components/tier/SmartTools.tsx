/**
 * PHASE 5: Smart Tools for TierMaker
 */

import type { Tier, TierAssignment } from "@/lib/tierDatabase";
import { deleteAssignment, saveAssignment } from "@/lib/tierDatabase";
import type { DisplayMedia } from "@/types/display";
import { Sparkles, Trash } from "lucide-react";

interface SmartToolsProps {
    boardId: string | number;
    tiers: Tier[];
    assignments: TierAssignment[];
    allMedia: DisplayMedia[];
    onAssignmentsUpdate: () => void;
}

export function SmartTools({ boardId, tiers, assignments, allMedia, onAssignmentsUpdate }: SmartToolsProps) {
    // PHASE 5.1: Auto-fill by score
    const handleAutoFillByScore = async () => {
        if (!confirm("Auto-fill tiers based on scores? This will move items to appropriate tiers.")) return;

        const scoreRanges = [
            { min: 90, tierName: "S" },
            { min: 80, tierName: "A" },
            { min: 70, tierName: "B" },
            { min: 60, tierName: "C" },
            { min: 0, tierName: "D" },
        ];

        for (const media of allMedia) {
            if (media.score === 0) continue; // Skip unrated

            const range = scoreRanges.find(r => media.score >= r.min);
            if (!range) continue;

            const targetTier = tiers.find(t => t.name === range.tierName);
            if (!targetTier) continue;

            // Check if already assigned
            const existing = assignments.find(a => a.mediaId === media._entryId && a.boardId === boardId);
            
            if (existing) {
                await saveAssignment({
                    ...existing,
                    tierId: targetTier.id!,
                    position: assignments.filter(a => a.tierId === targetTier.id).length,
                });
            } else {
                await saveAssignment({
                    boardId,
                    mediaId: media._entryId,
                    tierId: targetTier.id!,
                    position: assignments.filter(a => a.tierId === targetTier.id).length,
                });
            }
        }

        onAssignmentsUpdate();
    };

    // PHASE 5.4: Clear tier
    const handleClearTier = async (tierId: string | number) => {
        if (!confirm("Clear all items from this tier?")) return;

        const tierAssignments = assignments.filter(a => a.tierId === tierId && a.boardId === boardId);
        for (const assignment of tierAssignments) {
            if (assignment.id) {
                await deleteAssignment(assignment.id);
            }
        }

        onAssignmentsUpdate();
    };

    return (
        <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Smart Tools
            </h3>
            <div className="space-y-2">
                <button
                    onClick={handleAutoFillByScore}
                    className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2 text-sm"
                >
                    <Sparkles className="w-4 h-4" />
                    Auto-fill by Score
                </button>
                {tiers.map(tier => (
                    <button
                        key={tier.id}
                        onClick={() => handleClearTier(tier.id!)}
                        className="w-full px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 flex items-center gap-2 text-sm"
                    >
                        <Trash className="w-4 h-4" />
                        Clear {tier.name}
                    </button>
                ))}
            </div>
        </div>
    );
}
