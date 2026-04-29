import React from 'react';
import { cn } from '../utils/cn';

interface SkeletonProps {
    className?: string;
    variant?: 'parchment' | 'default';
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, variant = 'parchment' }) => {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl",
                variant === 'parchment' 
                    ? "bg-[#F5E6D3]/60 dark:bg-[#2A1F23]/60" 
                    : "bg-muted/40",
                className
            )}
        >
            <div className={cn(
                "absolute inset-0",
                variant === 'parchment' ? "animate-parchment-pulse" : "animate-skeleton-shimmer"
            )} />
        </div>
    );
};
