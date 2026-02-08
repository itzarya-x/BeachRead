import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
    onClick: () => void;
    label?: string;
}

export function FloatingActionButton({ onClick, label = "Add" }: FloatingActionButtonProps) {
    return (
        <Button
            onClick={onClick}
            size="lg"
            className="fixed bottom-8 right-8 rounded-full shadow-lg hover:shadow-xl h-14 w-14 md:h-16 md:w-16 gap-2 group animate-fade-in z-40"
            title={label}
        >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
        </Button>
    );
}
