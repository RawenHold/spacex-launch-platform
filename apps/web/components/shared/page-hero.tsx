import { cn } from "@/lib/utils"

export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
  className,
}: {
  eyebrow: string
  title: string
  subtitle: string
  children?: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("relative overflow-hidden border-b border-border/70", className)}>
      <div className="absolute inset-0 starfield opacity-60" aria-hidden="true" />
      <div className="absolute inset-0 technical-grid opacity-30" aria-hidden="true" />
      <div
        className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-background to-transparent"
        aria-hidden="true"
      />
      <div className="mission-container relative flex min-h-[48vh] flex-col justify-end gap-8 py-16 sm:py-20">
        <div className="flex max-w-4xl flex-col gap-5">
          <p className="mission-eyebrow">{eyebrow}</p>
          <h1 className="mission-title">{title}</h1>
          <p className="max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
            {subtitle}
          </p>
        </div>
        {children}
      </div>
    </section>
  )
}
