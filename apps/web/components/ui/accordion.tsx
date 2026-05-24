import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export function Accordion({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col", className)} {...props} />
}

export function AccordionItem({
  className,
  ...props
}: React.ComponentProps<"details">) {
  return (
    <details
      className={cn("group border-b border-border/70 py-2 last:border-b-0", className)}
      {...props}
    />
  )
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<"summary">) {
  return (
    <summary
      className={cn(
        "flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-sm font-semibold text-foreground marker:hidden focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground transition group-open:rotate-180"
      />
    </summary>
  )
}

export function AccordionContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("pb-4 text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  )
}
