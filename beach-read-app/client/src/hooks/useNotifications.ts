import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ApiError, apiClient } from '../lib/apiClient';
import type { Notification } from '../lib/types';

interface NotificationRow {
    id: string;
    type: 'NEW_RELEASE' | 'SYNC_CONFLICT' | 'MILESTONE' | 'FOLLOWED_TITLE_UPDATE' | 'SYSTEM';
    title: string;
    body: string;
    payload: Record<string, any>;
    read_at: string | null;
    created_at: string;
}

let notificationsEndpointUnavailable = false;
let notificationsFetchInFlight = false;

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchNotifications = useCallback(async () => {
        if (!supabase) {
            setLoading(false);
            return;
        }
        if (notificationsEndpointUnavailable) {
            setNotifications([]);
            setLoading(false);
            setError(null);
            return;
        }
        if (notificationsFetchInFlight) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        notificationsFetchInFlight = true;
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                setNotifications([]);
                return;
            }

            const data = await apiClient.get<NotificationRow[]>('/v1/notifications', {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            const mapped: Notification[] = (data || []).map((row) => ({
                id: row.id,
                type: row.type === 'NEW_RELEASE'
                    ? 'NEW_CHAPTER'
                    : row.type === 'SYNC_CONFLICT'
                        ? 'SYNC_CONFLICT'
                        : row.type === 'MILESTONE'
                            ? 'MILESTONE'
                            : 'SYSTEM',
                title: row.title || 'Notification',
                message: row.body || '',
                timestamp: row.created_at,
                read: !!row.read_at,
                mediaId: row.payload?.titleId ? String(row.payload.titleId) : undefined
            }));

            setNotifications(mapped);
        } catch (err: unknown) {
            if (err instanceof ApiError && err.status === 404) {
                notificationsEndpointUnavailable = true;
                setNotifications([]);
                setError(null);
                return;
            }

            console.error('Fetch notifications error:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
        } finally {
            notificationsFetchInFlight = false;
            setLoading(false);
        }
    }, []);

    const markAsRead = async (id: string) => {
        if (!supabase) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            await apiClient.post('/v1/notifications/read', { ids: [id] }, {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (err) {
            console.error('Mark as read error:', err);
        }
    };

    const markAllAsRead = async () => {
        if (!supabase) return;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return;

            await apiClient.post('/v1/notifications/read-all', undefined, {
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error('Mark all as read error:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return {
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications
    };
};
