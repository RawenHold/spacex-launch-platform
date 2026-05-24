import { FilePlus2, HelpCircle } from "lucide-react"

import { AdminApprovalBadge } from "@/components/admin/admin-approval-badge"
import { AdminDataTable } from "@/components/admin/admin-data-table"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { createFAQAction, updateFAQStatusAction } from "@/lib/admin/actions"
import { getAdminRepository } from "@/lib/admin/repository"
import type { AdminFAQItem } from "@/types/admin"

const faqGroups = [
  "basics",
  "falcon9",
  "starship",
  "timeline",
  "livestreams",
  "accuracy",
  "reminders",
]

export default async function AdminFAQPage() {
  const repository = getAdminRepository()
  const faqs = await repository.listFAQs()

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="Editorial CMS"
        title="FAQ"
        description="Persistent FAQ management for bilingual question/answer entries, grouped public taxonomy, approval status, and source attachments."
        actions={
          <button
            type="submit"
            form="create-faq-form"
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            <FilePlus2 data-icon aria-hidden="true" />
            Create FAQ
          </button>
        }
      />

      <section className="mission-panel rounded-lg p-5">
        <div className="flex items-center gap-3">
          <HelpCircle data-icon className="size-4 text-signal-blue" aria-hidden="true" />
          <div>
            <p className="mission-eyebrow">Create</p>
            <h3 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
              New FAQ draft
            </h3>
          </div>
        </div>
        <form id="create-faq-form" action={createFAQAction} className="mt-5 grid gap-4 lg:grid-cols-2">
          <select name="group" defaultValue="basics" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            {faqGroups.map((group) => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
          <input name="questionEn" placeholder="Question EN" required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="questionRu" placeholder="Question RU" required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <textarea name="answerEn" placeholder="Answer EN" required className="min-h-24 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm" />
          <textarea name="answerRu" placeholder="Answer RU" required className="min-h-24 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm" />
          <button type="submit" className={buttonVariants({ variant: "default", size: "sm", className: "lg:col-span-2" })}>
            <FilePlus2 data-icon aria-hidden="true" />
            Save draft
          </button>
        </form>
      </section>

      <section className="mission-panel rounded-lg p-5">
        <AdminDataTable<AdminFAQItem>
          rows={faqs}
          getRowKey={(faq) => faq.id}
          columns={[
            {
              key: "question",
              label: "Question",
              render: (faq) => (
                <div>
                  <p className="font-semibold text-foreground">{faq.question.en}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{faq.answer.en}</p>
                </div>
              ),
            },
            {
              key: "group",
              label: "Group",
              render: (faq) => <Badge variant="outline">{faq.group}</Badge>,
            },
            {
              key: "sources",
              label: "Sources",
              render: (faq) => (
                <Badge variant={faq.sources.length > 0 ? "info" : "warning"}>
                  {faq.sources.length} sources
                </Badge>
              ),
            },
            {
              key: "approval",
              label: "Approval",
              render: (faq) => (
                <form action={updateFAQStatusAction} className="flex flex-col gap-2">
                  <input type="hidden" name="id" value={faq.id} />
                  <AdminApprovalBadge status={faq.publishStatus} />
                  <select name="status" defaultValue={faq.publishStatus} className="h-9 rounded-lg border border-input bg-background/60 px-2 text-xs">
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
    </div>
  )
}
