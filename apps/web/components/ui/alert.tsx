import * as React from "react"

import { cn } from "@/lib/utils"

export function Alert({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-lg border border-signal-amber/40 bg-signal-amber/10 p-4 text-sm leading-6 text-signal-amber",
        className
      )}
      {...props}
    />
  )
}
