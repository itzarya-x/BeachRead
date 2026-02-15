/**
 * Conflict Resolver Component
 *
 * Shows conflicting items (edited in multiple places).
 * User selects which version to keep.
 */

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Clock } from "lucide-react";
import { useState } from "react";

export interface ConflictItem {
    id: string;
    title: string;
    localVersion: {
        data: Record<string, unknown>;
        updatedAt: Date;
        device?: string;
    };
    cloudVersion: {
        data: Record<string, unknown>;
        updatedAt: Date;
        device?: string;
    };
}

interface ConflictResolverProps {
    isOpen: boolean;
    onClose: () => void;
    conflicts: ConflictItem[];
    onResolve: (conflictId: string, choice: "local" | "cloud") => Promise<void>;
}

export function ConflictResolver({ isOpen, onClose, conflicts = [], onResolve }: ConflictResolverProps) {
    const [resolving, setResolving] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const { toast } = useToast();

    if (conflicts.length === 0) return null;

    const current = conflicts[currentIndex];

    const handleResolve = async (choice: "local" | "cloud") => {
        try {
            setResolving(current.id);
            await onResolve(current.id, choice);

            if (currentIndex < conflicts.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setResolving(null);
            } else {
                toast({
                    title: "Conflicts resolved",
                    description: `All ${conflicts.length} conflicts have been resolved.`,
                });
                onClose();
            }
        } catch (err) {
            toast({
                title: "Resolution failed",
                description: err instanceof Error ? err.message : "Something went wrong",
                variant: "destructive",
            });
            setResolving(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto border-border bg-card sm:rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-400" />
                        Resolve {conflicts.length} conflict
                        {conflicts.length > 1 ? "s" : ""}
                    </DialogTitle>
                    <DialogDescription>
                        {currentIndex + 1} of {conflicts.length} — Choose which version to keep
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Item Title */}
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">{current.title}</h3>
                    </div>

                    {/* Comparison */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Local Version */}
                        <div
                            role="button"
                            tabIndex={resolving !== null ? -1 : 0}
                            aria-disabled={resolving !== null}
                            onClick={() => resolving === null && handleResolve("local")}
                            onKeyDown={(e) => {
                                if (resolving !== null) return;
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleResolve("local");
                                }
                            }}
                            className="rounded-xl border border-primary/35 bg-primary/10 p-4 text-left transition-colors hover:bg-primary/15 focus:outline-none focus:ring-2 focus:ring-primary/35 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                        >
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-primary">Local (This device)</p>
                                    {resolving === current.id && (
                                        <span className="text-xs text-primary/80">Resolving...</span>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="space-y-1 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{current.localVersion.updatedAt.toLocaleString()}</span>
                                    </div>
                                    {current.localVersion.device && <p>{current.localVersion.device}</p>}
                                </div>

                                {/* Data Preview */}
                                <ScrollArea className="mt-3 h-28 rounded-lg border border-primary/25 bg-accent/70 p-2 text-xs text-foreground">
                                    <pre className="font-mono whitespace-pre-wrap break-all">
                                        {JSON.stringify(current.localVersion.data, null, 2)}
                                    </pre>
                                </ScrollArea>

                                <div className="mt-3 w-full rounded-md bg-primary/85 px-3 py-1.5 text-center text-sm font-medium text-primary-foreground">
                                    Keep this
                                </div>
                            </div>
                        </div>

                        {/* Cloud Version */}
                        <div
                            role="button"
                            tabIndex={resolving !== null ? -1 : 0}
                            aria-disabled={resolving !== null}
                            onClick={() => resolving === null && handleResolve("cloud")}
                            onKeyDown={(e) => {
                                if (resolving !== null) return;
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    handleResolve("cloud");
                                }
                            }}
                            className="rounded-xl border border-emerald-300 bg-emerald-100 p-4 text-left transition-colors hover:bg-emerald-200/70 focus:outline-none focus:ring-2 focus:ring-emerald-400/35 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                        >
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-emerald-700">Cloud</p>
                                    {resolving === current.id && (
                                        <span className="text-xs text-emerald-700/90">Resolving...</span>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="space-y-1 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{current.cloudVersion.updatedAt.toLocaleString()}</span>
                                    </div>
                                    {current.cloudVersion.device && <p>{current.cloudVersion.device}</p>}
                                </div>

                                {/* Data Preview */}
                                <ScrollArea className="mt-3 h-28 rounded-lg border border-emerald-300 bg-card p-2 text-xs text-foreground">
                                    <pre className="font-mono whitespace-pre-wrap break-all">
                                        {JSON.stringify(current.cloudVersion.data, null, 2)}
                                    </pre>
                                </ScrollArea>

                                <div className="mt-3 w-full rounded-md bg-emerald-600 px-3 py-1.5 text-center text-sm font-medium text-white">
                                    Keep this
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="flex gap-1">
                        {conflicts.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1 flex-1 rounded transition-colors ${
                                    idx < currentIndex
                                        ? "bg-emerald-500"
                                        : idx === currentIndex
                                          ? "bg-primary"
                                          : "bg-muted"
                                }`}
                            />
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
