import { Bot, FilePlus2, Radio, ShieldCheck } from "lucide-react"
import Link from "next/link"

import { AdminApprovalBadge } from "@/components/admin/admin-approval-badge"
import { AdminDashboardCards } from "@/components/admin/admin-dashboard-cards"
import { AdminDataTable } from "@/components/admin/admin-data-table"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSourceConfidenceBadge } from "@/components/admin/admin-source-confidence-badge"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { Countdown } from "@/components/launch/countdown"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { getAdminRepository } from "@/lib/admin/repository"
import type { AdminLaunchRecord, AIDraft, SourceConflict } from "@/types/admin"

const countdownLabels = {
  label: "Countdown to next launch",
  days: "Days",
  hours: "Hours",
  minutes: "Min",
  seconds: "Sec",
  elapsed: "Launch window elapsed",
}

export default async function AdminDashboardPage() {
  const repository = getAdminRepository()
  const [stats, launches, drafts, conflicts] = await Promise.all([
    repository.getDashboardStats(),
    repository.listLaunches(),
    repository.listAIDrafts(),
    repository.listSourceConflicts(),
  ])

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="Mission Ops"
        title="Admin dashboard"
        description="Source-aware control center for persisted launch data, editorial drafts, AI suggestions, approval state, and audited admin operations."
        actions={
          <>
            <Link
              href="/admin/launches"
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              <FilePlus2 data-icon aria-hidden="true" />
              New launch
            </Link>
            <Link
              href="/admin/ai-drafts"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Bot data-icon aria-hidden="true" />
              Review AI drafts
            </Link>
          </>
        }
      />

      <AdminDashboardCards stats={stats} />

      {stats.nextLaunch ? (
        <section className="mission-panel rounded-lg p-5">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mission-eyebrow">Next launch control preview</p>
              <h3 className="mt-3 text-2xl font-black uppercase tracking-[0.08em] text-foreground">
                {stats.nextLaunch.missionName.en}
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                <AdminStatusBadge status={stats.nextLaunch.status} />
                <AdminApprovalBadge status={stats.nextLaunch.publishStatus} />
                <AdminSourceConfidenceBadge
                  confidenceLevel={stats.nextLaunch.confidenceLevel}
                />
              </div>
            </div>
            <div className="w-full max-w-xl">
              <Countdown
                targetUtc={stats.nextLaunch.launchDateTimeUtc}
                labels={countdownLabels}
              />
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="mission-panel rounded-lg p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="mission-eyebrow">Launch queue</p>
              <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
                Operations table
              </h3>
            </div>
            <Link
              href="/admin/live-control"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Radio data-icon aria-hidden="true" />
              Live control
            </Link>
          </div>
          <AdminDataTable<AdminLaunchRecord>
            rows={launches.slice(0, 5)}
            getRowKey={(launch) => launch.id}
            columns={[
              {
                key: "mission",
                label: "Mission",
                render: (launch) => (
                  <div>
                    <p className="font-semibold text-foreground">{launch.missionName.en}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{launch.rocket.name}</p>
                  </div>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (launch) => <AdminStatusBadge status={launch.status} />,
              },
              {
                key: "approval",
                label: "Approval",
                render: (launch) => <AdminApprovalBadge status={launch.publishStatus} />,
              },
              {
                key: "confidence",
                label: "Confidence",
                render: (launch) => (
                  <AdminSourceConfidenceBadge confidenceLevel={launch.confidenceLevel} />
                ),
              },
            ]}
          />
        </div>

        <div className="flex flex-col gap-6">
          <section className="mission-panel rounded-lg p-5">
            <div className="mb-5 flex items-center gap-3">
              <ShieldCheck data-icon className="size-4 text-signal-amber" aria-hidden="true" />
              <div>
                <p className="mission-eyebrow">Source conflicts</p>
                <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
                  Review required
                </h3>
              </div>
            </div>
            <div className="space-y-4">
              {conflicts.map((conflict: SourceConflict) => (
                <article
                  key={conflict.id}
                  className="rounded-lg border border-border/70 bg-card/60 p-4"
                >
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="danger">{conflict.field}</Badge>
                    <Badge variant="outline">{conflict.status}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {conflict.summary}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="mission-panel rounded-lg p-5">
            <p className="mission-eyebrow">AI Moderator</p>
            <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
              Draft review
            </h3>
            <div className="mt-5 space-y-4">
              {drafts.slice(0, 3).map((draft: AIDraft) => (
                <article
                  key={draft.id}
                  className="rounded-lg border border-border/70 bg-card/60 p-4"
                >
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="info">{draft.type.replaceAll("_", " ")}</Badge>
                    <Badge variant="warning">{draft.status.replaceAll("_", " ")}</Badge>
                  </div>
                  <p className="mt-3 font-semibold text-foreground">{draft.title.en}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {draft.riskNotes.en}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}
