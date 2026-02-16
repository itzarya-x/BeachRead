import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/YuraButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import type { Tier } from "@/lib/tierDatabase";
import { Trash2, Save, X } from "lucide-react";

interface TierEditModalProps {
    tier: Tier | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updates: Partial<Tier>) => Promise<void>;
    onDelete: (tierId: string | number) => Promise<void>;
}

export function TierEditModal({ 
    tier, 
    isOpen, 
    onClose, 
    onSave, 
    onDelete 
}: TierEditModalProps) {
    const [name, setName] = useState("");
    const [color, setColor] = useState("#808080");
    const [order, setOrder] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (tier) {
            setName(tier.name);
            setColor(tier.color);
            setOrder(tier.order);
        }
    }, [tier]);

    const handleSave = async () => {
        if (!tier) return;
        setIsSaving(true);
        try {
            await onSave({ name, color, order });
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!tier || !confirm("Delete tier? Items will be moved to untiered pool.")) return;
        setIsSaving(true);
        try {
            await onDelete(tier.id!);
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-widest text-primary">
                        Configure Protocol
                    </DialogTitle>
                    <DialogDescription className="text-white/40 uppercase tracking-widest text-[10px] font-bold">
                        Modifying Tier Metadata
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">
                            Label Designation
                        </Label>
                        <Input 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            className="sakura-input h-12 text-lg font-bold"
                            placeholder="e.g. S-TIER"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">
                            Chromatic Signature
                        </Label>
                        <div className="flex gap-4 items-center">
                            <input 
                                type="color" 
                                value={color} 
                                onChange={(e) => setColor(e.target.value)}
                                className="h-14 w-20 cursor-pointer bg-transparent border-none p-0"
                            />
                            <Input 
                                value={color} 
                                onChange={(e) => setColor(e.target.value)}
                                className="sakura-input h-14 font-mono uppercase"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">
                            Rank Priority
                        </Label>
                        <Input 
                            type="number" 
                            value={order} 
                            onChange={(e) => setOrder(parseInt(e.target.value))}
                            className="sakura-input h-12 font-bold"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 flex flex-col sm:flex-row">
                    <Button 
                        variant="destructive" 
                        onClick={handleDelete}
                        icon={Trash2}
                        className="h-12 px-6 uppercase tracking-widest text-[10px] font-black"
                        loading={isSaving}
                    >
                        Decommission
                    </Button>
                    <div className="flex-1" />
                    <div className="flex gap-2">
                        <Button 
                            variant="ghost" 
                            onClick={onClose}
                            className="h-12 px-6 uppercase tracking-widest text-[10px] font-black"
                        >
                            Abort
                        </Button>
                        <Button 
                            onClick={handleSave}
                            icon={Save}
                            className="h-12 px-8 uppercase tracking-widest text-[10px] font-black shadow-glow"
                            loading={isSaving}
                        >
                            Commit
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
