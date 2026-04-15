import React from 'react';
import { Ghost, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-8 animate-bounce">
                <Ghost size={48} />
            </div>
            <h1 className="text-6xl font-black tracking-tighter mb-4 uppercase">404</h1>
            <h2 className="text-2xl font-black tracking-tight mb-4 uppercase">Page Not Found</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-10 italic">
                The requested page or title could not be located in our library.
            </p>
            <Link to="/" className="inline-flex items-center gap-3 px-10 py-4 bg-foreground text-background rounded-full font-black text-[11px] tracking-widest uppercase hover:opacity-90 transition-all active:scale-95">
                <ArrowLeft size={16} />
                Back to Surface
            </Link>
        </div>
    );
};

export default NotFound;
