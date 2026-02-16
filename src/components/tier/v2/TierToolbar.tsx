import { Button } from "@/components/ui/YuraButton";
import { 
    Plus, 
    RotateCcw, 
    Filter, 
    Download, 
    CheckSquare, 
    BarChart3,
    Trash2,
    MoveRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TierToolbarProps {
    onAddTier: () => void;
    onAutoSort: () => void;
    onToggleFilter: () => void;
    onExportImage: () => void;
    isBulkMode: boolean;
    onToggleBulkMode: () => void;
    selectedCount: number;
    onBulkMove: () => void;
    onBulkDelete: () => void;
}

export function TierToolbar({
    onAddTier,
    onAutoSort,
    onToggleFilter,
    onExportImage,
    isBulkMode,
    onToggleBulkMode,
    selectedCount,
    onBulkMove,
    onBulkDelete
}: TierToolbarProps) {
    return (
        <div className="sakura-glass p-5 flex flex-wrap items-center justify-between gap-4 shadow-depth1">
            <div className="flex items-center gap-3">
                <Button 
                    onClick={onAddTier}
                    icon={Plus}
                    className="h-12 rounded-2xl px-8 shadow-glow"
                >
                    Initialize Tier
                </Button>
                <Button 
                    variant="secondary"
                    onClick={onAutoSort}
                    icon={RotateCcw}
                    className="h-12 rounded-2xl px-6 font-black uppercase tracking-widest text-[10px]"
                >
                    Auto Sync
                </Button>
            </div>

            <div className="flex items-center gap-3">
                {isBulkMode ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest px-4">
                            {selectedCount} SUBJECTS IDENTIFIED
                        </span>
                        <Button 
                            variant="secondary"
                            onClick={onBulkMove}
                            disabled={selectedCount === 0}
                            icon={MoveRight}
                            className="h-12 rounded-2xl px-6 font-black uppercase tracking-widest text-[10px]"
                        >
                            Relocate
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={onBulkDelete}
                            disabled={selectedCount === 0}
                            icon={Trash2}
                            className="h-12 rounded-2xl px-6 font-black uppercase tracking-widest text-[10px]"
                        >
                            Purge
                        </Button>
                        <Button 
                            variant="primary"
                            onClick={onToggleBulkMode}
                            className="h-12 rounded-2xl px-6 font-black uppercase tracking-widest text-[10px]"
                        >
                            Exit Mode
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="secondary"
                            onClick={onToggleBulkMode}
                            icon={CheckSquare}
                            className="h-12 rounded-2xl px-6 font-black uppercase tracking-widest text-[10px]"
                        >
                            Bulk Selection
                        </Button>
                        <Button 
                            variant="secondary"
                            onClick={onToggleFilter}
                            icon={Filter}
                            className="h-12 rounded-2xl px-6 font-black uppercase tracking-widest text-[10px]"
                        >
                            Filter
                        </Button>
                        <Button 
                            variant="secondary"
                            onClick={onExportImage}
                            icon={Download}
                            className="h-12 rounded-2xl px-6 font-black uppercase tracking-widest text-[10px]"
                        >
                            Snapshot
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
