/**
 * Toast Notification System
 * Provides visual feedback for user actions
 */

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { createContext, ReactNode, useCallback, useContext, useState } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within ToastProvider");
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).substring(7);
        const newToast: Toast = { id, message, type };
        
        setToasts((prev) => [...prev, newToast]);

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            
            {/* Toast Container */}
            <div className="fixed left-1/2 top-4 z-[100] flex w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 flex-col gap-2 pointer-events-none sm:left-auto sm:right-4 sm:top-auto sm:w-auto sm:translate-x-0 sm:bottom-4">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 50, scale: 0.3 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                            className="pointer-events-auto"
                        >
                            <ToastItem toast={toast} onDismiss={dismissToast} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
    const icons = {
        success: <CheckCircle2 className="h-5 w-5 text-[hsl(152_72%_64%)]" />,
        error: <AlertCircle className="h-5 w-5 text-[hsl(0_82%_72%)]" />,
        info: <Info className="h-5 w-5 text-[hsl(340_75%_76%)]" />,
        warning: <AlertCircle className="h-5 w-5 text-[hsl(42_92%_70%)]" />,
    };

    const bgColors = {
        success: "border-[hsl(152_72%_64%_/_0.35)] bg-[hsl(152_52%_16%_/_0.48)]",
        error: "border-[hsl(0_82%_72%_/_0.35)] bg-[hsl(0_64%_18%_/_0.5)]",
        info: "border-[hsl(340_65%_58%_/_0.34)] bg-[hsl(320_38%_18%_/_0.5)]",
        warning: "border-[hsl(42_92%_70%_/_0.35)] bg-[hsl(38_64%_20%_/_0.48)]",
    };

    return (
        <motion.div
            layout
            className={`flex min-w-[300px] max-w-md items-center gap-3 rounded-xl border px-4 py-3 backdrop-blur-[18px] shadow-[0_16px_28px_-20px_rgba(0,0,0,0.9)] ${bgColors[toast.type]}`}
        >
            {icons[toast.type]}
            <p className="flex-1 text-sm font-medium text-[hsl(300_28%_92%)]">{toast.message}</p>
            <button
                onClick={() => onDismiss(toast.id)}
                className="rounded-lg p-1 transition-colors hover:bg-white/10"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}
