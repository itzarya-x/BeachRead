import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

interface SettingRowProps {
    label: string;
    hint?: string;
    children: React.ReactNode;
}

export function SettingRow({ label, hint, children }: SettingRowProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 py-6 border-b border-border/10 last:border-b-0">
            <div className="shrink-0 sm:w-[200px]">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">{label}</p>
                {hint && <p className="text-[10px] text-muted-foreground mt-1 font-serif italic leading-relaxed max-w-[180px]">{hint}</p>}
            </div>
            <div className="flex-1 max-w-lg w-full">{children}</div>
        </div>
    );
}

interface FieldInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ElementType;
    mono?: boolean;
}

export function FieldInput({ className, icon: Icon, mono, ...props }: FieldInputProps) {
    return (
        <div className="relative">
            {Icon && <Icon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/80" aria-hidden="true" />}
            <input
                className={cn(
                    "w-full bg-foreground/[0.03] border border-border/60 rounded-2xl pr-5 h-12 text-sm text-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/60",
                    Icon ? 'pl-11' : 'pl-5',
                    mono ? 'font-mono' : 'font-serif italic',
                    className
                )}
                {...props}
            />
        </div>
    );
}

interface ToggleProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    label: string;
    hint?: string;
}

export function Toggle({ enabled, onChange, label, hint }: ToggleProps) {
    // Local state for optimistic updates
    const [optimisticEnabled, setOptimisticEnabled] = React.useState(enabled);
    
    // Sync with prop changes
    React.useEffect(() => {
        setOptimisticEnabled(enabled);
    }, [enabled]);

    const handleToggle = () => {
        const nextState = !optimisticEnabled;
        setOptimisticEnabled(nextState);
        onChange(nextState);
        
        // Haptic feedback if available
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    };

    return (
        <button
            type="button"
            role="switch"
            aria-checked={optimisticEnabled}
            aria-label={label}
            onClick={handleToggle}
            className={cn(
                "w-full flex items-center justify-between p-5 rounded-2xl border transition-all text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer shadow-sm",
                optimisticEnabled 
                    ? "bg-primary/10 border-primary/30 shadow-primary/5" 
                    : "bg-foreground/[0.02] border-border/40 hover:border-primary/20 hover:bg-foreground/[0.04]"
            )}
        >
            <div className="pr-4">
                <p className={cn(
                    "text-[11px] font-bold uppercase tracking-widest transition-colors",
                    optimisticEnabled ? "text-primary" : "text-foreground"
                )}>{label}</p>
                {hint && <p className="text-[10px] text-muted-foreground mt-0.5 font-serif italic leading-relaxed">{hint}</p>}
            </div>
            <div className={cn(
                "w-12 h-6.5 rounded-full relative transition-all shrink-0 border border-transparent",
                optimisticEnabled ? "bg-primary shadow-inner" : "bg-muted shadow-inner border-border/50"
            )}>
                <motion.div 
                    layout
                    initial={false}
                    animate={{ x: optimisticEnabled ? 22 : 2 }}
                    transition={{ type: "spring", stiffness: 700, damping: 35 }}
                    className="absolute top-1 w-4.5 h-4.5 bg-white rounded-full shadow-md"
                />
            </div>
        </button>
    );
}
