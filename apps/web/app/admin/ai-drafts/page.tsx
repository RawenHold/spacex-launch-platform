import { CheckCircle2, GitMerge, Sparkles, XCircle } from "lucide-react"
import type { ComponentProps } from "react"

import { AdminApprovalBadge } from "@/components/admin/admin-approval-badge"
import { AdminDataTable } from "@/components/admin/admin-data-table"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSourceConfidenceBadge } from "@/components/admin/admin-source-confidence-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { getAdminRepository } from "@/lib/admin/repository"
import type { AIDraft } from "@/types/admin"

function draftStatusVariant(
  status: AIDraft["status"]
): ComponentProps<typeof Badge>["variant"] {
  if (status === "approved" || status === "merged") return "success"
  if (status === "rejected") return "danger"
  if (status === "needs_review") return "warning"
  return "info"
}

export default async function AdminAIDraftsPage() {
  const repository = getAdminRepository()
  const drafts = await repository.listAIDrafts()

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="AI Moderator"
        title="AI draft center"
        description="AI can create drafts, source comparisons, summaries, SEO suggestions, FAQ ideas, and timeline suggestions. It cannot approve, publish, delete, or overwrite official data."
        actions={
          <button
            type="button"
            disabled
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            <Sparkles data-icon aria-hidden="true" />
            Generate mock draft
          </button>
        }
      />

      <section className="mission-panel rounded-lg p-5">
        <AdminDataTable<AIDraft>
          rows={drafts}
          getRowKey={(draft) => draft.id}
          columns={[
            {
              key: "draft",
              label: "Draft",
              render: (draft) => (
                <div>
                  <p className="font-semibold text-foreground">{draft.title.en}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {draft.type.replaceAll("_", " ")}
                  </p>
                </div>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (draft) => (
                <Badge variant={draftStatusVariant(draft.status)}>
                  {draft.status.replaceAll("_", " ")}
                </Badge>
              ),
            },
            {
              key: "created",
              label: "Created by",
              render: (draft) => <Badge variant="warning">{draft.createdBy}</Badge>,
            },
            {
              key: "related",
              label: "Related entity",
              render: (draft) => (
                <div>
                  <p className="text-sm text-foreground">{draft.relatedEntityType}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {draft.relatedEntityId}
                  </p>
                </div>
              ),
            },
            {
              key: "approval",
              label: "Approval",
              render: (draft) => <AdminApprovalBadge status={draft.approval.status} />,
            },
          ]}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {drafts.map((draft) => (
          <article key={draft.id} className="mission-panel rounded-lg p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mission-eyebrow">{draft.type.replaceAll("_", " ")}</p>
                <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
                  {draft.title.en}
                </h3>
              </div>
              <Badge variant={draftStatusVariant(draft.status)}>
                {draft.status.replaceAll("_", " ")}
              </Badge>
            </div>

            <div className="mt-5 space-y-4 text-sm leading-6 text-muted-foreground">
              <p>{draft.content.en}</p>
              <div className="rounded-lg border border-border/70 bg-card/60 p-4">
                <p className="font-semibold text-foreground">Confidence notes</p>
                <p className="mt-2">{draft.confidenceNotes.en}</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-card/60 p-4">
                <p className="font-semibold text-foreground">Risk notes</p>
                <p className="mt-2">{draft.riskNotes.en}</p>
              </div>
            </div>

            <div className="mt-5">
              <p className="mission-eyebrow">Citations</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {draft.citations.length > 0 ? (
                  draft.citations.map((source) => (
                    <span
                      key={source.id}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-2 text-xs text-secondary-foreground"
                    >
                      {source.publisher}
                      <AdminSourceConfidenceBadge trustLevel={source.trustLevel} />
                    </span>
                  ))
                ) : (
                  <Badge variant="danger">no citations</Badge>
                )}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <CheckCircle2 data-icon aria-hidden="true" />
                Approve
              </button>
              <button
                type="button"
                disabled
                className={buttonVariants({ variant: "danger", size: "sm" })}
              >
                <XCircle data-icon aria-hidden="true" />
                Reject
              </button>
              <button
                type="button"
                disabled
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <GitMerge data-icon aria-hidden="true" />
                Merge into content
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
