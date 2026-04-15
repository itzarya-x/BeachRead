import React from 'react';
import { Monitor, Globe, ShieldAlert } from 'lucide-react';

export const SessionsPanel: React.FC = () => {
    return (
        <section className="bg-muted/20 border border-border/40 rounded-[24px] p-8">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Active Sessions</h2>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-background border border-border/60 rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-muted-foreground">
                            <Monitor size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-foreground">Current Session</h3>
                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded">Active</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                <Globe size={10} /> Local Connection • Active Now
                            </p>
                        </div>
                    </div>
                </div>

                <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-border/50 rounded-3xl bg-muted/5">
                    <ShieldAlert className="w-8 h-8 text-muted-foreground/30 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">Extended Management Unavailable</p>
                    <p className="text-xs text-muted-foreground max-w-xs italic">
                        Cross-device session management is currently being migrated to Supabase security protocols.
                    </p>
                </div>
            </div>
        </section>
    );
};
