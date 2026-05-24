import type { Metadata } from "next"
import { ShieldCheck } from "lucide-react"

import { adminSignInAction } from "@/lib/admin/login-actions"
import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Admin Login | SpaceX Mission Ops",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLoginPage() {
  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <div className="technical-grid absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="starfield absolute inset-0 opacity-30" aria-hidden="true" />
      <section className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12">
        <div className="mission-panel rounded-lg p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-full border border-border bg-secondary">
              <ShieldCheck data-icon className="size-5 text-signal-blue" aria-hidden="true" />
            </span>
            <div>
              <p className="mission-eyebrow">Mission Ops</p>
              <h1 className="mt-1 text-2xl font-black uppercase tracking-[0.12em]">
                Admin Login
              </h1>
            </div>
          </div>

          <form action={adminSignInAction} className="mt-8 flex flex-col gap-5">
            <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
              Email
              <input
                required
                name="email"
                type="email"
                autoComplete="email"
                className="h-11 rounded-lg border border-input bg-background/60 px-3 text-sm text-foreground outline-none focus:border-ring"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-semibold text-foreground">
              Password
              <input
                required
                name="password"
                type="password"
                minLength={8}
                autoComplete="current-password"
                className="h-11 rounded-lg border border-input bg-background/60 px-3 text-sm text-foreground outline-none focus:border-ring"
              />
            </label>
            <button type="submit" className={buttonVariants({ variant: "default" })}>
              Sign in
            </button>
          </form>

          <p className="mt-5 text-xs leading-5 text-muted-foreground">
            Seed an admin with ADMIN_EMAIL and ADMIN_PASSWORD. Never commit real
            credentials or production secrets.
          </p>
        </div>
      </section>
    </main>
  )
}
