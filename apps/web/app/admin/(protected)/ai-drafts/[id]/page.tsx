import { notFound } from "next/navigation"
import Link from "next/link"
import { Archive, CheckCircle2, GitMerge, XCircle } from "lucide-react"

import { AdminApprovalBadge } from "@/components/admin/admin-approval-badge"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSourceConfidenceBadge } from "@/components/admin/admin-source-confidence-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { mergeAIDraftAction, updateAIDraftStatusAction } from "@/lib/admin/actions"
import { stringifySafeJson } from "@/lib/admin/audit-safety"
import { getAdminRepository } from "@/lib/admin/repository"

export default async function AdminAIDraftDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const repository = getAdminRepository()
  const draft = await repository.getAIDraftById(id)

  if (!draft) {
    notFound()
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="AI draft detail"
        title={draft.title.en}
        description="Structured AI output review. Approval does not publish content, and merge only writes editable draft content."
        actions={
          <Link href="/admin/ai-drafts" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Back to drafts
          </Link>
        }
      />

      <section className="mission-panel rounded-lg p-5">
        <div className="flex flex-wrap gap-2">
          <Badge variant="info">{draft.type.replaceAll("_", " ")}</Badge>
          <Badge variant="outline">{draft.provider ?? "mock"}</Badge>
          <Badge variant="outline">{draft.model ?? "mock"}</Badge>
          <AdminApprovalBadge status={draft.approval.status} />
        </div>
        <dl className="mt-5 grid gap-4 text-sm md:grid-cols-3">
          <div>
            <dt className="mission-eyebrow">Related entity</dt>
            <dd className="mt-2 font-mono text-xs text-muted-foreground">
              {draft.relatedEntityType}:{draft.relatedEntityId}
            </dd>
          </div>
          <div>
            <dt className="mission-eyebrow">Prompt version</dt>
            <dd className="mt-2 text-muted-foreground">{draft.promptVersion ?? "unknown"}</dd>
          </div>
          <div>
            <dt className="mission-eyebrow">Reviewed</dt>
            <dd className="mt-2 text-muted-foreground">
              {draft.reviewedAt ? new Date(draft.reviewedAt).toISOString() : "not reviewed"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="mission-panel rounded-lg p-5">
          <p className="mission-eyebrow">English preview</p>
          <h2 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
            {draft.title.en}
          </h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground whitespace-pre-wrap">
            {draft.contentEn ?? draft.content.en}
          </p>
        </div>
        <div className="mission-panel rounded-lg p-5">
          <p className="mission-eyebrow">Russian preview</p>
          <h2 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
            {draft.title.ru}
          </h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground whitespace-pre-wrap">
            {draft.contentRu ?? draft.content.ru}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="mission-panel rounded-lg p-5">
          <p className="mission-eyebrow">Source notes</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {draft.citations.length > 0 ? (
              draft.citations.map((source) => (
                <span key={source.id} className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-2 text-xs">
                  {source.publisher}
                  <AdminSourceConfidenceBadge trustLevel={source.trustLevel} />
                </span>
              ))
            ) : (
              <Badge variant="danger">no citations</Badge>
            )}
          </div>
        </div>
        <div className="mission-panel rounded-lg p-5">
          <p className="mission-eyebrow">Confidence notes</p>
          <p className="mt-4 text-sm leading-6 text-muted-foreground whitespace-pre-wrap">
            {draft.confidenceNotes.en}
          </p>
        </div>
        <div className="mission-panel rounded-lg p-5">
          <p className="mission-eyebrow">Risk notes</p>
          <p className="mt-4 text-sm leading-6 text-muted-foreground whitespace-pre-wrap">
            {draft.riskNotes.en}
          </p>
        </div>
      </section>

      <section className="mission-panel rounded-lg p-5">
        <p className="mission-eyebrow">Review actions</p>
        <div className="mt-4 flex flex-wrap gap-3">
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
              Merge into editable draft
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
      </section>

      <section className="mission-panel rounded-lg p-5">
        <p className="mission-eyebrow">Structured JSON</p>
        <pre className="mt-4 max-h-[520px] overflow-auto rounded-lg bg-black/40 p-4 text-xs text-muted-foreground">
          {stringifySafeJson({
            contentJson: draft.contentJson,
            missingData: draft.missingData,
            sourcesJson: draft.sourcesJson,
            sourceComparison: draft.sourceComparison,
          })}
        </pre>
      </section>
    </div>
  )
}
