import { cn } from '../../utils/cn';

interface TabsProps {
    tabs: string[];
    activeTab: string;
    onTabChange: (tab: string) => void;
    className?: string;
}

export function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
    return (
        <div className={cn("inline-flex h-[40px] items-center justify-center bg-muted p-1 rounded-sm", className)}>
            {tabs.map((tab) => (
                <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={cn(
                        "inline-flex items-center justify-center whitespace-nowrap px-6 py-1.5 text-sm font-semibold transition-all focus-visible:outline-none border-b-2 border-transparent",
                        activeTab === tab
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                    )}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
}
