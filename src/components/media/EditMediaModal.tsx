/**
 * TASK 4: Edit Media Modal
 * Allows editing: rating, status, progress, repeat, priority, notes, tier, custom tags
 */

import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_LABELS } from "@/lib/constants";
import type { DisplayMedia, MediaStatus } from "@/types/display";
import { Save, Trash2 } from "lucide-react";
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
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-border bg-card p-0 sm:rounded-2xl">
                <DialogHeader className="border-b border-border px-6 py-5">
                    <DialogTitle className="text-xl font-extrabold tracking-tight">Edit Entry</DialogTitle>
                    <DialogDescription>
                        Update progress, status, scoring, and personal metadata for this title.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 px-6 py-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={formData.status || "PLANNING"}
                                onValueChange={(value) => setFormData({ ...formData, status: value as MediaStatus })}
                            >
                                <SelectTrigger className="h-10 rounded-xl border-border bg-input">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {allStatuses.map(status => (
                                        <SelectItem key={status} value={status}>
                                            {STATUS_LABELS[status]?.[media.mediaType] || status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Score</Label>
                            <Input
                                type="number"
                                min="0"
                                max="100"
                                value={formData.score ?? 0}
                                onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || 0 })}
                                className="h-10 rounded-xl border-border bg-input"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Progress {media.mediaType === "ANIME" ? "(Episodes)" : "(Chapters)"}</Label>
                            <Input
                                type="number"
                                min="0"
                                value={formData.progress ?? 0}
                                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                                className="h-10 rounded-xl border-border bg-input"
                            />
                        </div>
                        {media.mediaType === "MANGA" && (
                            <div className="space-y-2">
                                <Label>Volumes</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={formData.progressVolumes ?? 0}
                                    onChange={(e) => setFormData({ ...formData, progressVolumes: parseInt(e.target.value) || 0 })}
                                    className="h-10 rounded-xl border-border bg-input"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Repeat Count</Label>
                            <Input
                                type="number"
                                min="0"
                                value={formData.repeat ?? 0}
                                onChange={(e) => setFormData({ ...formData, repeat: parseInt(e.target.value) || 0 })}
                                className="h-10 rounded-xl border-border bg-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select
                                value={String(formData.priority ?? 0)}
                                onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}
                            >
                                <SelectTrigger className="h-10 rounded-xl border-border bg-input">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">None</SelectItem>
                                    <SelectItem value="1">Low</SelectItem>
                                    <SelectItem value="2">Medium</SelectItem>
                                    <SelectItem value="3">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                            value={formData.notes || ""}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
                            rows={4}
                            className="resize-none rounded-xl border-border bg-input"
                            placeholder="Add your notes here..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Custom Lists</Label>
                        <Input
                            type="text"
                            value={formData.customLists?.join(", ") || ""}
                            onChange={(e) => setFormData({
                                ...formData,
                                customLists: e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                            })}
                            className="h-10 rounded-xl border-border bg-input"
                            placeholder="Comma-separated list names"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-3">
                            <Checkbox
                                id="isPrivate"
                                checked={formData.isPrivate ?? false}
                                onCheckedChange={(checked) => setFormData({ ...formData, isPrivate: Boolean(checked) })}
                            />
                            <Label htmlFor="isPrivate" className="cursor-pointer">Private</Label>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-3">
                            <Checkbox
                                id="hiddenDefault"
                                checked={formData.hiddenDefault ?? false}
                                onCheckedChange={(checked) => setFormData({ ...formData, hiddenDefault: Boolean(checked) })}
                            />
                            <Label htmlFor="hiddenDefault" className="cursor-pointer">Hidden from default view</Label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Started At</Label>
                            <Input
                                type="date"
                                value={formData.startedAt ? new Date(formData.startedAt).toISOString().split('T')[0] : ""}
                                onChange={(e) => setFormData({ ...formData, startedAt: e.target.value || null })}
                                className="h-10 rounded-xl border-border bg-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Completed At</Label>
                            <Input
                                type="date"
                                value={formData.completedAt ? new Date(formData.completedAt).toISOString().split('T')[0] : ""}
                                onChange={(e) => setFormData({ ...formData, completedAt: e.target.value || null })}
                                className="h-10 rounded-xl border-border bg-input"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex items-center justify-between border-t border-border px-6 py-4 sm:justify-between">
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                        className="rounded-xl"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </Button>
                    <div className="flex gap-2">
                        <Button type="button" variant="secondary" onClick={onClose} disabled={loading} className="rounded-xl">
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleSave} disabled={loading} className="rounded-xl">
                            <Save className="h-4 w-4" />
                            Save
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
