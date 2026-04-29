import { useState, useEffect } from 'react';
import { supabase } from '../../../shared/api/supabaseClient';

export function useReleaseAlertsPolling(userId?: string) {
    const [syncJobs, setSyncJobs] = useState<any[]>([]);
    const [releaseAlerts, setReleaseAlerts] = useState<any[]>([]);

    useEffect(() => {
        if (!userId || !supabase) return;

        let releaseAlertsUnavailable = false;

        const fetchData = async () => {
            const { data: jobs } = await supabase!
                .from('sync_jobs')
                .select('id, provider, job_type, status, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1);
            if (jobs) setSyncJobs(jobs);

            if (!releaseAlertsUnavailable) {
                const { data: alerts, error: alertsError } = await supabase!
                    .from('notifications')
                    .select('id, reference_id, type, title, body, read_at, created_at')
                    .eq('user_id', userId)
                    .eq('type', 'NEW_RELEASE')
                    .is('read_at', null)
                    .order('created_at', { ascending: false })
                    .limit(3);
                if (alertsError) {
                    console.warn('[useReleaseAlertsPolling] Notifications unavailable:', alertsError.message);
                    releaseAlertsUnavailable = true;
                    setReleaseAlerts([]);
                } else if (alerts) {
                    setReleaseAlerts(alerts);
                }
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    return { syncJobs, releaseAlerts };
}
