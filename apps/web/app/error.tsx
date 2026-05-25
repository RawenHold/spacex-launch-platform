"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
      <div className="mission-panel flex max-w-xl flex-col gap-5 rounded-lg p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-signal-red/40 bg-signal-red/10">
          <AlertTriangle data-icon className="size-5 text-signal-red" aria-hidden="true" />
        </div>
        <div>
          <p className="mission-eyebrow">Safe failure</p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.08em]">
            Something went off nominal
          </h1>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          The page could not be rendered safely. Stack traces and internal details are
          intentionally hidden from the browser.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" className={buttonVariants({ variant: "default" })} onClick={reset}>
            Try again
          </button>
          <Link className={buttonVariants({ variant: "outline" })} href="/en">
            Return home
          </Link>
        </div>
      </div>
    </main>
  )
}
