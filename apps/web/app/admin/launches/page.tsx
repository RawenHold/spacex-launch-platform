import { CalendarClock, FilePlus2, ListChecks, Pencil, Plus, Radio } from "lucide-react"
import Link from "next/link"

import { AdminApprovalBadge } from "@/components/admin/admin-approval-badge"
import { AdminDataTable } from "@/components/admin/admin-data-table"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSourceConfidenceBadge } from "@/components/admin/admin-source-confidence-badge"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { getAdminRepository } from "@/lib/admin/repository"
import type { AdminLaunchRecord } from "@/types/admin"

const editableFields = [
  "Mission name",
  "Slug",
  "RU/EN title and description",
  "Rocket",
  "Launch pad",
  "UTC date/time",
  "Local time display helper",
  "Trajectory/orbit",
  "Payload",
  "Official URL",
  "YouTube URL/video ID",
  "Source records",
  "Confidence level",
  "Featured and published flags",
]

const launchStatuses = [
  "draft",
  "scheduled",
  "confirmed",
  "live",
  "delayed",
  "scrubbed",
  "success",
  "failure",
  "partial_success",
]

export default async function AdminLaunchesPage() {
  const repository = getAdminRepository()
  const launches = await repository.listLaunches()

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="Launch CMS"
        title="Launch management"
        description="CRUD foundation for launch records, multilingual mission content, status control, source records, and publication state. The MVP repository is read-only mock data with protected transition endpoints."
        actions={
          <>
            <button
              type="button"
              disabled
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              <FilePlus2 data-icon aria-hidden="true" />
              Create launch
            </button>
            <Link
              href="/admin/live-control"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Radio data-icon aria-hidden="true" />
              Live control
            </Link>
          </>
        }
      />

      <section className="mission-panel rounded-lg p-5">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mission-eyebrow">Records</p>
            <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
              Launch inventory
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {launchStatuses.map((status) => (
              <Badge key={status} variant="outline">
                {status.replaceAll("_", " ")}
              </Badge>
            ))}
          </div>
        </div>

        <AdminDataTable<AdminLaunchRecord>
          rows={launches}
          getRowKey={(launch) => launch.id}
          columns={[
            {
              key: "mission",
              label: "Mission",
              render: (launch) => (
                <div>
                  <p className="font-semibold text-foreground">{launch.missionName.en}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{launch.slug}</p>
                </div>
              ),
            },
            {
              key: "rocket",
              label: "Vehicle / pad",
              render: (launch) => (
                <div className="text-sm">
                  <p className="text-foreground">{launch.rocket.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {launch.launchPad.name}
                  </p>
                </div>
              ),
            },
            {
              key: "time",
              label: "UTC",
              render: (launch) => (
                <time className="font-mono text-xs text-muted-foreground">
                  {new Date(launch.launchDateTimeUtc).toISOString()}
                </time>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (launch) => <AdminStatusBadge status={launch.status} />,
            },
            {
              key: "confidence",
              label: "Confidence",
              render: (launch) => (
                <AdminSourceConfidenceBadge confidenceLevel={launch.confidenceLevel} />
              ),
            },
            {
              key: "approval",
              label: "Approval",
              render: (launch) => <AdminApprovalBadge status={launch.publishStatus} />,
            },
            {
              key: "actions",
              label: "Actions",
              render: (launch) => (
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/launches/${launch.id}/timeline`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <ListChecks data-icon aria-hidden="true" />
                    Timeline
                  </Link>
                  <button
                    type="button"
                    disabled
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    <Pencil data-icon aria-hidden="true" />
                    Edit
                  </button>
                </div>
              ),
            },
          ]}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="mission-panel rounded-lg p-5">
          <div className="flex items-center gap-3">
            <Plus data-icon className="size-4 text-signal-blue" aria-hidden="true" />
            <div>
              <p className="mission-eyebrow">Create/edit foundation</p>
              <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
                Required launch fields
              </h3>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {editableFields.map((field) => (
              <div
                key={field}
                className="rounded-lg border border-border/70 bg-card/60 p-3 text-sm text-muted-foreground"
              >
                {field}
              </div>
            ))}
          </div>
        </div>

        <div className="mission-panel rounded-lg p-5">
          <div className="flex items-center gap-3">
            <CalendarClock data-icon className="size-4 text-signal-amber" aria-hidden="true" />
            <div>
              <p className="mission-eyebrow">Data accuracy</p>
              <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
                Publish rules
              </h3>
            </div>
          </div>
          <div className="mt-5 space-y-4 text-sm leading-6 text-muted-foreground">
            <p>
              Estimated, unverified, and conflicting records must stay visibly labeled in
              public UI and admin tables.
            </p>
            <p>
              Secondary sources can add context, but they cannot override official SpaceX,
              NASA, FAA, or attached primary source records.
            </p>
            <p>
              AI drafts can propose text and compare sources; they cannot publish, delete,
              or silently overwrite official launch records.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
