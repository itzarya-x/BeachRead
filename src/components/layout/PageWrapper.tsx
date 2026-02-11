import { cn } from "@/lib/utils";
import ds from "@/styles/design-system";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageWrapperProps {
    children: ReactNode;
    className?: string;
}

export function PageWrapper({ children, className }: PageWrapperProps) {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: ds.motion.easing.default as any }}
            className={cn("w-full", className)}
        >
            {children}
        </motion.div>
    );
}

import { LucideIcon } from "lucide-react";

// ... existing code ...

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    action?: ReactNode;
    icon?: LucideIcon;
}

export function PageHeader({ title, subtitle, action, icon: Icon }: PageHeaderProps) {
    return (
        <div className="border-b border-border/20 bg-surface-1/50 backdrop-blur-sm sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
                <div className="flex items-center justify-between gap-4">
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: ds.motion.easing.default as any, delay: 0.1 }}
                        className="flex-1 flex items-start gap-6"
                    >
                        {Icon && (
                            <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                <Icon className="w-8 h-8 text-primary" />
                            </div>
                        )}
                        <div className="space-y-3">
                            <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter leading-[0.9]">{title}</h1>
                            {subtitle && <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground/40">{subtitle}</p>}
                        </div>
                    </motion.div>
                    {action && (
                        <motion.div 
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                            className="shrink-0"
                        >
                            {action}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface PageContentProps {
    children: ReactNode;
    className?: string;
}

export function PageContent({ children, className }: PageContentProps) {
    return (
        <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: ds.motion.easing.default as any, delay: 0.2 }}
            className={cn("max-w-7xl mx-auto px-4 py-8 md:py-12", className)}
        >
            {children}
        </motion.div>
    );
}
