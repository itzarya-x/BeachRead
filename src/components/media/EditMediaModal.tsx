/**
 * TASK 4: Edit Media Modal
 * Allows editing: rating, status, progress, repeat, priority, notes, tier, custom tags
 */

import { useData } from "@/context/DataContext";
import { STATUS_LABELS } from "@/lib/constants";
import type { DisplayMedia, MediaStatus } from "@/types/display";
import { Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface EditMediaModalProps {
    media: DisplayMedia | null;
    onClose: () => void;
    onDelete?: () => void;
}

export function EditMediaModal({ media, onClose, onDelete }: EditMediaModalProps) {
    const { updateEntry, deleteEntry, user } = useData();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<DisplayMedia>>({});

    useEffect(() => {
        if (media) {
            setFormData({
                status: media.status,
                score: media.score,
                progress: media.progress,
                progressVolumes: media.progressVolumes,
                repeat: media.repeat,
                priority: media.priority,
                notes: media.notes,
                customLists: media.customLists || [],
                isPrivate: media.isPrivate,
                hiddenDefault: media.hiddenDefault,
                advancedScores: media.advancedScores || [],
                startedAt: media.startedAt,
                completedAt: media.completedAt,
            });
        }
    }, [media]);

    if (!media) return null;

    const handleSave = async () => {
        if (!media._entryId) return;
        
        setLoading(true);
        try {
            await updateEntry(media._entryId, formData);
            onClose();
        } catch (err) {
            console.error("Failed to update entry:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!media._entryId || !onDelete) return;
        
        if (confirm("Are you sure you want to delete this entry? This action cannot be undone.")) {
            setLoading(true);
            try {
                await deleteEntry(media._entryId);
                onDelete();
                onClose();
            } catch (err) {
                console.error("Failed to delete entry:", err);
            } finally {
                setLoading(false);
            }
        }
    };

    const allStatuses: MediaStatus[] = ["CURRENT", "PLANNING", "COMPLETED", "DROPPED", "PAUSED", "REPEATING"];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-semibold">Edit Entry</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 space-y-6">
                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Status</label>
                        <select
                            value={formData.status || "PLANNING"}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as MediaStatus })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                        >
                            {allStatuses.map(status => (
                                <option key={status} value={status}>
                                    {STATUS_LABELS[status]?.[media.mediaType] || status}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Score */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Score</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.score ?? 0}
                            onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                        />
                    </div>

                    {/* Progress */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Progress {media.mediaType === "ANIME" ? "(Episodes)" : "(Chapters)"}
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={formData.progress ?? 0}
                            onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                        />
                    </div>

                    {media.mediaType === "MANGA" && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Volumes</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.progressVolumes ?? 0}
                                onChange={(e) => setFormData({ ...formData, progressVolumes: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                            />
                        </div>
                    )}

                    {/* Repeat */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Repeat Count</label>
                        <input
                            type="number"
                            min="0"
                            value={formData.repeat ?? 0}
                            onChange={(e) => setFormData({ ...formData, repeat: parseInt(e.target.value) || 0 })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                        />
                    </div>

                    {/* Priority/Tier */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Priority/Tier</label>
                        <select
                            value={formData.priority ?? 0}
                            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                        >
                            <option value={0}>None</option>
                            <option value={1}>Low</option>
                            <option value={2}>Medium</option>
                            <option value={3}>High</option>
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Notes</label>
                        <textarea
                            value={formData.notes || ""}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
                            rows={4}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg resize-none"
                            placeholder="Add your notes here..."
                        />
                    </div>

                    {/* Custom Lists */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Custom Lists</label>
                        <input
                            type="text"
                            value={formData.customLists?.join(", ") || ""}
                            onChange={(e) => setFormData({ 
                                ...formData, 
                                customLists: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                            })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                            placeholder="Comma-separated list names"
                        />
                    </div>

                    {/* Privacy */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isPrivate"
                            checked={formData.isPrivate ?? false}
                            onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                            className="w-4 h-4"
                        />
                        <label htmlFor="isPrivate" className="text-sm">Private</label>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="hiddenDefault"
                            checked={formData.hiddenDefault ?? false}
                            onChange={(e) => setFormData({ ...formData, hiddenDefault: e.target.checked })}
                            className="w-4 h-4"
                        />
                        <label htmlFor="hiddenDefault" className="text-sm">Hidden from default view</label>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Started At</label>
                            <input
                                type="date"
                                value={formData.startedAt ? new Date(formData.startedAt).toISOString().split('T')[0] : ""}
                                onChange={(e) => setFormData({ ...formData, startedAt: e.target.value || null })}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Completed At</label>
                            <input
                                type="date"
                                value={formData.completedAt ? new Date(formData.completedAt).toISOString().split('T')[0] : ""}
                                onChange={(e) => setFormData({ ...formData, completedAt: e.target.value || null })}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-border">
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
