import { ExternalLink, ShieldAlert } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import type { AdminUser } from "@/types/admin"

export function AdminTopbar({ user }: { user: AdminUser }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <ShieldAlert data-icon className="size-4 text-signal-amber" aria-hidden="true" />
          <span>
            Admin MVP uses a mock local guard. Do not deploy as production auth.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Signed in as {user.name}
          </span>
          <Link href="/en" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ExternalLink data-icon aria-hidden="true" />
            Public site
          </Link>
        </div>
      </div>
    </header>
  )
}
