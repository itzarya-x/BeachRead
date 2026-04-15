import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ErrorStateProps {
    title?: string;
    message?: string;
    actionLabel?: string;
    actionHref?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
    title = 'Error', 
    message = 'We encountered an issue while accessing these records.',
    actionLabel = 'Return Home',
    actionHref = '/'
}) => (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-background p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive mb-6">
            <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">{title}</h2>
        <p className="text-muted-foreground text-sm mb-8 max-w-xs">{message}</p>
        <Link to={actionHref} className="px-10 py-3 bg-foreground text-background rounded-full font-black text-xs tracking-widest uppercase hover:opacity-90 transition-opacity">
            {actionLabel}
        </Link>
    </div>
);
