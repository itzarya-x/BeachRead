import React from 'react';
import { Trash2, Download } from 'lucide-react';
import { useToast } from '../../../app/providers/ToastContext';
import { Surface } from '../../../shared/ui/Surface';
import { Button } from '../../../shared/ui/Button';

export const PrivacyPanel: React.FC = () => {
    const { showToast } = useToast();

    const handleExport = () => {
        showToast('Data export functionality is currently being migrated to the new backend. Please check back later.', 'info');
    };

    const handleClearData = () => {
        showToast('Clear data functionality is currently being migrated to the new backend. Please use the account settings in Supabase dashboard or contact support.', 'info');
    };

    return (
        <Surface variant="paper" className="space-y-12">
            <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8">Data & Portability</h2>
                <Surface variant="muted" className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-6 opacity-60">
                    <div>
                        <h3 className="text-sm font-bold text-foreground">Export Data</h3>
                        <p className="text-xs text-muted-foreground mt-1">Download a complete copy of your library and reading data.</p>
                    </div>
                    <Button
                        onClick={handleExport}
                        variant="outline"
                        size="sm"
                        className="cursor-not-allowed opacity-50"
                        aria-label="Request data export (currently unavailable)"
                    >
                        <Download size={14} className="mr-2" />
                        Request Export
                    </Button>
                </Surface>
                <p className="text-[10px] text-primary mt-4 font-bold uppercase tracking-widest italic opacity-60">Unavailable during migration</p>
            </div>

            <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-8">Danger Zone</h2>
                <Surface variant="none" className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl opacity-60">
                    <h3 className="text-sm font-bold text-red-500">Delete My Data</h3>
                    <p className="text-xs text-muted-foreground mt-1 mb-6">Permanently delete your entire history and account profile. This action is irreversible.</p>
                    <Button
                        onClick={handleClearData}
                        variant="archival"
                        size="sm"
                        className="bg-red-500 border-red-500 cursor-not-allowed opacity-50"
                        aria-label="Delete all data (currently unavailable)"
                    >
                        <Trash2 size={14} className="mr-2" />
                        Clear All Data
                    </Button>
                </Surface>
            </div>
        </Surface>
    );
};
