import Link from "next/link"
import { Archive, CheckCircle2, GitMerge, Search, XCircle } from "lucide-react"
import type { ComponentProps } from "react"

import { AdminApprovalBadge } from "@/components/admin/admin-approval-badge"
import { AdminDataTable } from "@/components/admin/admin-data-table"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSourceConfidenceBadge } from "@/components/admin/admin-source-confidence-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { mergeAIDraftAction, updateAIDraftStatusAction } from "@/lib/admin/actions"
import { getAdminRepository } from "@/lib/admin/repository"
import { getAIRuntimeConfig } from "@/lib/server/ai/service"
import type { AIDraft } from "@/types/admin"

function draftStatusVariant(
  status: AIDraft["status"]
): ComponentProps<typeof Badge>["variant"] {
  if (status === "approved" || status === "merged") return "success"
  if (status === "rejected") return "danger"
  if (status === "needs_review" || status === "archived") return "warning"
  return "info"
}

const draftTypes: AIDraft["type"][] = [
  "launch_summary",
  "article",
  "news_summary",
  "faq",
  "seo",
  "timeline_suggestion",
  "source_comparison",
]

const draftStatuses: AIDraft["status"][] = [
  "generated",
  "needs_review",
  "approved",
  "rejected",
  "merged",
  "archived",
]
const reviewStatuses = draftStatuses.filter((status) => status !== "merged")

export default async function AdminAIDraftsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>
}) {
  const query = (await searchParams) ?? {}
  const repository = getAdminRepository()
  const runtime = getAIRuntimeConfig()
  const drafts = await repository.listAIDrafts({
    type: draftTypes.includes(query.type as AIDraft["type"]) ? (query.type as AIDraft["type"]) : undefined,
    status: draftStatuses.includes(query.status as AIDraft["status"]) ? (query.status as AIDraft["status"]) : undefined,
    relatedEntityId: query.relatedEntityId || undefined,
    from: query.from || undefined,
    confidence: query.confidence || undefined,
  })

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="AI Moderator"
        title="AI draft center"
        description="AI can create drafts, source comparisons, summaries, SEO suggestions, FAQ ideas, and timeline suggestions. It cannot approve, publish, delete, or overwrite official data."
      />

      <section className="mission-panel rounded-lg p-5">
        <div className="mb-5 flex flex-wrap gap-2">
          <Badge variant={runtime.enabled ? "success" : "warning"}>
            {runtime.enabled ? "AI enabled" : "AI disabled"}
          </Badge>
          <Badge variant={runtime.realApiAvailable ? "info" : "outline"}>
            {runtime.realApiAvailable ? runtime.model : "mock mode"}
          </Badge>
          <Badge variant="outline">{runtime.promptVersion}</Badge>
        </div>
        <form className="grid gap-4 lg:grid-cols-5">
          <select name="type" defaultValue={query.type ?? ""} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            <option value="">All draft types</option>
            {draftTypes.map((type) => (
              <option key={type} value={type}>{type.replaceAll("_", " ")}</option>
            ))}
          </select>
          <select name="status" defaultValue={query.status ?? ""} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            <option value="">All statuses</option>
            {draftStatuses.map((status) => (
              <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
            ))}
          </select>
          <input name="relatedEntityId" defaultValue={query.relatedEntityId ?? ""} placeholder="Related entity id" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="from" type="date" defaultValue={query.from ?? ""} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="confidence" defaultValue={query.confidence ?? ""} placeholder="Confidence text" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <button type="submit" className={buttonVariants({ variant: "outline", size: "sm", className: "lg:col-span-5" })}>
            <Search data-icon aria-hidden="true" />
            Apply filters
          </button>
        </form>
      </section>

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
                    {draft.type.replaceAll("_", " ")} · {draft.provider ?? "mock"}
                  </p>
                </div>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (draft) => (
                <form action={updateAIDraftStatusAction} className="flex flex-col gap-2">
                  <input type="hidden" name="id" value={draft.id} />
                  <Badge variant={draftStatusVariant(draft.status)}>
                    {draft.status.replaceAll("_", " ")}
                  </Badge>
                  <select name="status" defaultValue={draft.status} className="h-9 rounded-lg border border-input bg-background/60 px-2 text-xs">
                    {reviewStatuses.map((status) => (
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
              key: "review",
              label: "Review",
              render: (draft) => <AdminApprovalBadge status={draft.approval.status} />,
            },
            {
              key: "actions",
              label: "Actions",
              render: (draft) => (
                <Link href={`/admin/ai-drafts/${draft.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  View
                </Link>
              ),
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
              <form action={updateAIDraftStatusAction}>
                <input type="hidden" name="id" value={draft.id} />
                <input type="hidden" name="status" value="approved" />
                <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <CheckCircle2 data-icon aria-hidden="true" />
                  Approve
                </button>
              </form>
              <form action={updateAIDraftStatusAction}>
                <input type="hidden" name="id" value={draft.id} />
                <input type="hidden" name="status" value="rejected" />
                <button type="submit" className={buttonVariants({ variant: "danger", size: "sm" })}>
                  <XCircle data-icon aria-hidden="true" />
                  Reject
                </button>
              </form>
              <form action={mergeAIDraftAction}>
                <input type="hidden" name="id" value={draft.id} />
                <button
                  type="submit"
                  disabled={draft.status !== "approved" || draft.type === "source_comparison"}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <GitMerge data-icon aria-hidden="true" />
                  Merge into content
                </button>
              </form>
              <form action={updateAIDraftStatusAction}>
                <input type="hidden" name="id" value={draft.id} />
                <input type="hidden" name="status" value="archived" />
                <button type="submit" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                  <Archive data-icon aria-hidden="true" />
                  Archive
                </button>
              </form>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
