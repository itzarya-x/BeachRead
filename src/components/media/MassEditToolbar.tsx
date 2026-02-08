/**
 * TASK 9: Mass Edit Tools
 * Select many → change: status, tier, score
 */

import { useMediaStore } from "@/store/mediaStore";
import { useData } from "@/context/DataContext";
import type { MediaStatus } from "@/types/display";
import { CheckSquare, Square, X, Save } from "lucide-react";
import { useState } from "react";
import { STATUS_LABELS } from "@/lib/constants";

interface MassEditToolbarProps {
    mediaType: "ANIME" | "MANGA";
}

export function MassEditToolbar({ mediaType }: MassEditToolbarProps) {
    const { updateEntry, user } = useData();
    const { selectedEntries, clearSelection, isSelected, animeList, mangaList } = useMediaStore();
    const [showToolbar, setShowToolbar] = useState(false);
    const [massEditForm, setMassEditForm] = useState<{
        status?: MediaStatus;
        priority?: number;
        score?: number;
    }>({});

    const list = mediaType === "ANIME" ? animeList : mangaList;
    const selectedCount = Array.from(selectedEntries).filter(id => 
        list.some(item => item._entryId === id)
    ).length;

    if (selectedCount === 0) return null;

    const handleSelectAll = () => {
        const allIds = list.map(item => item._entryId);
        useMediaStore.getState().selectAll(allIds);
    };

    const handleDeselectAll = () => {
        clearSelection();
    };

    const handleMassUpdate = async () => {
        if (!user) return;

        const updates: Partial<typeof massEditForm> = {};
        if (massEditForm.status !== undefined) updates.status = massEditForm.status;
        if (massEditForm.priority !== undefined) updates.priority = massEditForm.priority;
        if (massEditForm.score !== undefined) updates.score = massEditForm.score;

        if (Object.keys(updates).length === 0) {
            alert("Please select at least one field to update");
            return;
        }

        // Update all selected entries
        const selectedIds = Array.from(selectedEntries).filter(id => 
            list.some(item => item._entryId === id)
        );

        for (const entryId of selectedIds) {
            await updateEntry(entryId, updates);
        }

        clearSelection();
        setMassEditForm({});
        setShowToolbar(false);
    };

    return (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-card border border-border rounded-lg shadow-lg p-4 min-w-[400px]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{selectedCount} selected</span>
                        <button
                            onClick={handleSelectAll}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            Select All
                        </button>
                        <button
                            onClick={handleDeselectAll}
                            className="text-xs text-muted-foreground hover:text-foreground"
                        >
                            Clear
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            setShowToolbar(false);
                            clearSelection();
                        }}
                        className="p-1 hover:bg-secondary rounded"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {showToolbar ? (
                    <div className="space-y-3">
                        {/* Status */}
                        <div>
                            <label className="block text-xs font-medium mb-1">Status</label>
                            <select
                                value={massEditForm.status || ""}
                                onChange={(e) => setMassEditForm({ 
                                    ...massEditForm, 
                                    status: e.target.value ? e.target.value as MediaStatus : undefined 
                                })}
                                className="w-full px-2 py-1 text-sm bg-background border border-border rounded"
                            >
                                <option value="">Keep current</option>
                                {(["CURRENT", "PLANNING", "COMPLETED", "DROPPED", "PAUSED", "REPEATING"] as MediaStatus[]).map(status => (
                                    <option key={status} value={status}>
                                        {STATUS_LABELS[status]?.[mediaType] || status}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Priority/Tier */}
                        <div>
                            <label className="block text-xs font-medium mb-1">Priority/Tier</label>
                            <select
                                value={massEditForm.priority ?? ""}
                                onChange={(e) => setMassEditForm({ 
                                    ...massEditForm, 
                                    priority: e.target.value ? parseInt(e.target.value) : undefined 
                                })}
                                className="w-full px-2 py-1 text-sm bg-background border border-border rounded"
                            >
                                <option value="">Keep current</option>
                                <option value="0">None</option>
                                <option value="1">Low</option>
                                <option value="2">Medium</option>
                                <option value="3">High</option>
                            </select>
                        </div>

                        {/* Score */}
                        <div>
                            <label className="block text-xs font-medium mb-1">Score</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={massEditForm.score ?? ""}
                                onChange={(e) => setMassEditForm({ 
                                    ...massEditForm, 
                                    score: e.target.value ? parseInt(e.target.value) : undefined 
                                })}
                                placeholder="Keep current"
                                className="w-full px-2 py-1 text-sm bg-background border border-border rounded"
                            />
                        </div>

                        <button
                            onClick={handleMassUpdate}
                            className="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Apply to {selectedCount} items
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowToolbar(true)}
                        className="w-full px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                    >
                        Edit {selectedCount} items
                    </button>
                )}
            </div>
        </div>
    );
}
