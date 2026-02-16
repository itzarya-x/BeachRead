import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/YuraButton";
import { useState } from "react";
import type { Tier } from "@/lib/tierDatabase";
import { MoveRight } from "lucide-react";

interface BulkMoveModalProps {
    tiers: Tier[];
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (tierId: string | number | null) => Promise<void>;
    selectedCount: number;
}

export function BulkMoveModal({ 
    tiers, 
    isOpen, 
    onClose, 
    onConfirm, 
    selectedCount 
}: BulkMoveModalProps) {
    const [selectedTierId, setSelectedTierId] = useState<string | number | null>(null);
    const [isMoving, setIsMoving] = useState(false);

    const handleConfirm = async () => {
        setIsMoving(true);
        try {
            await onConfirm(selectedTierId);
            onClose();
        } finally {
            setIsMoving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-widest text-primary">
                        Mass Relocation
                    </DialogTitle>
                    <DialogDescription className="text-white/40 uppercase tracking-widest text-[10px] font-bold">
                        Targeting {selectedCount} Assets for Protocol Transfer
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-2 py-4">
                    <button
                        onClick={() => setSelectedTierId(null)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                            selectedTierId === null 
                            ? "bg-primary/20 border-primary shadow-glow" 
                            : "bg-white/5 border-white/5 hover:bg-white/10"
                        }`}
                    >
                        <span className="font-bold uppercase tracking-widest text-xs">Untiered Pool</span>
                        {selectedTierId === null && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </button>

                    {tiers.map((tier) => (
                        <button
                            key={String(tier.id)}
                            onClick={() => setSelectedTierId(tier.id!)}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                                selectedTierId === tier.id 
                                ? "border-white/40 shadow-glow" 
                                : "border-transparent hover:brightness-110"
                            }`}
                            style={{ 
                                backgroundColor: tier.color,
                                opacity: selectedTierId === tier.id ? 1 : 0.7
                            }}
                        >
                            <span className="font-bold uppercase tracking-widest text-xs text-white drop-shadow-md">
                                {tier.name}
                            </span>
                            {selectedTierId === tier.id && <div className="h-2 w-2 rounded-full bg-white" />}
                        </button>
                    ))}
                </div>

                <DialogFooter>
                    <Button 
                        variant="ghost" 
                        onClick={onClose}
                        className="h-12 px-6 uppercase tracking-widest text-[10px] font-black"
                    >
                        Abort
                    </Button>
                    <Button 
                        onClick={handleConfirm}
                        icon={MoveRight}
                        className="h-12 px-8 uppercase tracking-widest text-[10px] font-black shadow-glow"
                        loading={isMoving}
                    >
                        Execute Transfer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
