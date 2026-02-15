import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SakuraButton({ className, ...props }: ButtonProps) {
    return <Button className={cn("rounded-[var(--radius-md)]", className)} {...props} />;
}
