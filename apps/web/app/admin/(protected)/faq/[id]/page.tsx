import { notFound } from "next/navigation"
import { Save } from "lucide-react"

import { AdminApprovalBadge } from "@/components/admin/admin-approval-badge"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { transitionApprovalAction, updateFAQAction } from "@/lib/admin/actions"
import { getAdminRepository } from "@/lib/admin/repository"

const faqGroups = [
  "basics",
  "falcon9",
  "starship",
  "timeline",
  "livestreams",
  "accuracy",
  "reminders",
]

export default async function AdminFAQDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const repository = getAdminRepository()
  const faq = await repository.getFAQById(id)

  if (!faq) {
    notFound()
  }

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="FAQ detail"
        title={faq.question.en}
        description="Edit bilingual FAQ content, group, order, and approval state."
        actions={
          <button type="submit" form="faq-detail-form" className={buttonVariants({ variant: "default", size: "sm" })}>
            <Save data-icon aria-hidden="true" />
            Save FAQ
          </button>
        }
      />

      <section className="mission-panel rounded-lg p-5">
        <form id="faq-detail-form" action={updateFAQAction} className="grid gap-4 lg:grid-cols-2">
          <input type="hidden" name="id" value={faq.id} />
          <select name="group" defaultValue={faq.group} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            {faqGroups.map((group) => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
          <input name="sortOrder" type="number" min={0} defaultValue={faq.sortOrder} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="questionEn" defaultValue={faq.question.en} required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="questionRu" defaultValue={faq.question.ru} required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <textarea name="answerEn" defaultValue={faq.answer.en} required className="min-h-48 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm" />
          <textarea name="answerRu" defaultValue={faq.answer.ru} required className="min-h-48 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm" />
        </form>
      </section>

      <section className="mission-panel rounded-lg p-5">
        <p className="mission-eyebrow">Approval and sources</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <AdminApprovalBadge status={faq.publishStatus} />
          <Badge variant={faq.sources.length > 0 ? "info" : "warning"}>
            {faq.sources.length} sources
          </Badge>
        </div>
        <form action={transitionApprovalAction} className="mt-5 grid gap-3">
          <input type="hidden" name="entityId" value={faq.id} />
          <select name="status" defaultValue={faq.publishStatus} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
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
