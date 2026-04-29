import React from 'react';
import { motion } from 'framer-motion';
import { Wind } from 'lucide-react';
import { FADE_IN } from '../utils/motion-variants';
import { cn } from '../utils/cn';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
    title, 
    description, 
    icon = <Wind size={32} className="text-primary/40" />, 
    action,
    className
}) => (
    <motion.div 
        {...FADE_IN}
        className={cn(
            "py-24 px-8 flex flex-col items-center justify-center text-center rounded-[48px] bg-foreground/[0.02] border border-border/10 relative overflow-hidden",
            className
        )}
    >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-sakura-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 rounded-full bg-background border border-border/40 flex items-center justify-center mb-8 shadow-sm relative z-10">
            {icon}
        </div>
        
        <h3 className="text-2xl font-serif italic text-foreground mb-3 tracking-tight relative z-10">
            {title}
        </h3>
        
        <p className="text-muted-foreground text-[13px] font-bold uppercase tracking-[0.2em] max-w-sm mb-10 leading-relaxed opacity-60 relative z-10">
            {description}
        </p>
        
        {action && (
            <div className="relative z-10">
                {action}
            </div>
        )}

        <div className="mt-12 flex items-center gap-3 opacity-20">
            <div className="h-px w-8 bg-foreground" />
            <Wind size={12} />
            <div className="h-px w-8 bg-foreground" />
        </div>
    </motion.div>
);
