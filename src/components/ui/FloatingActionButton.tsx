import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
    onClick: () => void;
    label?: string;
}

export function FloatingActionButton({ onClick, label = "Record New Entry" }: FloatingActionButtonProps) {
    return (
        <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-7 right-6 md:bottom-9 md:right-9 z-[60]"
        >
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        onClick={onClick}
                        className="group relative h-14 w-14 overflow-hidden rounded-2xl border border-primary/30 bg-primary px-0 text-primary-foreground shadow-sm transition-[width,padding,transform] duration-300 hover:w-[9.5rem] hover:px-4"
                        aria-label={label}
                    >
                        <Plus className="relative h-5 w-5 shrink-0 transition-transform duration-300 group-hover:rotate-90" strokeWidth={2.5} />
                        <span className="relative ml-1 max-w-0 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.12em] opacity-0 transition-all duration-300 group-hover:max-w-[120px] group-hover:opacity-100">
                            {label}
                        </span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="border border-border bg-card text-foreground shadow-sm">
                    {label}
                </TooltipContent>
            </Tooltip>
        </motion.div>
    );
}
