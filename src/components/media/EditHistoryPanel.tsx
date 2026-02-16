/**
 * TASK 8: Edit History Panel
 * Display edit history and allow undo
 */

import { editHistory } from "@/lib/editHistory";
import { useData } from "@/context/DataContext";
import { RotateCcw, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import type { EditHistoryEntry } from "@/lib/editHistory";
import { safeFormat } from "@/lib/utils";

interface EditHistoryPanelProps {
    entryId: number;
    onUndo?: (entry: EditHistoryEntry) => void;
}

export function EditHistoryPanel({ entryId, onUndo }: EditHistoryPanelProps) {
    const { user } = useData();
    const [history, setHistory] = useState<EditHistoryEntry[]>([]);

    useEffect(() => {
        const entryHistory = editHistory.getEntryHistory(entryId);
        setHistory(entryHistory);
    }, [entryId]);

    const handleUndo = (entry: EditHistoryEntry) => {
        if (onUndo) {
            onUndo(entry);
        }
    };

    if (history.length === 0) {
        return (
            <div className="text-sm text-muted-foreground p-4 text-center">
                No edit history for this entry
            </div>
        );
    }

    return (
        <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.map((entry) => (
                <div
                    key={entry.id}
                    className="p-3 bg-secondary rounded-lg border border-border/50"
                >
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs font-medium">
                                    {safeFormat(entry.timestamp, "MMM d, yyyy HH:mm")}
                                </span>
                            </div>
                            <div className="text-sm">
                                <span className="font-medium">{entry.action}</span>
                                {entry.field !== "multiple" && entry.field !== "create" && entry.field !== "delete" && (
                                    <span className="text-muted-foreground">
                                        {" "}• {entry.field}: {String(entry.oldValue)} → {String(entry.newValue)}
                                    </span>
                                )}
                            </div>
                        </div>
                        {entry.action !== "create" && (
                            <button
                                onClick={() => handleUndo(entry)}
                                className="p-1.5 hover:bg-primary/20 rounded transition-colors"
                                title="Undo"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
