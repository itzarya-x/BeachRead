import * as React from "react"

import { cn } from "../../utils/cn"
import { Card } from "../../ui/Card"

export interface YuraRowProps extends React.ComponentPropsWithoutRef<typeof Card> {
  compact?: boolean
}

export const YuraRow = React.forwardRef<
  React.ElementRef<typeof Card>,
  YuraRowProps
>(({ className, compact = false, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn(
      "flex w-full items-center justify-between gap-4 rounded-xl",
      compact ? "px-3 py-2" : "px-4 py-3",
      className
    )}
    {...props}
  />
))

YuraRow.displayName = "YuraRow"
