import { ExternalLink, FilePlus2 } from "lucide-react"

import { AdminApprovalBadge } from "@/components/admin/admin-approval-badge"
import { AdminDataTable } from "@/components/admin/admin-data-table"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSourceConfidenceBadge } from "@/components/admin/admin-source-confidence-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { createNewsAction, updateNewsStatusAction } from "@/lib/admin/actions"
import { getAdminRepository } from "@/lib/admin/repository"
import type { AdminNewsItem } from "@/types/admin"

export default async function AdminNewsPage() {
  const repository = getAdminRepository()
  const news = await repository.listNews()

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="Editorial CMS"
        title="News"
        description="Company news workflow with source URL, source name, publication date, bilingual summaries, confidence labels, and approval status."
        actions={
          <button
            type="submit"
            form="create-news-form"
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            <FilePlus2 data-icon aria-hidden="true" />
            Create news
          </button>
        }
      />

      <section className="mission-panel rounded-lg p-5">
        <p className="mission-eyebrow">Create</p>
        <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
          New news draft
        </h3>
        <form id="create-news-form" action={createNewsAction} className="mt-5 grid gap-4 lg:grid-cols-3">
          <input name="titleEn" placeholder="Title EN" required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="titleRu" placeholder="Title RU" required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="slug" placeholder="news-slug" required pattern="[a-z0-9-]+" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="sourceName" placeholder="Source name" required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="sourceUrl" placeholder="https://example.com" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="publicationDate" type="datetime-local" required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <select name="confidenceLevel" defaultValue="estimated" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            {["official_confirmed", "admin_verified", "multi_source_confirmed", "estimated", "unverified", "conflicting"].map((level) => (
              <option key={level} value={level}>{level.replaceAll("_", " ")}</option>
            ))}
          </select>
          <input name="summaryEn" placeholder="Summary EN" required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="summaryRu" placeholder="Summary RU" required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <button type="submit" className={buttonVariants({ variant: "default", size: "sm" })}>
            <FilePlus2 data-icon aria-hidden="true" />
            Save draft
          </button>
        </form>
      </section>

      <section className="mission-panel rounded-lg p-5">
        <AdminDataTable<AdminNewsItem>
          rows={news}
          getRowKey={(item) => item.id}
          columns={[
            {
              key: "title",
              label: "Title",
              render: (item) => (
                <div>
                  <p className="font-semibold text-foreground">{item.title.en}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.summary.en}</p>
                </div>
              ),
            },
            {
              key: "source",
              label: "Source",
              render: (item) => (
                <div>
                  <p className="font-semibold text-foreground">{item.sourceName}</p>
                  {item.sourceUrl ? (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-signal-blue hover:underline"
                    >
                      <ExternalLink data-icon className="size-3" aria-hidden="true" />
                      External link
                    </a>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">No URL</p>
                  )}
                </div>
              ),
            },
            {
              key: "date",
              label: "Publication",
              render: (item) => (
                <time className="font-mono text-xs text-muted-foreground">
                  {new Date(item.publicationDate).toISOString()}
                </time>
              ),
            },
            {
              key: "confidence",
              label: "Confidence",
              render: (item) => (
                <AdminSourceConfidenceBadge confidenceLevel={item.confidenceLevel} />
              ),
            },
            {
              key: "approval",
              label: "Approval",
              render: (item) => (
                <form action={updateNewsStatusAction} className="flex flex-col gap-2">
                  <input type="hidden" name="id" value={item.id} />
                  <AdminApprovalBadge status={item.publishStatus} />
                  <select name="status" defaultValue={item.publishStatus} className="h-9 rounded-lg border border-input bg-background/60 px-2 text-xs">
                    {["draft", "in_review", "approved", "published", "rejected", "archived"].map((status) => (
                      <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                  <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Save
                  </button>
                </form>
              ),
            },
          ]}
        />
      </section>

      <section className="mission-panel rounded-lg p-5">
        <p className="mission-eyebrow">News quality gate</p>
        <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
          Source labels and confidence
        </h3>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-border/70 bg-card/60 p-4">
            <Badge variant="success">primary</Badge>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Official company, NASA, FAA, or official YouTube source.
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-card/60 p-4">
            <Badge variant="info">secondary</Badge>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Contextual reporting that cannot override primary sources.
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-card/60 p-4">
            <Badge variant="warning">mock</Badge>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Placeholder content must stay clearly labeled before publication.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
