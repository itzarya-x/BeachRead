import * as React from "react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

type YuraCardTone = "default" | "elevated" | "muted"

export interface YuraCardProps
  extends React.ComponentPropsWithoutRef<typeof Card> {
  tone?: YuraCardTone
  interactive?: boolean
}

const toneClasses: Record<YuraCardTone, string> = {
  default: "",
  elevated: "border-border/60 shadow-md",
  muted: "bg-muted/30",
}

export const YuraCard = React.forwardRef<
  React.ElementRef<typeof Card>,
  YuraCardProps
>(({ className, tone = "default", interactive = false, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn(
      "rounded-2xl",
      toneClasses[tone],
      interactive && "transition-colors hover:bg-muted/40",
      className
    )}
    {...props}
  />
))

YuraCard.displayName = "YuraCard"
