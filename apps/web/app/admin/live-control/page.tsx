import {
  AlertTriangle,
  CheckCircle2,
  Flame,
  PauseCircle,
  Radio,
  ShieldAlert,
  XCircle,
} from "lucide-react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSourceConfidenceBadge } from "@/components/admin/admin-source-confidence-badge"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { Countdown } from "@/components/launch/countdown"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { getAdminRepository } from "@/lib/admin/repository"

const countdownLabels = {
  label: "Active mission countdown",
  days: "Days",
  hours: "Hours",
  minutes: "Min",
  seconds: "Sec",
  elapsed: "Launch window elapsed",
}

const overrideActions = [
  { label: "Mark event confirmed", icon: CheckCircle2, variant: "default" },
  { label: "Mark event failed", icon: XCircle, variant: "danger" },
  { label: "Delay launch", icon: PauseCircle, variant: "outline" },
  { label: "Scrub launch", icon: AlertTriangle, variant: "danger" },
  { label: "Mark mission live", icon: Radio, variant: "outline" },
  { label: "Mark mission success", icon: CheckCircle2, variant: "outline" },
  { label: "Mark mission failure", icon: XCircle, variant: "danger" },
] as const

export default async function AdminLiveControlPage() {
  const repository = getAdminRepository()
  const stats = await repository.getDashboardStats()
  const activeLaunch = stats.nextLaunch
  const events = activeLaunch
    ? await repository.listTimelineEvents(activeLaunch.id)
    : []

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="Live Mission Control"
        title="Manual control placeholder"
        description="Prepared control room surface for v3 live mission mode. Actions are disabled placeholders in MVP and must be backed by audit logs, role checks, and source verification before production use."
      />

      <section className="rounded-lg border border-signal-amber/50 bg-signal-amber/10 p-5 text-signal-amber">
        <div className="flex gap-3">
          <ShieldAlert data-icon className="mt-1 size-5 shrink-0" aria-hidden="true" />
          <p className="text-sm leading-6">
            This is a manual control interface. It does not represent official SpaceX
            telemetry unless confirmed by official sources.
          </p>
        </div>
      </section>

      {activeLaunch ? (
        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <div className="mission-panel rounded-lg p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mission-eyebrow">Active mission</p>
                <h3 className="mt-3 text-2xl font-black uppercase tracking-[0.08em] text-foreground">
                  {activeLaunch.missionName.en}
                </h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {activeLaunch.rocket.name} from {activeLaunch.launchPad.name}
                </p>
              </div>
              <Flame data-icon className="size-5 text-signal-red" aria-hidden="true" />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <AdminStatusBadge status={activeLaunch.status} />
              <AdminSourceConfidenceBadge confidenceLevel={activeLaunch.confidenceLevel} />
              {activeLaunch.manualOverride ? (
                <Badge variant="warning">manual override</Badge>
              ) : null}
            </div>
            <div className="mt-6">
              <Countdown
                targetUtc={activeLaunch.launchDateTimeUtc}
                labels={countdownLabels}
              />
            </div>
          </div>

          <div className="mission-panel rounded-lg p-5">
            <p className="mission-eyebrow">Manual overrides</p>
            <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
              Disabled in MVP
            </h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {overrideActions.map((action) => {
                const Icon = action.icon

                return (
                  <button
                    key={action.label}
                    type="button"
                    disabled
                    className={buttonVariants({
                      variant: action.variant,
                      size: "sm",
                      className: "justify-start opacity-70",
                    })}
                  >
                    <Icon data-icon aria-hidden="true" />
                    {action.label}
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mission-panel rounded-lg p-5">
        <p className="mission-eyebrow">Current timeline</p>
        <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
          Planned event stream
        </h3>
        <div className="mt-6 grid gap-3 lg:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
          {events.map((event) => (
            <article key={event.id} className="rounded-lg border border-border/70 bg-card/60 p-4">
              <p className="font-mono text-xs font-black text-signal-blue">
                {event.relativeTime}
              </p>
              <h4 className="mt-3 text-sm font-black uppercase tracking-[0.08em]">
                {event.title.en}
              </h4>
              <Badge className="mt-3" variant={event.status === "confirmed" ? "success" : "warning"}>
                {event.status}
              </Badge>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
