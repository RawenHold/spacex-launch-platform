import { notFound } from "next/navigation"
import { Save } from "lucide-react"

import { AdminApprovalBadge } from "@/components/admin/admin-approval-badge"
import { AdminAIActionPanel } from "@/components/admin/admin-ai-action-panel"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { buttonVariants } from "@/components/ui/button"
import { transitionApprovalAction, updateArticleAction } from "@/lib/admin/actions"
import { getAdminRepository } from "@/lib/admin/repository"

export default async function AdminArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const repository = getAdminRepository()
  const article = await repository.getArticleById(id)

  if (!article) {
    notFound()
  }

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="Article detail"
        title={article.title.en}
        description="Edit bilingual article content, SEO fields, category, and publication workflow."
        actions={
          <button type="submit" form="article-detail-form" className={buttonVariants({ variant: "default", size: "sm" })}>
            <Save data-icon aria-hidden="true" />
            Save article
          </button>
        }
      />

      <section className="mission-panel rounded-lg p-5">
        <form id="article-detail-form" action={updateArticleAction} className="grid gap-4 lg:grid-cols-2">
          <input type="hidden" name="id" value={article.id} />
          <input name="titleEn" defaultValue={article.title.en} required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="titleRu" defaultValue={article.title.ru} required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="slug" defaultValue={article.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="category" defaultValue={article.category} required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="seoTitleEn" defaultValue={article.seoTitle.en} required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="seoTitleRu" defaultValue={article.seoTitle.ru} required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <textarea name="metaDescriptionEn" defaultValue={article.metaDescription.en} required className="min-h-24 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm" />
          <textarea name="metaDescriptionRu" defaultValue={article.metaDescription.ru} required className="min-h-24 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm" />
          <textarea name="bodyEn" defaultValue={article.body.en} required className="min-h-56 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm" />
          <textarea name="bodyRu" defaultValue={article.body.ru} required className="min-h-56 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm" />
        </form>
      </section>

      <AdminAIActionPanel
        relatedEntityType="article"
        relatedEntityId={article.id}
        returnTo={`/admin/articles/${article.id}`}
        actions={[
          {
            task: "article",
            label: "Generate article draft",
            instruction: "Generate or improve the bilingual article draft using existing article fields and source records.",
          },
          {
            task: "seo",
            label: "Generate SEO",
            instruction: "Generate RU/EN SEO metadata for this draft article.",
          },
        ]}
      />

      <section className="mission-panel rounded-lg p-5">
        <p className="mission-eyebrow">Approval</p>
        <div className="mt-3">
          <AdminApprovalBadge status={article.publishStatus} />
        </div>
        <form action={transitionApprovalAction} className="mt-5 grid gap-3">
          <input type="hidden" name="entityId" value={article.id} />
          <select name="status" defaultValue={article.publishStatus} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
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
