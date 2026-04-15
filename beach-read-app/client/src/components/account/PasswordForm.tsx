import React, { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../lib/supabaseClient';

export const PasswordForm: React.FC = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Passwords don't match");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            if (!isSupabaseConfigured()) {
                throw new Error('Supabase auth is not configured.');
            }

            const { error: reauthError } = await supabase!.auth.signInWithPassword({
                email: (await supabase!.auth.getUser()).data.user?.email || '',
                password: currentPassword,
            });
            if (reauthError) throw reauthError;

            const { error: updateError } = await supabase!.auth.updateUser({ password: newPassword });
            if (updateError) throw updateError;

            setSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="bg-muted/20 border border-border/40 rounded-[24px] p-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-8">Security Credentials</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Current Password</label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full h-[52px] bg-background border border-border/60 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50"
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full h-[52px] bg-background border border-border/60 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full h-[52px] bg-background border border-border/60 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50"
                            required
                        />
                    </div>
                </div>

                {error && <p className="text-xs text-destructive font-bold uppercase tracking-widest">{error}</p>}

                <div className="pt-4 flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 h-[48px] bg-foreground text-background font-black uppercase tracking-widest text-[10px] rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Lock size={16} />}
                        Update Password
                    </button>
                    {success && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Updated Successfully</span>
                    )}
                </div>
            </form>
        </section>
    );
};
