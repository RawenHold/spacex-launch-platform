import { AlertTriangle, ExternalLink, Plus, ShieldCheck } from "lucide-react"

import { AdminDataTable } from "@/components/admin/admin-data-table"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSourceConfidenceBadge } from "@/components/admin/admin-source-confidence-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { getAdminRepository } from "@/lib/admin/repository"
import type { AdminSourceRecord, SourceConflict } from "@/types/admin"

export default async function AdminSourcesPage() {
  const repository = getAdminRepository()
  const [sources, conflicts] = await Promise.all([
    repository.listSources(),
    repository.listSourceConflicts(),
  ])

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="Source Verification"
        title="Sources"
        description="Source management foundation for official, API, secondary, and manual records with trust level, last checked placeholders, notes, and conflict warnings."
        actions={
          <button
            type="button"
            disabled
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            <Plus data-icon aria-hidden="true" />
            Add source
          </button>
        }
      />

      <section className="mission-panel rounded-lg p-5">
        <AdminDataTable<AdminSourceRecord>
          rows={sources}
          getRowKey={(source) => source.id}
          columns={[
            {
              key: "source",
              label: "Source",
              render: (source) => (
                <div>
                  <p className="font-semibold text-foreground">{source.publisher}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{source.title.en}</p>
                </div>
              ),
            },
            {
              key: "type",
              label: "Type",
              render: (source) => (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{source.sourceType}</Badge>
                  <AdminSourceConfidenceBadge trustLevel={source.trustLevel} />
                </div>
              ),
            },
            {
              key: "confidence",
              label: "Confidence",
              render: (source) => (
                <AdminSourceConfidenceBadge confidenceLevel={source.confidenceLevel} />
              ),
            },
            {
              key: "checked",
              label: "Last checked",
              render: (source) => (
                <time className="font-mono text-xs text-muted-foreground">
                  {source.lastCheckedAt
                    ? new Date(source.lastCheckedAt).toISOString()
                    : "not checked"}
                </time>
              ),
            },
            {
              key: "link",
              label: "URL",
              render: (source) =>
                source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-signal-blue hover:underline"
                  >
                    <ExternalLink data-icon className="size-3" aria-hidden="true" />
                    Open
                  </a>
                ) : (
                  <Badge variant="warning">missing</Badge>
                ),
            },
          ]}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="mission-panel rounded-lg p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck data-icon className="size-4 text-signal-blue" aria-hidden="true" />
            <div>
              <p className="mission-eyebrow">Trust policy</p>
              <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
                Verification hierarchy
              </h3>
            </div>
          </div>
          <div className="mt-5 space-y-4 text-sm leading-6 text-muted-foreground">
            <p>Primary sources are official SpaceX, official YouTube, NASA, or FAA pages.</p>
            <p>Launch Library can populate calendar data but needs source transparency.</p>
            <p>Secondary sources must never override primary official records.</p>
            <p>AI can summarize conflicts, but it cannot silently resolve them.</p>
          </div>
        </div>

        <div className="mission-panel rounded-lg p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle data-icon className="size-4 text-signal-amber" aria-hidden="true" />
            <div>
              <p className="mission-eyebrow">Conflict warnings</p>
              <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
                Open issues
              </h3>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {conflicts.map((conflict: SourceConflict) => (
              <article
                key={conflict.id}
                className="rounded-lg border border-border/70 bg-card/60 p-4"
              >
                <div className="flex flex-wrap gap-2">
                  <Badge variant="danger">{conflict.field}</Badge>
                  <Badge variant="outline">{conflict.entityType}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {conflict.summary}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
