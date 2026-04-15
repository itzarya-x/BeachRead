import React from 'react';
import { Trash2, Download } from 'lucide-react';

export const PrivacyPanel: React.FC = () => {
    const handleExport = () => {
        alert('Data export functionality is currently being migrated to the new backend. Please check back later.');
    };

    const handleClearData = () => {
        alert('Clear data functionality is currently being migrated to the new backend. Please use the account settings in Supabase dashboard or contact support.');
    };

    return (
        <section className="bg-muted/20 border border-border/40 rounded-[24px] p-8 space-y-12">
            <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8">Data & Portability</h2>
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-background border border-border/60 rounded-xl gap-6 opacity-60">
                    <div>
                        <h3 className="text-sm font-bold text-foreground">Export Data</h3>
                        <p className="text-xs text-muted-foreground mt-1">Download a complete copy of your library and reading data.</p>
                    </div>
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-3 border border-border/60 rounded-xl text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-foreground/5 transition-all cursor-not-allowed"
                    >
                        <Download size={14} />
                        Request Export
                    </button>
                </div>
                <p className="text-[10px] text-primary mt-4 font-bold uppercase tracking-widest italic">Unavailable during migration</p>
            </div>

            <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-destructive mb-8">Danger Zone</h2>
                <div className="p-6 bg-destructive/5 border border-destructive/20 rounded-xl opacity-60">
                    <h3 className="text-sm font-bold text-destructive">Delete My Data</h3>
                    <p className="text-xs text-muted-foreground mt-1 mb-6">Permanently delete your entire history and account profile. This action is irreversible.</p>
                    <button 
                        onClick={handleClearData}
                        className="flex items-center gap-2 px-6 py-3 bg-destructive text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all cursor-not-allowed"
                    >
                        <Trash2 size={14} />
                        Clear All Data
                    </button>
                </div>
            </div>
        </section>
    );
};
