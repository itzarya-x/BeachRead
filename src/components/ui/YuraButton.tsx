import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { HTMLMotionProps, motion } from "framer-motion";
import { Loader2, LucideIcon } from "lucide-react";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: LucideIcon;
    iconPosition?: "left" | "right";
    loading?: boolean;
    fullWidth?: boolean;
    asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = "primary",
            size = "md",
            icon: Icon,
            iconPosition = "left",
            loading = false,
            fullWidth = false,
            asChild = false,
            className,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        const Comp: any = asChild ? Slot : motion.button;
        const motionProps = asChild ? {} : {
            whileHover: { scale: disabled || loading ? 1 : 1.02 },
            whileTap: { scale: disabled || loading ? 1 : 0.98 }
        };

        const baseStyles = "inline-flex items-center justify-center gap-2 font-black uppercase tracking-[0.1em] rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

        const variants = {
            primary: "bg-primary text-primary-foreground shadow-depth2 hover:shadow-glow hover:bg-primary/90 active:scale-95",
            secondary: "bg-surface-elevated1 border border-white/5 text-foreground hover:bg-white/5 hover:border-primary/40 active:scale-95",
            ghost: "hover:bg-primary/10 text-primary active:scale-95",
            destructive: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 active:scale-95",
            outline: "border border-white/10 bg-transparent hover:border-primary/40 text-foreground active:scale-95",
        };

        const sizes = {
            sm: "px-4 py-2 text-[10px]",
            md: "px-6 py-3 text-xs",
            lg: "px-10 py-4 text-sm",
        };

        const iconSizes = {
            sm: "w-4 h-4",
            md: "w-4 h-4",
            lg: "w-5 h-5",
        };

        return (
            <Comp
                ref={ref}
                className={cn(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    fullWidth && "w-full",
                    className
                )}
                disabled={disabled || loading}
                {...motionProps}
                {...props}
            >
                {loading && <Loader2 className={cn(iconSizes[size], "animate-spin")} />}
                {!loading && Icon && iconPosition === "left" && <Icon className={iconSizes[size]} />}
                {children}
                {!loading && Icon && iconPosition === "right" && <Icon className={iconSizes[size]} />}
            </Comp>
        );
    }
);

Button.displayName = "Button";

interface IconButtonProps extends Omit<HTMLMotionProps<"button">, "size"> {
    icon: LucideIcon;
    variant?: ButtonVariant;
    size?: ButtonSize;
    label?: string;
    asChild?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ icon: Icon, variant = "ghost", size = "md", label, asChild = false, className, ...props }, ref) => {
        const Comp: any = asChild ? Slot : motion.button;
        const motionProps = asChild ? {} : {
            whileHover: { scale: 1.05 },
            whileTap: { scale: 0.95 }
        };

        const baseStyles = "inline-flex items-center justify-center rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

        const variants = {
            primary: "bg-primary text-primary-foreground hover:bg-primary/90",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            ghost: "hover:bg-secondary/50 text-foreground",
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            outline: "border border-border bg-transparent hover:bg-secondary/50 text-foreground",
        };

        const sizes = {
            sm: "w-8 h-8",
            md: "w-9 h-9",
            lg: "w-10 h-10",
        };

        const iconSizes = {
            sm: "w-4 h-4",
            md: "w-4 h-4",
            lg: "w-5 h-5",
        };

        return (
            <Comp
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                aria-label={label}
                title={label}
                {...motionProps}
                {...props}
            >
                <Icon className={iconSizes[size]} />
            </Comp>
        );
    }
);

IconButton.displayName = "IconButton";

interface ButtonGroupProps {
    children: React.ReactNode;
    className?: string;
}

export function ButtonGroup({ children, className }: ButtonGroupProps) {
    return (
        <div className={cn("inline-flex rounded-lg shadow-sm", className)} role="group">
            {children}
        </div>
    );
}
