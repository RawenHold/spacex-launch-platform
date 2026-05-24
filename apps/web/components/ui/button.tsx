import * as React from "react"

import { cn } from "@/lib/utils"

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "link" | "danger"
type ButtonSize = "default" | "sm" | "lg" | "icon"

export function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
} = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold uppercase tracking-[0.12em] transition outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_[data-icon]]:pointer-events-none [&_[data-icon]]:size-4 [&_[data-icon]]:shrink-0",
    {
      "border border-primary bg-primary text-primary-foreground hover:bg-primary/85":
        variant === "default",
      "border border-border bg-secondary text-secondary-foreground hover:bg-accent":
        variant === "secondary",
      "border border-border bg-background/20 text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground":
        variant === "outline",
      "text-foreground hover:bg-accent": variant === "ghost",
      "text-foreground underline-offset-4 hover:underline": variant === "link",
      "border border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/85":
        variant === "danger",
    },
    {
      "h-10 px-5 py-2": size === "default",
      "h-9 px-4 text-xs": size === "sm",
      "h-12 px-7": size === "lg",
      "size-10 p-0": size === "icon",
    },
    className
  )
}

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}) {
  return (
    <button
      data-slot="button"
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  )
}
