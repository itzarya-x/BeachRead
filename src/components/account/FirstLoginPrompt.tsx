/**
 * First Login Prompt (PHASE 6)
 *
 * Welcome dialog shown on first cloud sign-in.
 * - Celebrates user migration to cloud
 * - Explains cloud sync benefits
 * - One-time display
 */

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle2, Cloud } from "lucide-react";
import { useEffect, useState } from "react";

const FIRST_LOGIN_STORAGE_KEY = "yura_first_login_shown";

export function FirstLoginPrompt() {
    const { isAuthenticated, user } = useAuth();
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Only show on first login
        if (isAuthenticated && user) {
            const alreadyShown = localStorage.getItem(FIRST_LOGIN_STORAGE_KEY);
            if (!alreadyShown) {
                setShowPrompt(true);
                localStorage.setItem(FIRST_LOGIN_STORAGE_KEY, "true");
            }
        }
    }, [isAuthenticated, user]);

    if (!showPrompt) return null;

    const handleDismiss = () => {
        setShowPrompt(false);
    };

    return (
        <Dialog open={showPrompt} onOpenChange={(open) => !open && handleDismiss()}>
            <DialogContent className="max-w-md border-white/10 bg-card/95 sm:rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-extrabold tracking-tight">Welcome to Cloud Sync</DialogTitle>
                    <DialogDescription>
                        Your vault can now stay in sync across devices.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex justify-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/15">
                            <Cloud className="h-7 w-7 text-primary" />
                        </div>
                    </div>

                    <div className="space-y-2 text-center">
                        <p className="text-foreground">Your media library is now synced to cloud storage.</p>
                        <p className="text-sm text-muted-foreground">Backups are automatic and your data remains recoverable.</p>
                    </div>

                    <div className="space-y-2 pt-1">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                            <span className="text-sm">Access your vault from any signed-in device</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                            <span className="text-sm">Automatic cloud backup protection</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                            <span className="text-sm">Local data remains available on this device</span>
                        </div>
                    </div>

                    <div className="rounded-lg border border-primary/25 bg-primary/10 p-3">
                        <p className="text-xs text-primary/90">
                            Cloud sync is optional and can be disabled in settings at any time.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" onClick={handleDismiss} className="w-full rounded-xl">
                        Got it
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
