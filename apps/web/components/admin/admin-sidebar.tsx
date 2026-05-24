import {
  Bot,
  Gauge,
  ListTree,
  Newspaper,
  Radio,
  Rocket,
  Settings,
  ShieldCheck,
  TableProperties,
  Users,
} from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import type { AdminUser } from "@/types/admin"

const navItems = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/launches", label: "Launches", icon: Rocket },
  { href: "/admin/live-control", label: "Live control", icon: Radio },
  { href: "/admin/articles", label: "Articles", icon: TableProperties },
  { href: "/admin/news", label: "News", icon: Newspaper },
  { href: "/admin/faq", label: "FAQ", icon: TableProperties },
  { href: "/admin/sources", label: "Sources", icon: ShieldCheck },
  { href: "/admin/ai-drafts", label: "AI drafts", icon: Bot },
  { href: "/admin/audit", label: "Audit log", icon: ListTree },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export function AdminSidebar({ user }: { user: AdminUser }) {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-border/70 bg-background/70 lg:block">
      <div className="sticky top-0 flex min-h-screen flex-col p-5">
        <Link href="/admin" className="group">
          <p className="mission-eyebrow">Mission Ops CMS</p>
          <h1 className="mt-2 text-2xl font-black uppercase tracking-[0.12em] text-foreground">
            SpaceX Admin
          </h1>
        </Link>

        <div className="mt-6 rounded-lg border border-border/70 bg-card/60 p-4">
          <p className="text-sm font-semibold text-foreground">{user.name}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="info">{user.role.replaceAll("_", " ")}</Badge>
            <Badge variant={user.isHuman ? "success" : "warning"}>
              {user.isHuman ? "human" : "system"}
            </Badge>
          </div>
        </div>

        <nav className="mt-6 flex flex-col gap-1" aria-label="Admin navigation">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <Icon data-icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto rounded-lg border border-signal-amber/40 bg-signal-amber/10 p-4 text-xs leading-5 text-signal-amber">
          Admin routes are protected by Auth.js. Keep AUTH_SECRET and database credentials server-only.
        </div>
      </div>
    </aside>
  )
}

export { navItems as adminNavItems }
