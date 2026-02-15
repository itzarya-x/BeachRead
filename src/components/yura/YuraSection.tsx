import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface YuraSectionProps
  extends React.ComponentPropsWithoutRef<typeof Card> {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  contentClassName?: string
}

export const YuraSection = React.forwardRef<
  React.ElementRef<typeof Card>,
  YuraSectionProps
>(
  (
    { className, title, description, action, contentClassName, children, ...props },
    ref
  ) => (
    <Card ref={ref} className={cn("rounded-2xl", className)} {...props}>
      {(title || description || action) && (
        <CardHeader className="gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {title ? <CardTitle>{title}</CardTitle> : null}
            {description ? <CardDescription>{description}</CardDescription> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </CardHeader>
      )}
      <CardContent className={cn(!title && !description && !action && "pt-6", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
)

YuraSection.displayName = "YuraSection"
