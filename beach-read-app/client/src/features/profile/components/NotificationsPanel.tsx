import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../auth/context/auth-context';
import { Loader2, RefreshCw, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { User } from '../../../shared/types/types';
import { supabase } from '../../../shared/api/supabaseClient';
import { Surface } from '../../../shared/ui/Surface';
import { Button } from '../../../shared/ui/Button';

type SyncJobLog = {
    id: string;
    provider: 'ANILIST' | 'MAL';
    job_type: 'INITIAL_IMPORT' | 'INCREMENTAL_PULL' | 'INCREMENTAL_PUSH' | 'FULL_RECONCILIATION';
    status: 'PENDING' | 'RUNNING' | 'AWAITING_CONFLICT_RESOLUTION' | 'RETRYABLE_FAILURE' | 'FAILED' | 'COMPLETED' | 'CANCELLED';
    result_summary: {
        imported?: number;
        conflicts?: number;
        remoteCount?: number;
        pushed?: number;
        skipped?: number;
    } | null;
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

function toDirectionLabel(jobType: SyncJobLog['job_type']) {
    if (jobType === 'INITIAL_IMPORT') return 'Initial Import';
    if (jobType === 'INCREMENTAL_PULL') return 'Pull Changes';
    if (jobType === 'INCREMENTAL_PUSH') return 'Push Changes';
    return 'Full Refresh';
}

function toProviderLabel(provider: SyncJobLog['provider']) {
    return provider.toUpperCase();
}

function summarizeJob(job: SyncJobLog) {
    const summary = job.result_summary || {};

    if (job.job_type === 'INCREMENTAL_PUSH') {
        const pushed = Number(summary.pushed || 0);
        const skipped = Number(summary.skipped || 0);
        return `${pushed}/${pushed + skipped} items`;
    }

    const imported = Number(summary.imported || 0);
    const conflicts = Number(summary.conflicts || 0);
    const remoteCount = Number(summary.remoteCount || 0);
    const processed = imported + conflicts;
    const total = remoteCount || processed;
    return `${processed}/${total} items`;
}

export const NotificationsPanel: React.FC = () => {
    const { user, updateUser } = useAuth();
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
                .from('sync_jobs')
                .select('id,provider,job_type,status,result_summary,error_message,created_at,finished_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(12);

            if (error) throw error;

            const mapped = ((data as SyncJobLog[]) || []).map((job) => {
                const isSuccess = job.status === 'COMPLETED';
                const isConflict = job.status === 'AWAITING_CONFLICT_RESOLUTION';
                const isError = job.status === 'FAILED' || job.status === 'CANCELLED';
                const processed = summarizeJob(job);
                const baseDetails = `${toProviderLabel(job.provider)} • ${toDirectionLabel(job.job_type)} • ${processed}`;
                const detail = isError
                    ? `${baseDetails} • ${job.error_message || 'Sync failed'}`
                    : isConflict
                        ? `${baseDetails} • Resolve conflicts before the next sync`
                        : isSuccess
                            ? `${baseDetails} • Sync completed`
                            : `${baseDetails} • ${job.status.toLowerCase().replace(/_/g, ' ')}`;

                return {
                    id: job.id,
                    title: isError ? 'Sync Failed' : isConflict ? 'Sync conflict detected' : isSuccess ? 'Sync Completed' : 'Sync In Progress',
                    details: detail,
                    tone: isError || isConflict ? 'error' : isSuccess ? 'ok' : 'info',
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
        <Surface variant="paper" className="space-y-10">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Notification Preferences</h2>
            
            <div className="space-y-6">
                <Surface variant="muted" className="flex items-center justify-between p-6">
                    <div className="text-left">
                        <h3 className="text-sm font-bold text-foreground">Email Notifications</h3>
                        <p className="text-xs text-muted-foreground mt-1">Receive updates about new chapters and site news</p>
                    </div>
                    <button 
                        onClick={() => setNotifications(!notifications)}
                        aria-label="Toggle email notifications"
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notifications ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    >
                        <motion.span 
                            animate={{ x: notifications ? 24 : 4 }}
                            className="inline-block h-4 w-4 rounded-full bg-white shadow-sm" 
                        />
                    </button>
                </Surface>

                <div className="pt-4 flex items-center gap-6">
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        variant="primary"
                        size="md"
                        className="px-10"
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
                        Save Preferences
                    </Button>
                    {success && (
                        <motion.span 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-[10px] font-black uppercase tracking-widest text-primary"
                        >
                            Updated Successfully
                        </motion.span>
                    )}
                </div>
            </div>

            <div className="mt-12 border-t border-border/20 pt-10">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Recent Update Logs</h3>
                    <button
                        onClick={() => void loadLogs()}
                        disabled={logLoading}
                        aria-label="Refresh activity logs"
                        className="inline-flex h-[36px] items-center justify-center gap-2 rounded-xl border border-border/40 bg-muted/10 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-all hover:text-foreground active:scale-95 disabled:opacity-60"
                    >
                        <RefreshCw size={14} className={logLoading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {logsError ? (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-xs font-bold text-red-500"
                        >
                            {logsError}
                        </motion.div>
                    ) : logs.length === 0 && !logLoading ? (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="rounded-2xl border border-border/40 bg-muted/5 p-6 text-xs text-muted-foreground italic font-serif"
                        >
                            No updates logged yet.
                        </motion.div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="space-y-3"
                        >
                            {logs.map((log, idx) => (
                                <motion.div 
                                    key={log.id} 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                >
                                    <Surface variant="muted" className="p-5 text-left transition-all hover:border-primary/20">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className={`text-xs font-black uppercase tracking-wider ${
                                                log.tone === 'error'
                                                    ? 'text-red-500'
                                                    : log.tone === 'ok'
                                                        ? 'text-primary'
                                                        : 'text-foreground'
                                            }`}>
                                                {log.title}
                                            </p>
                                            <span className="shrink-0 text-[10px] font-bold text-muted-foreground/60 font-mono">
                                                {formatTimestamp(log.timestamp)}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground/80 leading-relaxed">{log.details}</p>
                                    </Surface>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Surface>
    );
};
