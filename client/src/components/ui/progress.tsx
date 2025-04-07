import * as React from "react"

import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: number
    max?: number
    color?: string
  }
>(({ className, value, max = 100, color, ...props }, ref) => {
  const percentage = value != null ? Math.min(Math.max(0, value), max) / max * 100 : 0

  return (
    <div
      ref={ref}
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-neutral-200", className)}
      {...props}
    >
      <div
        className={cn("h-full w-full flex-1 bg-primary transition-all", color)}
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </div>
  )
})
Progress.displayName = "Progress"

export { Progress }
