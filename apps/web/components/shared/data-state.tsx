import { Alert } from "@/components/ui/alert"

export function DevDataWarning({ label }: { label?: string }) {
  if (process.env.NODE_ENV === "production") return null

  return (
    <Alert className="border-signal-amber/50 bg-signal-amber/10 text-signal-amber">
      {label ??
        "Development fallback is active: this page is showing local mock data because no published database records were available."}
    </Alert>
  )
}

export function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-card/40 p-8 text-center">
      <p className="mission-eyebrow">No published records</p>
      <h2 className="mt-3 text-2xl font-black uppercase tracking-[0.08em] text-foreground">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
