import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ReactNode } from "react";

const pageEase = [0.16, 1, 0.3, 1] as const;

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
            transition={{ duration: 0.6, ease: pageEase }}
            className={cn("sakura-app-shell relative w-full", className)}
        >
            <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <div className="absolute -top-24 left-[8%] h-64 w-64 rounded-full bg-primary/12 blur-3xl" />
                <div className="absolute top-[24%] right-[6%] h-64 w-64 rounded-full bg-[hsl(274_72%_72%_/_0.18)] blur-3xl" />
                <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            </div>
            <div className="relative z-10">{children}</div>
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
        <div className="sticky top-0 z-30 border-b border-border/85 bg-background/80">
            <div className="mx-auto max-w-7xl px-4 py-7 md:py-9">
                <div className="flex items-center justify-between gap-4">
                    <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: pageEase, delay: 0.1 }}
                        className="flex-1 flex items-start gap-6"
                    >
                        {Icon && (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/25 bg-accent">
                                <Icon className="h-5 w-5 text-primary" />
                            </div>
                        )}
                        <div className="space-y-2">
                            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-[0.95]">{title}</h1>
                            {subtitle && <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{subtitle}</p>}
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
            transition={{ duration: 0.8, ease: pageEase, delay: 0.2 }}
            className={cn("max-w-7xl mx-auto px-4 py-8 md:py-12", className)}
        >
            {children}
        </motion.div>
    );
}
