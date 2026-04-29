import React from 'react';
import { Loader2 } from 'lucide-react';

interface PageLoaderProps {
    message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading...' }) => (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{message}</p>
        </div>
    </div>
);
