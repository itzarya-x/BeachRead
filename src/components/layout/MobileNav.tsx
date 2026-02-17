import { MOBILE_NAV_ITEMS } from "@/components/layout/nav-config";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

export function MobileNav() {
    const location = useLocation();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 block md:hidden">
            {/* Safe Area Spacer for iOS/Android */}
            <div className="bg-gradient-to-t from-background via-background/95 to-transparent h-20 absolute inset-x-0 bottom-0 pointer-events-none" />
            
            <nav className="relative mx-4 mb-4 h-16 rounded-2xl border border-white/10 bg-card/80 backdrop-blur-xl shadow-depth3 flex items-center justify-around px-2">
                {MOBILE_NAV_ITEMS.map((tab) => {
                    const isActive = tab.path === "/" 
                        ? location.pathname === "/" 
                        : location.pathname.startsWith(tab.path);

                    return (
                        <Link
                            key={tab.path}
                            to={tab.path}
                            aria-current={isActive ? "page" : undefined}
                            className="relative flex flex-col items-center justify-center w-14 h-12 gap-1 transition-all active:scale-90"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-tab-active"
                                    className="absolute -top-2 h-1 w-6 rounded-full bg-primary"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            
                            <tab.icon className={cn(
                                "h-5 w-5 transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )} />
                            
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}>
                                {tab.mobileLabel ?? tab.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
            
            {/* Padding for env(safe-area-inset-bottom) */}
            <div className="h-[env(safe-area-inset-bottom)] bg-card/80" />
        </div>
    );
}
