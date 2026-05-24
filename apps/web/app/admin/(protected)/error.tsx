"use client"

import { AlertTriangle } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 rounded-lg border border-signal-red/40 bg-signal-red/10 p-6 text-signal-red">
      <div className="flex items-center gap-3">
        <AlertTriangle data-icon className="size-5" aria-hidden="true" />
        <div>
          <p className="mission-eyebrow">Admin action failed</p>
          <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em]">
            We could not complete that request
          </h2>
        </div>
      </div>
      <p className="text-sm leading-6">
        Check required fields and permissions, then retry. Server stack traces are intentionally not shown in the admin UI.
      </p>
      <button type="button" className={buttonVariants({ variant: "outline" })} onClick={reset}>
        Try again
      </button>
    </div>
  )
}
