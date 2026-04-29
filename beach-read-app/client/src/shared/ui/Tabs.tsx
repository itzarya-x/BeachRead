import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { BUTTON_FEEDBACK } from '../utils/motion-variants';
import { useSound } from '../hooks/useSound';

interface TabsProps {
    tabs: { id: string; label: string }[] | string[];
    activeTab: string;
    onTabChange: (tab: string) => void;
    className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
    const { playSound } = useSound();
    const normalizedTabs = typeof tabs[0] === 'string' 
        ? (tabs as string[]).map(t => ({ id: t, label: t })) 
        : (tabs as { id: string; label: string }[]);

    return (
        <div className={cn("flex items-center gap-8 border-b border-border/20 pt-6 pb-0", className)}>
            {normalizedTabs.map((tab) => (
                <motion.button
                    key={tab.id}
                    onClick={() => {
                        playSound('tab');
                        onTabChange(tab.id);
                    }}
                    {...BUTTON_FEEDBACK}
                    className={cn(
                        "pb-4 text-[11px] font-bold uppercase tracking-widest transition-colors relative whitespace-nowrap",
                        activeTab === tab.id
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground/80"
                    )}
                >
                    {tab.label}
                    {activeTab === tab.id && (
                        <motion.div 
                            layoutId="activeTab"
                            className="absolute bottom-[1px] left-0 w-full h-[3px] rounded-full overflow-hidden" 
                        >
                            <svg preserveAspectRatio="none" viewBox="0 0 100 10" width="100%" height="100%">
                                <path d="M0,5 Q25,2 50,7 T100,5" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-primary opacity-80" strokeLinecap="round" />
                            </svg>
                        </motion.div>
                    )}
                </motion.button>
            ))}
        </div>
    );
}
