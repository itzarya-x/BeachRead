import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../utils/cn';
import { BUTTON_FEEDBACK } from '../utils/motion-variants';
import { useSound } from '../hooks/useSound';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref' | 'as'> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'warm' | 'archival' | 'icon';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    as?: any;
    to?: string; // Support for Link
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', as, onClick, ...props }, ref) => {
        const Component = as ? motion(as) : motion.button;
        const { playSound } = useSound();

        const handleClick = (e: any) => {
            playSound('click');
            if (onClick) onClick(e);
        };
        
        return (
            <Component
                ref={ref}
                {...BUTTON_FEEDBACK}
                onClick={handleClick}
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-full text-[10px] font-bold uppercase tracking-widest ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 disabled:pointer-events-none disabled:opacity-50",
                    {
                        'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md': variant === 'primary' || variant === 'warm',
                        'bg-muted text-muted-foreground border border-border hover:bg-neutral-200 hover:text-foreground hover:border-neutral-300': variant === 'secondary' || variant === 'archival',
                        'border border-border bg-background text-foreground hover:bg-muted hover:border-muted-foreground/20': variant === 'outline',
                        'hover:bg-foreground/5 text-foreground/60 hover:text-foreground': variant === 'ghost',
                        'bg-transparent hover:bg-foreground/5 text-foreground/60 hover:text-foreground border-none': variant === 'icon',
                        'h-9 px-4': size === 'sm',
                        'h-11 px-6 py-2.5': size === 'md',
                        'h-14 px-10': size === 'lg',
                        'h-11 w-11 p-0': size === 'icon',
                    },
                    className
                )}
                {...props}
            />
        );
    }
);

Button.displayName = 'Button';
export { Button };
