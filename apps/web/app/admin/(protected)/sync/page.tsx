import Link from "next/link"
import { AlertTriangle, DatabaseZap, RefreshCw } from "lucide-react"

import { AdminAIActionPanel } from "@/components/admin/admin-ai-action-panel"
import { AdminApprovalBadge } from "@/components/admin/admin-approval-badge"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSourceConfidenceBadge } from "@/components/admin/admin-source-confidence-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { requireAdminRole } from "@/lib/admin/auth"
import { runLaunchLibrarySyncAction } from "@/lib/admin/actions"
import { getExternalSyncDashboardData } from "@/lib/server/sync/sync-service"

function runStatusVariant(status: string) {
  if (status === "success") return "success"
  if (status === "failed") return "danger"
  if (status === "partial") return "warning"
  return "info"
}

export default async function AdminExternalSyncPage() {
  await requireAdminRole(["admin"])
  const data = await getExternalSyncDashboardData()

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="External data"
        title="Launch Library sync"
        description="Manual Launch Library 2 ingestion for SpaceX launch drafts. Imported records remain unpublished until admin approval."
        actions={
          <button
            type="submit"
            form="launch-library-sync-form"
            disabled={!data.syncEnabled}
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            <RefreshCw data-icon aria-hidden="true" />
            Run Launch Library Sync
          </button>
        }
      />

      <section className="mission-panel rounded-lg p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mission-eyebrow">Manual sync</p>
            <h2 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
              Launch Library 2
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              Sync is {data.syncEnabled ? "enabled" : "disabled"}. Set ENABLE_EXTERNAL_SYNC=true to allow manual imports. API keys are never rendered in the admin UI.
            </p>
          </div>
          <Badge variant={data.syncEnabled ? "success" : "warning"}>
            {data.syncEnabled ? "enabled" : "disabled"}
          </Badge>
        </div>
        <form id="launch-library-sync-form" action={runLaunchLibrarySyncAction} className="mt-5 grid gap-4 lg:grid-cols-[280px_1fr]">
          <select name="mode" defaultValue="upcoming" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            <option value="upcoming">Upcoming only</option>
            <option value="past">Past / recent only</option>
            <option value="both">Both</option>
          </select>
          <div className="rounded-lg border border-signal-amber/40 bg-signal-amber/10 p-3 text-sm leading-6 text-signal-amber">
            Imported data creates draft records and source records only. Approved or published launches are never overwritten silently.
          </div>
        </form>
      </section>

      <AdminAIActionPanel
        relatedEntityType="source"
        relatedEntityId={data.conflicts[0]?.id ?? "launch-library-sync-conflicts"}
        returnTo="/admin/sync"
        actions={[
          {
            task: "source_comparison",
            label: "Explain sync conflicts",
            instruction: "Compare Launch Library import conflicts and recommend manual admin checks without choosing final values.",
          },
        ]}
      />

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="mission-panel rounded-lg p-5">
          <div className="flex items-center gap-3">
            <DatabaseZap data-icon className="size-4 text-signal-blue" aria-hidden="true" />
            <div>
              <p className="mission-eyebrow">Sync runs</p>
              <h2 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
                Last runs
              </h2>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {data.runs.length > 0 ? (
              data.runs.map((run) => (
                <article key={run.id} className="rounded-lg border border-border/70 bg-card/60 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={runStatusVariant(run.status)}>{run.status}</Badge>
                    <Badge variant="outline">{run.provider.replaceAll("_", " ")}</Badge>
                  </div>
                  <p className="mt-3 font-mono text-xs text-muted-foreground">{run.id}</p>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    <div><dt className="mission-eyebrow">Imported</dt><dd>{run.importedCount}</dd></div>
                    <div><dt className="mission-eyebrow">Updated</dt><dd>{run.updatedCount}</dd></div>
                    <div><dt className="mission-eyebrow">Conflicts</dt><dd>{run.conflictCount}</dd></div>
                    <div><dt className="mission-eyebrow">Skipped</dt><dd>{run.skippedCount}</dd></div>
                    <div><dt className="mission-eyebrow">Errors</dt><dd>{run.errorCount}</dd></div>
                    <div><dt className="mission-eyebrow">Started</dt><dd>{new Date(run.startedAt).toISOString()}</dd></div>
                  </dl>
                  {run.errorMessage ? (
                    <p className="mt-3 text-sm text-signal-red">{run.errorMessage}</p>
                  ) : null}
                </article>
              ))
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">No sync runs yet.</p>
            )}
          </div>
        </div>

        <div className="mission-panel rounded-lg p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle data-icon className="size-4 text-signal-amber" aria-hidden="true" />
            <div>
              <p className="mission-eyebrow">Conflicts</p>
              <h2 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
                Open launch conflicts
              </h2>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {data.conflicts.length > 0 ? (
              data.conflicts.map((conflict) => (
                <article key={conflict.id} className="rounded-lg border border-signal-amber/40 bg-signal-amber/10 p-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="warning">{conflict.field}</Badge>
                    <Badge variant="outline">{conflict.status}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-signal-amber">{conflict.summary}</p>
                </article>
              ))
            ) : (
              <Badge variant="success">no open conflicts</Badge>
            )}
          </div>
        </div>
      </section>

      <section className="mission-panel rounded-lg p-5">
        <div className="mb-5">
          <p className="mission-eyebrow">Review queue</p>
          <h2 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
            Imported launch drafts awaiting review
          </h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {data.importedLaunches.length > 0 ? (
            data.importedLaunches.map((launch) => (
              <article key={launch.id} className="rounded-lg border border-border/70 bg-card/60 p-4">
                <div className="flex flex-wrap gap-2">
                  <AdminApprovalBadge status={launch.publishStatus} />
                  <Badge variant="outline">{launch.syncStatus ?? "imported"}</Badge>
                  <AdminSourceConfidenceBadge confidenceLevel={launch.confidenceLevel} />
                </div>
                <h3 className="mt-4 text-lg font-black uppercase tracking-[0.08em] text-foreground">
                  {launch.missionName.en}
                </h3>
                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {launch.externalProvider}:{launch.externalId}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {new Date(launch.launchDateTimeUtc).toISOString()} · {launch.rocket.name} · {launch.launchPad.name}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/admin/launches/${launch.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Review launch
                  </Link>
                  <Link href={`/admin/launches/${launch.id}/timeline`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    Timeline
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              No imported unpublished Launch Library records are waiting for review.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
