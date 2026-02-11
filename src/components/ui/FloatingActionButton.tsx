import { Button } from "@/components/ui/YuraButton";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
    onClick: () => void;
    label?: string;
}

export function FloatingActionButton({ onClick, label = "Add" }: FloatingActionButtonProps) {
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-8 right-8 z-40"
        >
            <Button
                onClick={onClick}
                variant="primary"
                className="h-14 w-14 md:h-16 md:w-16 rounded-full shadow-xl shadow-primary/20 p-0 flex items-center justify-center group"
                title={label}
            >
                <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
            </Button>
        </motion.div>
    );
}
