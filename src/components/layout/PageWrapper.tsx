import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageWrapperProps {
    children: ReactNode;
    className?: string;
}

export function PageWrapper({ children, className }: PageWrapperProps) {
    return <div className={cn("w-full", className)}>{children}</div>;
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    action?: ReactNode;
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
    return (
        <div className="border-b border-border/20 bg-surface-1/50 backdrop-blur-sm sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-3xl md:text-4xl font-bold text-foreground">{title}</h1>
                        {subtitle && <p className="text-sm md:text-base text-muted-foreground mt-1">{subtitle}</p>}
                    </div>
                    {action && <div className="shrink-0">{action}</div>}
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
    return <div className={cn("max-w-7xl mx-auto px-4 py-8 md:py-12", className)}>{children}</div>;
}
