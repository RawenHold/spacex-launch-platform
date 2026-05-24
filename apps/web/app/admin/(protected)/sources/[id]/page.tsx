import { notFound } from "next/navigation"
import { Save } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSourceConfidenceBadge } from "@/components/admin/admin-source-confidence-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { updateSourceAction } from "@/lib/admin/actions"
import { getAdminRepository } from "@/lib/admin/repository"

const sourceKinds = [
  "official_spacex",
  "official_youtube",
  "nasa",
  "faa",
  "launch_library",
  "spaceflight_now",
  "nasaspaceflight",
  "next_spaceflight",
  "mock_dataset",
  "other",
]

const sourceTypes = ["official", "api", "secondary", "manual"]
const trustLevels = ["primary", "secondary", "low"]
const confidenceLevels = [
  "official_confirmed",
  "admin_verified",
  "multi_source_confirmed",
  "estimated",
  "unverified",
  "conflicting",
]

export default async function AdminSourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const repository = getAdminRepository()
  const [source, conflicts] = await Promise.all([
    repository.getSourceById(id),
    repository.listSourceConflicts(),
  ])

  if (!source) {
    notFound()
  }

  const relatedConflicts = conflicts.filter((conflict) => conflict.entityId === source.id)

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="Source detail"
        title={source.publisher}
        description="Edit source metadata, trust, confidence, notes, and review related conflict warnings."
        actions={
          <button type="submit" form="source-detail-form" className={buttonVariants({ variant: "default", size: "sm" })}>
            <Save data-icon aria-hidden="true" />
            Save source
          </button>
        }
      />

      <section className="mission-panel rounded-lg p-5">
        <form id="source-detail-form" action={updateSourceAction} className="grid gap-4 lg:grid-cols-2">
          <input type="hidden" name="id" value={source.id} />
          <input name="publisher" defaultValue={source.publisher} required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="url" defaultValue={source.url ?? ""} placeholder="https://example.com" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="titleEn" defaultValue={source.title.en} required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="titleRu" defaultValue={source.title.ru} required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <select name="kind" defaultValue={source.kind} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            {sourceKinds.map((kind) => (
              <option key={kind} value={kind}>{kind.replaceAll("_", " ")}</option>
            ))}
          </select>
          <select name="sourceType" defaultValue={source.sourceType} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            {sourceTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select name="trustLevel" defaultValue={source.trustLevel} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            {trustLevels.map((trust) => (
              <option key={trust} value={trust}>{trust}</option>
            ))}
          </select>
          <select name="confidenceLevel" defaultValue={source.confidenceLevel} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            {confidenceLevels.map((level) => (
              <option key={level} value={level}>{level.replaceAll("_", " ")}</option>
            ))}
          </select>
          <textarea name="notes" defaultValue={source.notes ?? ""} className="min-h-28 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm lg:col-span-2" />
        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="mission-panel rounded-lg p-5">
          <p className="mission-eyebrow">Trust labels</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <AdminSourceConfidenceBadge trustLevel={source.trustLevel} />
            <AdminSourceConfidenceBadge confidenceLevel={source.confidenceLevel} />
            <Badge variant="outline">{source.sourceType}</Badge>
          </div>
        </div>
        <div className="mission-panel rounded-lg p-5">
          <p className="mission-eyebrow">Related conflicts</p>
          <div className="mt-4 space-y-3">
            {relatedConflicts.length > 0 ? (
              relatedConflicts.map((conflict) => (
                <div key={conflict.id} className="rounded-lg border border-signal-amber/50 bg-signal-amber/10 p-3 text-signal-amber">
                  <p className="font-semibold">{conflict.field}</p>
                  <p className="mt-1 text-sm">{conflict.summary}</p>
                </div>
              ))
            ) : (
              <Badge variant="success">no related conflicts</Badge>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
