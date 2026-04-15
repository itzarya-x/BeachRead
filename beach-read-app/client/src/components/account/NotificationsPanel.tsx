import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/auth-context';
import { Loader2, RefreshCw, Save } from 'lucide-react';
import type { User } from '../../lib/types';
import { supabase } from '../../lib/supabaseClient';

type SyncJobLog = {
    id: string;
    provider: 'anilist' | 'mal';
    direction: 'import' | 'pull' | 'push' | 'export';
    status: 'pending' | 'running' | 'completed' | 'failed';
    items_processed: number;
    items_total: number;
    error_message: string | null;
    created_at: string;
    finished_at: string | null;
};

type LocalLog = {
    id: string;
    title: string;
    details: string;
    tone: 'ok' | 'error' | 'info';
    timestamp: string;
};

function formatTimestamp(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function toDirectionLabel(direction: SyncJobLog['direction']) {
    if (direction === 'import') return 'Initial Import';
    if (direction === 'pull') return 'Pull Changes';
    if (direction === 'push') return 'Push Changes';
    return 'Full Export';
}

function toProviderLabel(provider: SyncJobLog['provider']) {
    return provider.toUpperCase();
}

export const NotificationsPanel: React.FC = () => {
    const { user, updateUser } = useAuth();
    // Use user metadata for notifications preference
    const [notifications, setNotifications] = useState(user?.preferences?.notifications ?? true);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [logLoading, setLogLoading] = useState(false);
    const [logsError, setLogsError] = useState<string | null>(null);
    const [logs, setLogs] = useState<LocalLog[]>([]);

    const loadLogs = useCallback(async () => {
        if (!supabase || !user) {
            setLogs([]);
            return;
        }

        setLogLoading(true);
        setLogsError(null);
        try {
            const { data, error } = await supabase
                .from('external_sync_jobs')
                .select('id,provider,direction,status,items_processed,items_total,error_message,created_at,finished_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(12);

            if (error) throw error;

            const mapped = ((data as SyncJobLog[]) || []).map((job) => {
                const isSuccess = job.status === 'completed';
                const isError = job.status === 'failed';
                const processed = `${job.items_processed || 0}/${job.items_total || 0}`;
                const baseDetails = `${toProviderLabel(job.provider)} • ${toDirectionLabel(job.direction)} • ${processed} items`;
                const detail = isError
                    ? `${baseDetails} • ${job.error_message || 'Unknown sync error'}`
                    : isSuccess
                        ? `${baseDetails} • Sync completed`
                        : `${baseDetails} • ${job.status}`;

                return {
                    id: job.id,
                    title: isError ? 'Sync Failed' : isSuccess ? 'Sync Completed' : 'Sync In Progress',
                    details: detail,
                    tone: isError ? 'error' : isSuccess ? 'ok' : 'info',
                    timestamp: job.finished_at || job.created_at,
                } as LocalLog;
            });

            setLogs(mapped);
        } catch (err: unknown) {
            console.error('Failed to load update logs:', err);
            setLogsError(err instanceof Error ? err.message : 'Failed to load logs');
        } finally {
            setLogLoading(false);
        }
    }, [user]);

    useEffect(() => {
        setNotifications(user?.preferences?.notifications ?? true);
    }, [user?.preferences?.notifications]);

    useEffect(() => {
        void loadLogs();
    }, [loadLogs]);

    const handleSave = async () => {
        setLoading(true);
        setSuccess(false);
        try {
            // Update via Supabase user metadata
            await updateUser({ 
                preferences: {
                    ...user?.preferences,
                    theme: user?.preferences?.theme || 'dark',
                    language: user?.preferences?.language || 'en',
                    notifications 
                }
            } as Partial<User>);
            setSuccess(true);
            const now = new Date().toISOString();
            setLogs((prev) => ([
                {
                    id: `pref-${now}`,
                    title: 'Notification Preference Updated',
                    details: `Email notifications ${notifications ? 'enabled' : 'disabled'}.`,
                    tone: 'ok' as const,
                    timestamp: now,
                },
                ...prev,
            ]).slice(0, 12));
        } catch (err: unknown) {
            console.error('Failed to update notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="bg-muted/20 border border-border/40 rounded-[24px] p-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8">Notification Preferences</h2>
            
            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-background border border-border/60 rounded-xl">
                    <div>
                        <h3 className="text-sm font-bold text-foreground">Email Notifications</h3>
                        <p className="text-xs text-muted-foreground mt-1">Receive updates about new chapters and site news</p>
                    </div>
                    <button 
                        onClick={() => setNotifications(!notifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notifications ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className="pt-4 flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-8 h-[48px] bg-foreground text-background font-black uppercase tracking-widest text-[10px] rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Save Preferences
                    </button>
                    {success && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Updated Successfully</span>
                    )}
                </div>
            </div>

            <div className="mt-10 border-t border-border/40 pt-8">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Recent Update Logs</h3>
                    <button
                        onClick={() => void loadLogs()}
                        disabled={logLoading}
                        className="inline-flex h-[36px] items-center justify-center gap-2 rounded-lg border border-border/60 px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
                    >
                        {logLoading ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                        Refresh
                    </button>
                </div>

                {logsError ? (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs font-bold text-destructive">
                        {logsError}
                    </div>
                ) : null}

                {!logsError && logs.length === 0 && !logLoading ? (
                    <div className="rounded-xl border border-border/40 bg-background px-4 py-3 text-xs text-muted-foreground">
                        No updates logged yet.
                    </div>
                ) : null}

                <div className="space-y-3">
                    {logs.map((log) => (
                        <div key={log.id} className="rounded-xl border border-border/40 bg-background px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                                <p className={`text-xs font-black uppercase tracking-wider ${
                                    log.tone === 'error'
                                        ? 'text-destructive'
                                        : log.tone === 'ok'
                                            ? 'text-primary'
                                            : 'text-foreground'
                                }`}>
                                    {log.title}
                                </p>
                                <span className="shrink-0 text-[10px] font-bold text-muted-foreground">
                                    {formatTimestamp(log.timestamp)}
                                </span>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">{log.details}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
