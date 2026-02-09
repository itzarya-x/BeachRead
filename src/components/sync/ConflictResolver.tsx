/**
 * Conflict Resolver Component
 *
 * Shows conflicting items (edited in multiple places).
 * User selects which version to keep.
 */

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Clock } from "lucide-react";
import { useState } from "react";

export interface ConflictItem {
    id: string;
    title: string;
    localVersion: {
        data: Record<string, any>;
        updatedAt: Date;
        device?: string;
    };
    cloudVersion: {
        data: Record<string, any>;
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
            <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        Resolve {conflicts.length} conflict
                        {conflicts.length > 1 ? "s" : ""}
                    </DialogTitle>
                    <DialogDescription>
                        {currentIndex + 1} of {conflicts.length} — Choose which version to keep
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Item Title */}
                    <div>
                        <h3 className="font-semibold text-lg text-gray-900">{current.title}</h3>
                    </div>

                    {/* Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Local Version */}
                        <button
                            onClick={() => handleResolve("local")}
                            disabled={resolving !== null}
                            className="rounded-lg border-2 border-blue-200 p-4 text-left hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-blue-900">Local (This Device)</p>
                                    {resolving === current.id && (
                                        <span className="text-xs text-blue-600">Resolving...</span>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="space-y-1 text-xs text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{current.localVersion.updatedAt.toLocaleString()}</span>
                                    </div>
                                    {current.localVersion.device && <p>{current.localVersion.device}</p>}
                                </div>

                                {/* Data Preview */}
                                <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-900 font-mono max-h-24 overflow-y-auto">
                                    <pre>
                                        {JSON.stringify(current.localVersion.data, null, 2).substring(0, 200)}
                                        ...
                                    </pre>
                                </div>

                                <Button size="sm" className="w-full mt-3" disabled={resolving !== null}>
                                    Keep this
                                </Button>
                            </div>
                        </button>

                        {/* Cloud Version */}
                        <button
                            onClick={() => handleResolve("cloud")}
                            disabled={resolving !== null}
                            className="rounded-lg border-2 border-green-200 p-4 text-left hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold text-green-900">Cloud</p>
                                    {resolving === current.id && (
                                        <span className="text-xs text-green-600">Resolving...</span>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="space-y-1 text-xs text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        <span>{current.cloudVersion.updatedAt.toLocaleString()}</span>
                                    </div>
                                    {current.cloudVersion.device && <p>{current.cloudVersion.device}</p>}
                                </div>

                                {/* Data Preview */}
                                <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-900 font-mono max-h-24 overflow-y-auto">
                                    <pre>
                                        {JSON.stringify(current.cloudVersion.data, null, 2).substring(0, 200)}
                                        ...
                                    </pre>
                                </div>

                                <Button size="sm" className="w-full mt-3" disabled={resolving !== null}>
                                    Keep this
                                </Button>
                            </div>
                        </button>
                    </div>

                    {/* Progress */}
                    <div className="flex gap-1">
                        {conflicts.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1 flex-1 rounded transition-colors ${
                                    idx < currentIndex
                                        ? "bg-green-500"
                                        : idx === currentIndex
                                          ? "bg-blue-500"
                                          : "bg-gray-200"
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
