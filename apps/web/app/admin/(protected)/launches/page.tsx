import { CalendarClock, FilePlus2, ListChecks, Pencil, Plus, Radio } from "lucide-react"
import Link from "next/link"

import { AdminApprovalBadge } from "@/components/admin/admin-approval-badge"
import { AdminDataTable } from "@/components/admin/admin-data-table"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSourceConfidenceBadge } from "@/components/admin/admin-source-confidence-badge"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  createLaunchAction,
  transitionApprovalAction,
  updateLaunchStatusAction,
} from "@/lib/admin/actions"
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
        description="Persistent CRUD foundation for launch records, multilingual mission content, status control, source records, and publication state. Writes are role-gated and audited."
        actions={
          <>
            <button
              type="submit"
              form="create-launch-form"
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
        <div className="flex items-center gap-3">
          <Plus data-icon className="size-4 text-signal-blue" aria-hidden="true" />
          <div>
            <p className="mission-eyebrow">Create</p>
            <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
              New launch draft
            </h3>
          </div>
        </div>
        <form
          id="create-launch-form"
          action={createLaunchAction}
          className="mt-5 grid gap-4 lg:grid-cols-3"
        >
          <input name="missionNameEn" placeholder="Mission name EN" required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="missionNameRu" placeholder="Mission name RU" required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="slug" placeholder="mission-slug" required pattern="[a-z0-9-]+" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="rocketName" placeholder="Falcon 9" required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="launchPadName" placeholder="LC-39A" required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="launchDateTimeUtc" type="datetime-local" required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <select name="status" defaultValue="draft" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            {launchStatuses.map((status) => (
              <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
            ))}
          </select>
          <select name="confidenceLevel" defaultValue="estimated" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            {[
              "official_confirmed",
              "admin_verified",
              "multi_source_confirmed",
              "estimated",
              "unverified",
              "conflicting",
            ].map((level) => (
              <option key={level} value={level}>{level.replaceAll("_", " ")}</option>
            ))}
          </select>
          <button type="submit" className={buttonVariants({ variant: "default", size: "sm" })}>
            <FilePlus2 data-icon aria-hidden="true" />
            Save draft
          </button>
        </form>
      </section>

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
              render: (launch) => (
                <form action={updateLaunchStatusAction} className="flex flex-col gap-2">
                  <input type="hidden" name="id" value={launch.id} />
                  <AdminStatusBadge status={launch.status} />
                  <select name="status" defaultValue={launch.status} className="h-9 rounded-lg border border-input bg-background/60 px-2 text-xs">
                    {launchStatuses.map((status) => (
                      <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                  <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Save
                  </button>
                </form>
              ),
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
              render: (launch) => (
                <form action={transitionApprovalAction} className="flex flex-col gap-2">
                  <input type="hidden" name="entityId" value={launch.id} />
                  <AdminApprovalBadge status={launch.publishStatus} />
                  <select name="status" defaultValue={launch.publishStatus} className="h-9 rounded-lg border border-input bg-background/60 px-2 text-xs">
                    {["draft", "in_review", "approved", "published", "rejected", "archived"].map((status) => (
                      <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                  <input name="comments" placeholder="Audit note" className="h-9 rounded-lg border border-input bg-background/60 px-2 text-xs" />
                  <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Save
                  </button>
                </form>
              ),
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
                  <Link
                    href={`/admin/launches/${launch.id}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    <Pencil data-icon aria-hidden="true" />
                    Edit flow
                  </Link>
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
