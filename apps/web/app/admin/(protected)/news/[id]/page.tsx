import { notFound } from "next/navigation"
import { Save } from "lucide-react"

import { AdminApprovalBadge } from "@/components/admin/admin-approval-badge"
import { AdminAIActionPanel } from "@/components/admin/admin-ai-action-panel"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSourceConfidenceBadge } from "@/components/admin/admin-source-confidence-badge"
import { buttonVariants } from "@/components/ui/button"
import { transitionApprovalAction, updateNewsAction } from "@/lib/admin/actions"
import { getAdminRepository } from "@/lib/admin/repository"

const confidenceLevels = [
  "official_confirmed",
  "admin_verified",
  "multi_source_confirmed",
  "estimated",
  "unverified",
  "conflicting",
]

function dateInputValue(value: string) {
  return new Date(value).toISOString().slice(0, 16)
}

export default async function AdminNewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const repository = getAdminRepository()
  const item = await repository.getNewsById(id)

  if (!item) {
    notFound()
  }

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="News detail"
        title={item.title.en}
        description="Edit bilingual news summary, source fields, confidence, and approval state."
        actions={
          <button type="submit" form="news-detail-form" className={buttonVariants({ variant: "default", size: "sm" })}>
            <Save data-icon aria-hidden="true" />
            Save news
          </button>
        }
      />

      <section className="mission-panel rounded-lg p-5">
        <form id="news-detail-form" action={updateNewsAction} className="grid gap-4 lg:grid-cols-2">
          <input type="hidden" name="id" value={item.id} />
          <input name="titleEn" defaultValue={item.title.en} required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="titleRu" defaultValue={item.title.ru} required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="slug" defaultValue={item.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="sourceName" defaultValue={item.sourceName} required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="sourceUrl" defaultValue={item.sourceUrl ?? ""} placeholder="https://example.com" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="publicationDate" type="datetime-local" defaultValue={dateInputValue(item.publicationDate)} required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <select name="confidenceLevel" defaultValue={item.confidenceLevel} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            {confidenceLevels.map((level) => (
              <option key={level} value={level}>{level.replaceAll("_", " ")}</option>
            ))}
          </select>
          <div className="flex items-center">
            <AdminSourceConfidenceBadge confidenceLevel={item.confidenceLevel} />
          </div>
          <textarea name="summaryEn" defaultValue={item.summary.en} required className="min-h-40 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm" />
          <textarea name="summaryRu" defaultValue={item.summary.ru} required className="min-h-40 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm" />
        </form>
      </section>

      <AdminAIActionPanel
        relatedEntityType="news"
        relatedEntityId={item.id}
        returnTo={`/admin/news/${item.id}`}
        actions={[
          {
            task: "news_summary",
            label: "Generate news summary",
            instruction: "Generate a bilingual news summary from the saved source fields and approved context.",
          },
          {
            task: "seo",
            label: "Generate SEO",
            instruction: "Generate RU/EN SEO metadata for this news draft.",
          },
        ]}
      />

      <section className="mission-panel rounded-lg p-5">
        <p className="mission-eyebrow">Approval</p>
        <div className="mt-3">
          <AdminApprovalBadge status={item.publishStatus} />
        </div>
        <form action={transitionApprovalAction} className="mt-5 grid gap-3">
          <input type="hidden" name="entityId" value={item.id} />
          <select name="status" defaultValue={item.publishStatus} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            {["draft", "in_review", "approved", "published", "rejected", "archived"].map((status) => (
              <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
            ))}
          </select>
          <input name="comments" placeholder="Approval note" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Save approval state
          </button>
        </form>
      </section>
    </div>
  )
}
