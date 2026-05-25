import { notFound } from "next/navigation"
import Link from "next/link"
import { ListChecks, Save, Video } from "lucide-react"

import { AdminApprovalBadge } from "@/components/admin/admin-approval-badge"
import { AdminAIActionPanel } from "@/components/admin/admin-ai-action-panel"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSourceConfidenceBadge } from "@/components/admin/admin-source-confidence-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { transitionApprovalAction, updateLaunchAction } from "@/lib/admin/actions"
import { getAdminRepository } from "@/lib/admin/repository"
import { listAdminVideoRecords } from "@/lib/server/youtube/service"

const launchStatuses = [
  "draft",
  "scheduled",
  "confirmed",
  "live",
  "delayed",
  "scrubbed",
  "success",
  "failure",
  "partial_success",
]

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

export default async function AdminLaunchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const repository = getAdminRepository()
  const [launch, videos] = await Promise.all([
    repository.getLaunchById(id),
    listAdminVideoRecords({ launchId: id }),
  ])

  if (!launch) {
    notFound()
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="Launch detail"
        title={launch.missionName.en}
        description="Edit core launch fields, manage status, review sources, and move content through the approval workflow."
        actions={
          <>
            <button type="submit" form="launch-detail-form" className={buttonVariants({ variant: "default", size: "sm" })}>
              <Save data-icon aria-hidden="true" />
              Save launch
            </button>
            <Link href={`/admin/launches/${launch.id}/timeline`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <ListChecks data-icon aria-hidden="true" />
              Timeline
            </Link>
            <Link href={`/admin/launches/${launch.id}/videos`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Video data-icon aria-hidden="true" />
              Videos
            </Link>
          </>
        }
      />

      <section className="mission-panel rounded-lg p-5">
        <form id="launch-detail-form" action={updateLaunchAction} className="grid gap-4 lg:grid-cols-2">
          <input type="hidden" name="id" value={launch.id} />
          <input name="missionNameEn" defaultValue={launch.missionName.en} required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="missionNameRu" defaultValue={launch.missionName.ru} required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="slug" defaultValue={launch.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="rocketName" defaultValue={launch.rocket.name} required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="launchPadName" defaultValue={launch.launchPad.name} required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="launchDateTimeUtc" type="datetime-local" defaultValue={dateInputValue(launch.launchDateTimeUtc)} required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="launchPadLocationEn" defaultValue={launch.launchPad.location.en} required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="launchPadLocationRu" defaultValue={launch.launchPad.location.ru} required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="orbit" defaultValue={launch.orbit ?? ""} placeholder="Orbit" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="youtubeUrlOrVideoId" defaultValue={launch.youtubeUrlOrVideoId ?? ""} placeholder="YouTube URL or video ID" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="officialUrl" defaultValue={launch.officialUrl ?? ""} placeholder="Official URL" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <label className="flex items-center gap-2 rounded-lg border border-border/70 bg-card/50 px-3 text-sm">
            <input type="checkbox" name="isFeatured" defaultChecked={launch.isFeatured} />
            Featured public launch
          </label>
          <select name="status" defaultValue={launch.status} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            {launchStatuses.map((status) => (
              <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
            ))}
          </select>
          <select name="confidenceLevel" defaultValue={launch.confidenceLevel} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            {confidenceLevels.map((level) => (
              <option key={level} value={level}>{level.replaceAll("_", " ")}</option>
            ))}
          </select>
          <textarea name="trajectoryEn" defaultValue={launch.trajectory.en} required className="min-h-24 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm" />
          <textarea name="trajectoryRu" defaultValue={launch.trajectory.ru} required className="min-h-24 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm" />
          <textarea name="payloadEn" defaultValue={launch.payload.en} required className="min-h-24 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm" />
          <textarea name="payloadRu" defaultValue={launch.payload.ru} required className="min-h-24 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm" />
          <textarea name="missionDescriptionEn" defaultValue={launch.missionDescription.en} required className="min-h-32 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm" />
          <textarea name="missionDescriptionRu" defaultValue={launch.missionDescription.ru} required className="min-h-32 rounded-lg border border-input bg-background/60 px-3 py-2 text-sm" />
        </form>
      </section>

      <AdminAIActionPanel
        relatedEntityType="launch"
        relatedEntityId={launch.id}
        returnTo={`/admin/launches/${launch.id}`}
        actions={[
          {
            task: "launch_summary",
            label: "Generate mission summary",
            instruction: "Generate RU/EN mission summary from launch fields, timeline, videos, and source records.",
          },
          {
            task: "timeline_suggestion",
            label: "Suggest timeline",
            instruction: "Suggest planned timeline events only from provided launch context and sources.",
          },
          {
            task: "source_comparison",
            label: "Compare sources",
            instruction: "Compare source records and highlight conflicts without choosing a final value.",
          },
          {
            task: "seo",
            label: "Generate SEO",
            instruction: "Generate RU/EN SEO metadata using only verified launch context.",
          },
          {
            task: "article",
            label: "Generate article draft",
            instruction: "Generate a bilingual launch article draft with uncertainty and source notes.",
          },
        ]}
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="mission-panel rounded-lg p-5">
          <p className="mission-eyebrow">Approval</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <AdminApprovalBadge status={launch.publishStatus} />
            <Badge variant={launch.isPublished ? "success" : "warning"}>
              {launch.isPublished ? "published" : "not public"}
            </Badge>
          </div>
          <form action={transitionApprovalAction} className="mt-5 grid gap-3">
            <input type="hidden" name="entityId" value={launch.id} />
            <select name="status" defaultValue={launch.publishStatus} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
              {["draft", "in_review", "approved", "published", "rejected", "archived"].map((status) => (
                <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
              ))}
            </select>
            <input name="comments" placeholder="Approval or override note" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
            <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Save approval state
            </button>
          </form>
        </div>

        <div className="mission-panel rounded-lg p-5">
          <p className="mission-eyebrow">Sources</p>
          <div className="mt-5 space-y-3">
            {launch.sourceRecords.length > 0 ? (
              launch.sourceRecords.map((source) => (
                <div key={source.id} className="rounded-lg border border-border/70 bg-card/60 p-3">
                  <p className="font-semibold text-foreground">{source.publisher}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{source.title.en}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <AdminSourceConfidenceBadge trustLevel={source.trustLevel} />
                    <AdminSourceConfidenceBadge confidenceLevel={source.confidenceLevel} />
                  </div>
                </div>
              ))
            ) : (
              <Badge variant="warning">no sources attached</Badge>
            )}
          </div>
        </div>
      </section>

      <section className="mission-panel rounded-lg p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mission-eyebrow">YouTube review</p>
            <h2 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
              Related video records
            </h2>
          </div>
          <Link href={`/admin/launches/${launch.id}/videos`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Manage videos
          </Link>
        </div>
        <div className="mt-5 grid gap-3">
          {videos.length > 0 ? (
            videos.slice(0, 4).map((video) => (
              <article key={video.id} className="rounded-lg border border-border/70 bg-card/60 p-3">
                <div className="flex flex-wrap gap-2">
                  <AdminApprovalBadge status={video.publishStatus} />
                  <AdminSourceConfidenceBadge confidenceLevel={video.confidenceLevel} />
                  <Badge variant={video.isApproved ? "success" : "warning"}>
                    {video.isApproved ? "approved" : "candidate"}
                  </Badge>
                </div>
                <p className="mt-3 font-semibold text-foreground">{video.title.en}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {video.providerVideoId ?? "no video id"} · score {video.confidenceScore}
                </p>
              </article>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No YouTube candidates yet. Use the video review page to discover or add one manually.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
