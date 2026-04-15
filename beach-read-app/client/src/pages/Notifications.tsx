import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { Loader2, Bell, Info, RefreshCw, Mail, CheckCircle2, Zap, Award } from 'lucide-react';

const Notifications: React.FC = () => {
    const { notifications, loading, error, refreshNotifications, markAsRead, markAllAsRead } = useNotifications();

    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background pt-[64px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col items-center bg-background min-h-screen pb-[110px]">
            <div className="w-full max-w-[800px] px-[28px]">
                
                {/* Header */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between border-b border-border/40 pb-10 gap-6">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">Inbox Partition</p>
                        <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase leading-none">Notifications</h1>
                        <p className="text-xs text-muted-foreground mt-4 font-bold tracking-widest uppercase">{unreadCount} unread transmissions</p>
                    </div>
                    <div className="flex gap-3">
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-foreground/5 border border-border/40 text-[10px] font-black uppercase tracking-widest text-foreground hover:bg-foreground/10 transition-all"
                            >
                                <CheckCircle2 size={14} />
                                Clear All
                            </button>
                        )}
                        <button 
                            onClick={refreshNotifications}
                            className="p-3 rounded-2xl bg-muted/20 border border-border/40 text-muted-foreground hover:text-foreground transition-all hover:rotate-180 duration-500"
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </div>

                {error ? (
                    <div className="py-20 text-center border-2 border-dashed border-destructive/20 rounded-3xl bg-destructive/5">
                        <p className="text-destructive font-bold mb-2 uppercase tracking-widest text-xs">Transmission Error</p>
                        <p className="text-muted-foreground text-sm italic">{error}</p>
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="space-y-4">
                        {notifications.map((notification) => (
                            <div 
                                key={notification.id}
                                onClick={() => {
                                    if (!notification.read) void markAsRead(notification.id);
                                }}
                                className={`p-6 rounded-[24px] border transition-all flex items-start gap-6 group cursor-pointer ${
                                    notification.read 
                                        ? 'bg-muted/5 border-border/20 opacity-60 hover:opacity-100' 
                                        : 'bg-primary/5 border-primary/20 shadow-[0_10px_30px_rgba(var(--primary-rgb),0.05)]'
                                }`}
                            >
                                <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border ${
                                    notification.type === 'NEW_CHAPTER' 
                                        ? 'bg-primary/10 text-primary border-primary/20' 
                                        : notification.type === 'SYSTEM'
                                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                        : notification.type === 'SYNC_CONFLICT'
                                        ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                        : notification.type === 'MILESTONE'
                                        ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                                        : 'bg-foreground/5 text-foreground/40 border-foreground/10'
                                }`}>
                                    {notification.type === 'NEW_CHAPTER' && <Zap size={18} />}
                                    {notification.type === 'SYSTEM' && <Info size={18} />}
                                    {notification.type === 'SYNC_CONFLICT' && <RefreshCw size={18} />}
                                    {notification.type === 'MILESTONE' && <Award size={18} />}
                                    {(!['NEW_CHAPTER', 'SYSTEM', 'SYNC_CONFLICT', 'MILESTONE'].includes(notification.type)) && <Bell size={18} />}
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`text-sm font-black uppercase tracking-tight ${notification.read ? 'text-foreground/70' : 'text-foreground'}`}>
                                            {notification.title}
                                        </h3>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                                            {new Date(notification.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className={`text-xs leading-relaxed ${notification.read ? 'text-muted-foreground/80' : 'text-muted-foreground font-medium'}`}>
                                        {notification.message}
                                    </p>
                                </div>
                                {!notification.read && (
                                    <div className="shrink-0 pt-1">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center border-2 border-dashed border-border/50 rounded-[40px] bg-muted/5">
                        <div className="w-20 h-20 rounded-[32px] bg-muted flex items-center justify-center mb-8">
                            <Bell className="w-10 h-10 text-muted-foreground opacity-20" />
                        </div>
                        <h3 className="text-xl font-black text-foreground mb-2 uppercase tracking-tight">Quiet Partition</h3>
                        <p className="text-muted-foreground text-sm max-w-sm italic">
                            Your notification stream is currently empty. We'll alert you here when new chapters or system updates are available.
                        </p>
                    </div>
                )}

                <div className="mt-12 p-8 rounded-[32px] bg-foreground/5 border border-foreground/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Mail className="text-primary" />
                        <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Email Notifications</p>
                            <p className="text-xs text-muted-foreground font-medium">Get transmission fragments in your external inbox</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => window.location.href = '/settings'}
                        className="px-6 py-2.5 bg-foreground text-background text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:opacity-90 transition-all"
                    >
                        Manage Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
