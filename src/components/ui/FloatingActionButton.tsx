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
            whileHover={{ scale: 1.1, y: -4 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-10 right-10 z-[60]"
        >
            <button
                onClick={onClick}
                className="group relative h-20 w-20 rounded-[2rem] bg-primary text-primary-foreground shadow-[0_20px_40px_rgba(56,189,248,0.4)] flex items-center justify-center transition-all duration-300 overflow-hidden"
                title={label}
            >
                {/* Ripple Effect Background */}
                <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-full blur-2xl" />
                
                <Plus className="relative w-10 h-10 group-hover:rotate-90 transition-transform duration-500 ease-out" strokeWidth={3} />
                
                {/* Subtle Ring */}
                <div className="absolute inset-0 border-2 border-white/20 rounded-[2rem] m-1" />
            </button>
        </motion.div>
    );
}
