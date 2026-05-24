import type { ReactNode } from "react"
import Link from "next/link"

import { AdminSidebar, adminNavItems } from "@/components/admin/admin-sidebar"
import { AdminTopbar } from "@/components/admin/admin-topbar"
import type { AdminUser } from "@/types/admin"

export function AdminShell({
  user,
  children,
}: {
  user: AdminUser
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="technical-grid fixed inset-0 opacity-40" aria-hidden="true" />
      <div className="starfield fixed inset-0 opacity-30" aria-hidden="true" />
      <div className="relative flex min-h-screen">
        <AdminSidebar user={user} />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopbar user={user} />
          <nav
            className="flex gap-2 overflow-x-auto border-b border-border/70 px-4 py-3 lg:hidden"
            aria-label="Admin mobile navigation"
          >
            {adminNavItems.map((item) => {
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-secondary px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-secondary-foreground"
                >
                  <Icon data-icon className="size-3.5" aria-hidden="true" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
