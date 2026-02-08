import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { DisplayUser } from "@/types/display";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface AboutCardProps {
    user: DisplayUser;
}

export function AboutCard({ user }: AboutCardProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!user.about) return null;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6">
            <Card className="border-l-2 border-l-primary/40 overflow-hidden">
                <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-foreground">About</span>
                            <span className="text-xs text-muted-foreground">
                                Member since{" "}
                                {new Date(user.createdAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    year: "numeric",
                                })}
                            </span>
                        </div>
                        <ChevronDown
                            className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                        />
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="border-t border-border/30 px-4 py-4 bg-background/50">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{user.about}</p>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
