/**
 * First Login Migration Dialog
 *
 * Shown when user logs in for the first time.
 * Offers options to upload local vault, download cloud vault, or merge.
 */

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CloudDownload, CloudUpload, GitMerge, Loader } from "lucide-react";
import { useState } from "react";

interface FirstLoginDialogProps {
    isOpen: boolean;
    onClose: () => void;
    localItemCount: number;
    cloudItemCount: number;
    onUpload?: () => Promise<void>;
    onDownload?: () => Promise<void>;
    onMerge?: () => Promise<void>;
}

export function FirstLoginDialog({
    isOpen,
    onClose,
    localItemCount = 0,
    cloudItemCount = 0,
    onUpload,
    onDownload,
    onMerge,
}: FirstLoginDialogProps) {
    const [loading, setLoading] = useState(false);
    const [activeAction, setActiveAction] = useState<"upload" | "download" | "merge" | null>(null);
    const { toast } = useToast();

    const handleAction = async (action: "upload" | "download" | "merge", callback?: () => Promise<void>) => {
        if (!callback) return;

        try {
            setLoading(true);
            setActiveAction(action);
            await callback();
            toast({
                title: "Success",
                description:
                    action === "upload"
                        ? `Uploaded ${localItemCount} items to cloud`
                        : action === "download"
                          ? `Downloaded ${cloudItemCount} items from cloud`
                          : "Merged local and cloud data",
            });
            onClose();
        } catch (err) {
            toast({
                title: "Operation failed",
                description: err instanceof Error ? err.message : "Something went wrong",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setActiveAction(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Set up cloud sync</DialogTitle>
                    <DialogDescription>Choose how to sync your vault across devices</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Info */}
                    <div className="grid grid-cols-2 gap-2 text-center text-sm p-3 bg-blue-50 rounded-lg">
                        <div>
                            <p className="font-semibold text-blue-900">{localItemCount}</p>
                            <p className="text-xs text-blue-700">Local items</p>
                        </div>
                        <div>
                            <p className="font-semibold text-blue-900">{cloudItemCount}</p>
                            <p className="text-xs text-blue-700">Cloud items</p>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        {/* Upload Option */}
                        <button
                            onClick={() => handleAction("upload", onUpload)}
                            disabled={loading || localItemCount === 0}
                            className="w-full p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {loading && activeAction === "upload" ? (
                                    <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                                ) : (
                                    <CloudUpload className="w-5 h-5 text-blue-600" />
                                )}
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Upload to cloud</p>
                                    <p className="text-xs text-gray-500">
                                        Save your {localItemCount} local items to cloud
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* Download Option */}
                        <button
                            onClick={() => handleAction("download", onDownload)}
                            disabled={loading || cloudItemCount === 0}
                            className="w-full p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {loading && activeAction === "download" ? (
                                    <Loader className="w-5 h-5 text-green-600 animate-spin" />
                                ) : (
                                    <CloudDownload className="w-5 h-5 text-green-600" />
                                )}
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Download from cloud</p>
                                    <p className="text-xs text-gray-500">
                                        Restore your {cloudItemCount} cloud items here
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* Merge Option */}
                        <button
                            onClick={() => handleAction("merge", onMerge)}
                            disabled={loading || (localItemCount === 0 && cloudItemCount === 0)}
                            className="w-full p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {loading && activeAction === "merge" ? (
                                    <Loader className="w-5 h-5 text-purple-600 animate-spin" />
                                ) : (
                                    <GitMerge className="w-5 h-5 text-purple-600" />
                                )}
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Merge both</p>
                                    <p className="text-xs text-gray-500">Combine local and cloud (recommended)</p>
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-200" />

                    {/* Skip Button */}
                    <Button variant="outline" className="w-full" onClick={onClose} disabled={loading}>
                        Skip for now
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
