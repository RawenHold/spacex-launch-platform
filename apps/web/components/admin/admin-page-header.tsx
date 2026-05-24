import type { ReactNode } from "react"

export function AdminPageHeader({
  eyebrow = "Admin",
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="mission-eyebrow">{eyebrow}</p>
        <h2 className="mt-3 max-w-4xl text-3xl font-black uppercase tracking-[0.08em] text-foreground sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  )
}
