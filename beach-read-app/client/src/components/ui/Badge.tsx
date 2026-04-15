import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'outline' | 'secondary';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
    return (
        <div
            className={cn(
                "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                {
                    'bg-primary text-primary-foreground': variant === 'default',
                    'bg-muted text-muted-foreground': variant === 'secondary',
                    'border border-border text-foreground': variant === 'outline',
                },
                className
            )}
            {...props}
        />
    );
}

export { Badge };
