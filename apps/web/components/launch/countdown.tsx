"use client"

import { useEffect, useMemo, useState } from "react"

function getParts(targetUtc: string) {
  const diff = new Date(targetUtc).getTime() - Date.now()
  if (diff <= 0) {
    return null
  }

  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds }
}

export function Countdown({
  targetUtc,
  labels,
}: {
  targetUtc: string
  labels: {
    label: string
    days: string
    hours: string
    minutes: string
    seconds: string
    elapsed: string
  }
}) {
  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    const firstPaint = window.setTimeout(() => setNow(Date.now()), 0)
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => {
      window.clearTimeout(firstPaint)
      window.clearInterval(timer)
    }
  }, [])

  const parts = useMemo(() => {
    if (!now) {
      return undefined
    }
    return getParts(targetUtc)
  }, [now, targetUtc])

  if (parts === undefined) {
    return (
      <div className="grid grid-cols-4 gap-2" aria-label={labels.label}>
        {[labels.days, labels.hours, labels.minutes, labels.seconds].map((label) => (
          <div key={label} className="rounded-lg border border-border/70 bg-card/70 p-3">
            <div className="h-7 animate-pulse rounded bg-muted" />
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {label}
            </p>
          </div>
        ))}
      </div>
    )
  }

  if (!parts) {
    return (
      <div className="rounded-lg border border-border/70 bg-card/70 p-4 font-mono text-sm uppercase tracking-[0.12em] text-muted-foreground">
        {labels.elapsed}
      </div>
    )
  }

  const items = [
    [labels.days, parts.days],
    [labels.hours, parts.hours],
    [labels.minutes, parts.minutes],
    [labels.seconds, parts.seconds],
  ] as const

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={labels.label} aria-live="polite">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-lg border border-border/70 bg-card/70 p-3">
          <p className="font-mono text-2xl font-black tabular-nums text-foreground">
            {String(value).padStart(2, "0")}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
        </div>
      ))}
    </div>
  )
}
