import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="sakura-glass p-12 text-center max-w-sm w-full space-y-6 shadow-depth3 border-destructive/20 bg-destructive/5">
        <h1 className="text-7xl font-black tracking-tighter text-destructive uppercase leading-none">404</h1>
        <div className="space-y-1">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Sector Missing</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
                The requested data fragment does not exist in the current vault.
            </p>
        </div>
        <a 
            href="/" 
            className="sakura-ripple-button is-default inline-flex h-11 px-8 items-center justify-center font-black uppercase tracking-widest text-[10px]"
        >
          Reset to Hub
        </a>
      </div>
    </div>
  );
};

export default NotFound;
