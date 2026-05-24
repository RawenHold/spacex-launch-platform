import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
      <div className="flex max-w-lg flex-col items-center gap-5 text-center">
        <p className="mission-eyebrow">404 / signal lost</p>
        <h1 className="text-4xl font-black uppercase tracking-[0.08em]">Page not found</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          The requested route is outside the current public MVP flight plan.
        </p>
        <Link className={buttonVariants({ variant: "outline" })} href="/en">
          Return home
        </Link>
      </div>
    </main>
  )
}
