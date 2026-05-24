import { Bot, FilePlus2, Pencil } from "lucide-react"

import { AdminApprovalBadge } from "@/components/admin/admin-approval-badge"
import { AdminDataTable } from "@/components/admin/admin-data-table"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSourceConfidenceBadge } from "@/components/admin/admin-source-confidence-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { getAdminRepository } from "@/lib/admin/repository"
import type { AdminArticle } from "@/types/admin"

export default async function AdminArticlesPage() {
  const repository = getAdminRepository()
  const [articles, drafts] = await Promise.all([
    repository.listArticles(),
    repository.listAIDrafts(),
  ])

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="Editorial CMS"
        title="Articles"
        description="Article CRUD foundation with bilingual body fields, SEO metadata, source attachments, AI draft links, and approval history."
        actions={
          <button
            type="button"
            disabled
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            <FilePlus2 data-icon aria-hidden="true" />
            Create article
          </button>
        }
      />

      <section className="mission-panel rounded-lg p-5">
        <AdminDataTable<AdminArticle>
          rows={articles}
          getRowKey={(article) => article.id}
          columns={[
            {
              key: "title",
              label: "Title",
              render: (article) => (
                <div>
                  <p className="font-semibold text-foreground">{article.title.en}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{article.slug}</p>
                </div>
              ),
            },
            {
              key: "category",
              label: "Category",
              render: (article) => <Badge variant="outline">{article.category}</Badge>,
            },
            {
              key: "sources",
              label: "Sources",
              render: (article) => (
                <div className="flex flex-wrap gap-2">
                  {article.sources.length > 0 ? (
                    article.sources.map((source) => (
                      <AdminSourceConfidenceBadge
                        key={source.id}
                        trustLevel={source.trustLevel}
                      />
                    ))
                  ) : (
                    <Badge variant="warning">no source</Badge>
                  )}
                </div>
              ),
            },
            {
              key: "approval",
              label: "Approval",
              render: (article) => <AdminApprovalBadge status={article.publishStatus} />,
            },
            {
              key: "ai",
              label: "AI draft",
              render: (article) =>
                article.aiDraftId ? (
                  <Badge variant="info">{article.aiDraftId}</Badge>
                ) : (
                  <Badge variant="outline">none</Badge>
                ),
            },
            {
              key: "actions",
              label: "Actions",
              render: () => (
                <button
                  type="button"
                  disabled
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <Pencil data-icon aria-hidden="true" />
                  Edit
                </button>
              ),
            },
          ]}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="mission-panel rounded-lg p-5">
          <p className="mission-eyebrow">Editor fields</p>
          <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
            Draft shape
          </h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              "RU title/body",
              "EN title/body",
              "SEO title",
              "Meta description",
              "Category",
              "Sources",
              "AI draft link",
              "Approval history",
            ].map((field) => (
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
            <Bot data-icon className="size-4 text-signal-blue" aria-hidden="true" />
            <div>
              <p className="mission-eyebrow">AI draft links</p>
              <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
                Review only
              </h3>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {drafts
              .filter((draft) => draft.type === "article" || draft.type === "launch_summary")
              .slice(0, 3)
              .map((draft) => (
                <article
                  key={draft.id}
                  className="rounded-lg border border-border/70 bg-card/60 p-4"
                >
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="info">{draft.type.replaceAll("_", " ")}</Badge>
                    <Badge variant="warning">{draft.status.replaceAll("_", " ")}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {draft.confidenceNotes.en}
                  </p>
                </article>
              ))}
          </div>
        </div>
      </section>
    </div>
  )
}
