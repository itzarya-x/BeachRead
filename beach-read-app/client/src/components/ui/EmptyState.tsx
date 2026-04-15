import React from 'react';
import { Search } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
    title, 
    description, 
    icon = <Search size={32} className="opacity-30" />, 
    action 
}) => (
    <div className="py-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-border/50 rounded-[40px] bg-muted/5">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
            {icon}
        </div>
        <h3 className="text-xl font-black text-foreground mb-2 uppercase tracking-tight">{title}</h3>
        <p className="text-muted-foreground text-sm max-w-sm italic mb-8">{description}</p>
        {action}
    </div>
);
