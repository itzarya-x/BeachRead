import React from 'react';
import { cn } from '../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'outline' | 'secondary' | 'reading' | 'completed' | 'planning' | 'paused' | 'dropped' | 'warm' | 'success' | 'destructive' | 'warning';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
    return (
        <div
            className={cn(
                "status-badge transition-colors focus:outline-none",
                {
                    'bg-foreground text-background border-transparent': variant === 'default',
                    'bg-muted text-muted-foreground border-border/10': variant === 'secondary',
                    'border-border text-foreground': variant === 'outline',
                    'status-badge-info': variant === 'reading',
                    'status-badge-success': variant === 'completed' || variant === 'success',
                    'status-badge-error': variant === 'dropped' || variant === 'destructive',
                    'status-badge-warning': variant === 'paused' || variant === 'warning',
                    'bg-muted/40 text-neutral-400 border-border/20': variant === 'planning',
                    'bg-primary text-primary-foreground border-transparent': variant === 'warm',
                },
                className
            )}
            {...props}
        />
    );
}

export { Badge };
