import React, { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isSupabaseConfigured, supabase } from '../../../shared/api/supabaseClient';
import { Surface } from '../../../shared/ui/Surface';
import { Button } from '../../../shared/ui/Button';

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
        <Surface variant="paper" className="space-y-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Security Credentials</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Current Password</label>
                    <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full h-[52px] bg-muted/10 border border-border/60 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-mono"
                        required
                        placeholder="••••••••"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full h-[52px] bg-muted/10 border border-border/60 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-mono"
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full h-[52px] bg-muted/10 border border-border/60 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50 transition-all font-mono"
                            required
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.p 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-[10px] text-red-500 font-bold uppercase tracking-widest"
                        >
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>

                <div className="pt-4 flex items-center gap-6">
                    <Button
                        type="submit"
                        disabled={loading}
                        variant="primary"
                        size="md"
                        className="px-10"
                        aria-label="Submit password update"
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Lock size={16} className="mr-2" />}
                        Update Password
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
            </form>
        </Surface>
    );
};
