import React, { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../utils/cn';

export interface SurfaceProps extends HTMLMotionProps<'div'> {
    as?: any;
    variant?: 'paper' | 'glass' | 'muted' | 'outline' | 'none';
    atmospheric?: boolean;
    withPadding?: boolean;
}

/**
 * Surface Component
 * A foundational layout component that provides themed backgrounds, 
 * textures, and effects like glassmorphism.
 */
const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
    ({ as: Component = motion.div, className, variant = 'paper', atmospheric = false, withPadding = true, children, ...props }, ref) => {
        return (
            <Component
                ref={ref}
                className={cn(
                    "relative overflow-hidden transition-all duration-500 will-change-[backdrop-filter,background-color,border-color]",
                    {
                        // Paper variant: Subtle texture and solid-ish background
                        'bg-card shadow-sm border border-border/40 rounded-3xl': variant === 'paper',
                        
                        // Glass variant: High transparency and blur
                        'bg-muted/30 backdrop-blur-3xl border border-border/10 shadow-lg rounded-3xl': variant === 'glass',
                        
                        // Muted variant: Low contrast, soft background
                        'bg-muted/40 backdrop-blur-lg border border-border/20 rounded-2xl': variant === 'muted',
                        
                        // Outline variant: Just a border
                        'border border-border/60 backdrop-blur-sm rounded-3xl': variant === 'outline',
                        
                        // Atmospheric modifier: adds more depth and responsive blur
                        'backdrop-blur-3xl bg-background/50 border-foreground/5 shadow-diffuse': atmospheric,

                        'p-6 md:p-8': withPadding && variant !== 'none',
                    },
                    className
                )}
                {...props}
            >
                {/* Texture Overlay for Paper variant */}
                {variant === 'paper' && (
                    <div className="absolute inset-0 z-[0] pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
                )}
                
                {/* Content */}
                <div className="relative z-[1]">
                    {children as React.ReactNode}
                </div>

            </Component>
        );
    }
);

Surface.displayName = 'Surface';

export { Surface };
