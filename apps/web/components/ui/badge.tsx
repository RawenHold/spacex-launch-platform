import * as React from "react"

import { cn } from "@/lib/utils"

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger"
  | "info"

export function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & {
  variant?: BadgeVariant
}) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em]",
        {
          "border-primary bg-primary text-primary-foreground": variant === "default",
          "border-border bg-secondary text-secondary-foreground": variant === "secondary",
          "border-border text-foreground": variant === "outline",
          "border-signal-green/40 bg-signal-green/10 text-signal-green":
            variant === "success",
          "border-signal-amber/50 bg-signal-amber/10 text-signal-amber":
            variant === "warning",
          "border-signal-red/50 bg-signal-red/10 text-signal-red": variant === "danger",
          "border-signal-blue/45 bg-signal-blue/10 text-signal-blue": variant === "info",
        },
        className
      )}
      {...props}
    />
  )
}
