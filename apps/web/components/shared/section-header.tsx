import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  actionLabel,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  href?: string
  actionLabel?: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="flex max-w-3xl flex-col gap-3">
        {eyebrow ? <p className="mission-eyebrow">{eyebrow}</p> : null}
        <h2 className="text-3xl font-black uppercase tracking-[0.08em] text-foreground sm:text-4xl">
          {title}
        </h2>
        {description ? <p className="text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {href && actionLabel ? (
        <Link className={buttonVariants({ variant: "outline", size: "sm" })} href={href}>
          {actionLabel}
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
      ) : null}
    </div>
  )
}
