import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../utils/cn';
import { BUTTON_FEEDBACK } from '../utils/motion-variants';

export interface PillProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
    active: boolean;
    accent?: 'dark' | 'warm';
}

export const Pill = ({
    active, onClick, children, accent = 'dark', className, ...props
}: PillProps) => (
    <motion.button
        onClick={onClick}
        {...BUTTON_FEEDBACK}
        whileHover={{ scale: 1.05, y: -2 }}
        className={cn(
            "px-4 py-2 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border cursor-pointer",
            active
                ? accent === 'warm'
                    ? 'bg-primary text-primary-foreground border-primary shadow-md'
                    : 'bg-foreground text-background border-foreground shadow-md'
                : 'bg-background text-muted-foreground border-border hover:border-muted-foreground/40 hover:text-foreground hover:bg-muted/30',
            className
        )}
        {...props}
    >
        {children}
    </motion.button>
);
Pill.displayName = 'Pill';
