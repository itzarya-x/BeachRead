import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ds from "@/styles/design-system";
import type { DisplayUser } from "@/types/display";
import { safeFormat } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Info } from "lucide-react";
import { useState } from "react";

interface AboutCardProps {
    user: DisplayUser;
}

export function AboutCard({ user }: AboutCardProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!user.about) return null;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-8">
            <Card className="border-none shadow-md bg-surface-1 overflow-hidden group">
                <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-5 hover:bg-surface-2 transition-all duration-300 group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Info className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-base font-bold text-foreground">Collector Notes</h3>
                                <p className="text-xs text-muted-foreground">
                                    Member since{" "}
                                    {safeFormat(user.createdAt, "MMMM yyyy")}
                                </p>
                            </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                            <ChevronDown
                                className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                            />
                        </div>
                    </button>
                </CollapsibleTrigger>
                <AnimatePresence>
                    {isOpen && (
                        <CollapsibleContent forceMount asChild>
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: ds.motion.duration.normal / 1000, ease: ds.motion.easing.default as any }}
                                className="border-t border-border/10 overflow-hidden"
                            >
                                <div className="px-6 py-5 bg-surface-1/50">
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium">{user.about}</p>
                                </div>
                            </motion.div>
                        </CollapsibleContent>
                    )}
                </AnimatePresence>
            </Card>
        </Collapsible>
    );
}
