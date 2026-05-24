import { notFound } from "next/navigation"
import type { ComponentProps } from "react"
import { CopyPlus, Pencil, Trash2 } from "lucide-react"

import { AdminApprovalBadge } from "@/components/admin/admin-approval-badge"
import { AdminDataTable } from "@/components/admin/admin-data-table"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { adminLaunches } from "@/data/admin-mock-data"
import { getAdminRepository } from "@/lib/admin/repository"
import type { AdminTimelineEvent } from "@/types/admin"

export function generateStaticParams() {
  return adminLaunches.map((launch) => ({ id: launch.id }))
}

function timelineStatusVariant(
  status: AdminTimelineEvent["status"]
): ComponentProps<typeof Badge>["variant"] {
  if (status === "confirmed") return "success"
  if (status === "failed") return "danger"
  if (status === "skipped") return "secondary"
  if (status === "estimated") return "warning"
  return "outline"
}

export default async function AdminTimelineBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const repository = getAdminRepository()
  const launch = await repository.getLaunchById(id)

  if (!launch) {
    notFound()
  }

  const events = await repository.listTimelineEvents(id)

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="Timeline Builder"
        title={launch.missionName.en}
        description="Create, sort, review, and preview mission timeline events. Relative timing is planned/estimated unless backed by confirmed source records."
        actions={
          <button
            type="button"
            disabled
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            <CopyPlus data-icon aria-hidden="true" />
            Add event
          </button>
        }
      />

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="mission-panel rounded-lg p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mission-eyebrow">Events</p>
              <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
                Timeline editor
              </h3>
            </div>
            <AdminApprovalBadge status={launch.publishStatus} />
          </div>
          <AdminDataTable<AdminTimelineEvent>
            rows={events}
            getRowKey={(event) => event.id}
            columns={[
              {
                key: "time",
                label: "T time",
                render: (event) => (
                  <span className="font-mono text-sm font-black text-foreground">
                    {event.relativeTime}
                  </span>
                ),
              },
              {
                key: "event",
                label: "Event",
                render: (event) => (
                  <div>
                    <p className="font-semibold text-foreground">{event.title.en}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.type.replaceAll("_", " ")}
                    </p>
                  </div>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (event) => (
                  <Badge variant={timelineStatusVariant(event.status)}>
                    {event.status}
                  </Badge>
                ),
              },
              {
                key: "approval",
                label: "Approval",
                render: (event) => <AdminApprovalBadge status={event.approval.status} />,
              },
              {
                key: "actions",
                label: "Actions",
                render: () => (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      <Pencil data-icon aria-hidden="true" />
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled
                      className={buttonVariants({ variant: "danger", size: "sm" })}
                    >
                      <Trash2 data-icon aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </div>

        <div className="mission-panel rounded-lg p-5">
          <p className="mission-eyebrow">Preview</p>
          <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
            Compressed mission flow
          </h3>
          <div className="mt-6 space-y-4">
            {events.map((event, index) => (
              <article
                key={event.id}
                className="relative rounded-lg border border-border/70 bg-card/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs font-black text-signal-blue">
                      {event.relativeTime}
                    </p>
                    <h4 className="mt-2 font-black uppercase tracking-[0.08em] text-foreground">
                      {event.title.en}
                    </h4>
                  </div>
                  <Badge variant={timelineStatusVariant(event.status)}>
                    {event.status}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {event.description.en}
                </p>
                {index < events.length - 1 ? (
                  <span
                    className="absolute -bottom-5 left-7 h-5 w-px bg-border"
                    aria-hidden="true"
                  />
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
