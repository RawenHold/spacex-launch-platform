import {
  AlertTriangle,
  Bot,
  CalendarClock,
  CheckCircle2,
  DatabaseZap,
  FileClock,
  History,
  Rocket,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { AdminDashboardStats } from "@/types/admin"

export function AdminDashboardCards({ stats }: { stats: AdminDashboardStats }) {
  const cards = [
    {
      label: "Next launch",
      value: stats.nextLaunch?.missionName.en ?? "No launch",
      detail: stats.nextLaunch
        ? new Date(stats.nextLaunch.launchDateTimeUtc).toUTCString()
        : "Connect Launch Library sync",
      icon: Rocket,
    },
    {
      label: "Upcoming",
      value: String(stats.upcomingLaunchCount),
      detail: "Launch records after current date",
      icon: CalendarClock,
    },
    {
      label: "Past",
      value: String(stats.pastLaunchCount),
      detail: "Replay and result records",
      icon: History,
    },
    {
      label: "Awaiting approval",
      value: String(stats.draftsAwaitingApproval),
      detail: "Publishable entities in review",
      icon: FileClock,
    },
    {
      label: "Source conflicts",
      value: String(stats.sourceConflictCount),
      detail: "Open verification warnings",
      icon: AlertTriangle,
    },
    {
      label: "AI drafts",
      value: String(stats.aiDraftsPendingReview),
      detail: "AI Moderator output pending review",
      icon: Bot,
    },
    {
      label: "Last sync",
      value: stats.lastSyncStatus.replaceAll("_", " "),
      detail: "Automated sync is not configured in MVP",
      icon: DatabaseZap,
    },
    {
      label: "Policy",
      value: "Human approval",
      detail: "AI cannot publish or overwrite official records",
      icon: CheckCircle2,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <article
            key={card.label}
            className="mission-panel rounded-lg p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mission-eyebrow">{card.label}</p>
                <h3 className="mt-3 text-2xl font-black tracking-wide text-foreground">
                  {card.value}
                </h3>
              </div>
              <span className="flex size-10 items-center justify-center rounded-full border border-border bg-secondary">
                <Icon data-icon className="size-4 text-signal-blue" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">{card.detail}</p>
            {card.label === "Policy" ? (
              <Badge className="mt-3" variant="success">
                enforced
              </Badge>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
