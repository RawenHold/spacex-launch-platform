import { notFound } from "next/navigation"
import Link from "next/link"
import { Search, Video } from "lucide-react"

import { AdminApprovalBadge } from "@/components/admin/admin-approval-badge"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminSourceConfidenceBadge } from "@/components/admin/admin-source-confidence-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { requireAdminRole } from "@/lib/admin/auth"
import {
  addManualYouTubeVideoAction,
  runYouTubeDiscoveryAction,
  updateVideoStatusAction,
} from "@/lib/admin/actions"
import { stringifySafeJson } from "@/lib/admin/audit-safety"
import { localizedFromJson } from "@/lib/admin/prisma-mappers"
import { getLaunchVideoReviewData } from "@/lib/server/youtube/service"
import type { PublishableStatus } from "@/types/admin"

const statuses: PublishableStatus[] = [
  "draft",
  "in_review",
  "approved",
  "published",
  "rejected",
  "archived",
]

export default async function AdminLaunchVideosPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdminRole(["admin", "editor", "researcher"])
  const { id } = await params
  const { launch, videos, conflicts } = await getLaunchVideoReviewData(id)

  if (!launch) {
    notFound()
  }

  const missionName = localizedFromJson(launch.missionName).en
  const discoveryEnabled = process.env.ENABLE_YOUTUBE_SYNC === "true"
  const approvedVideo = videos.find(
    (video) => video.isApproved && ["approved", "published"].includes(video.publishStatus)
  )

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="Launch video review"
        title={missionName}
        description="Discover, manually add, approve, reject, publish, or archive YouTube livestream/replay candidates for this launch."
        actions={
          <>
            <button
              type="submit"
              form="launch-youtube-discovery-form"
              disabled={!discoveryEnabled}
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              <Search data-icon aria-hidden="true" />
              Run discovery
            </button>
            <Link href={`/admin/launches/${launch.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Back to launch
            </Link>
          </>
        }
      />

      <section className="mission-panel rounded-lg p-5">
        <div className="grid gap-5 xl:grid-cols-2">
          <form id="launch-youtube-discovery-form" action={runYouTubeDiscoveryAction} className="grid gap-3">
            <input type="hidden" name="launchId" value={launch.id} />
            <p className="mission-eyebrow">Discovery</p>
            <p className="text-sm leading-6 text-muted-foreground">
              YouTube API discovery is {discoveryEnabled ? "enabled" : "disabled"}. Candidates remain drafts.
            </p>
          </form>
          <form action={addManualYouTubeVideoAction} className="grid gap-3">
            <input type="hidden" name="launchId" value={launch.id} />
            <p className="mission-eyebrow">Manual add</p>
            <input name="url" placeholder="https://www.youtube.com/watch?v=..." required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
            <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Video data-icon aria-hidden="true" />
              Add candidate
            </button>
          </form>
        </div>
      </section>

      {conflicts.length > 0 ? (
        <section className="mission-panel rounded-lg p-5">
          <p className="mission-eyebrow">Open video conflicts</p>
          <div className="mt-4 grid gap-3">
            {conflicts.map((conflict) => (
              <article key={conflict.id} className="rounded-lg border border-signal-amber/40 bg-signal-amber/10 p-4 text-signal-amber">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="warning">{conflict.field}</Badge>
                  <Badge variant="outline">{conflict.status.toLowerCase()}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6">{conflict.summary}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {approvedVideo ? (
        <section className="mission-panel rounded-lg p-5">
          <p className="mission-eyebrow">Public embed candidate</p>
          <h2 className="mt-2 text-xl font-black uppercase tracking-[0.08em] text-foreground">
            {approvedVideo.title.en}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Public pages may use this record because it is approved or published and belongs to this launch.
          </p>
        </section>
      ) : null}

      <section className="grid gap-5">
        {videos.length > 0 ? (
          videos.map((video) => (
            <article key={video.id} className="mission-panel rounded-lg p-5">
              <div className="grid gap-5 xl:grid-cols-[1fr_260px]">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <AdminApprovalBadge status={video.publishStatus} />
                    <AdminSourceConfidenceBadge confidenceLevel={video.confidenceLevel} />
                    <Badge variant={video.isApproved ? "success" : "warning"}>
                      {video.isApproved ? "approved" : "review required"}
                    </Badge>
                    <Badge variant="outline">score {video.confidenceScore}</Badge>
                  </div>
                  <h2 className="mt-4 text-xl font-black uppercase tracking-[0.08em] text-foreground">
                    {video.title.en}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {video.providerVideoId ?? "no video id"} · {video.channelTitle ?? "unknown channel"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {video.confidenceNotes ?? "Admin review required."}
                  </p>
                </div>
                <form action={updateVideoStatusAction} className="grid gap-3">
                  <input type="hidden" name="id" value={video.id} />
                  <input type="hidden" name="launchId" value={launch.id} />
                  <select name="status" defaultValue={video.publishStatus} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
                    {statuses.map((item) => (
                      <option key={item} value={item}>{item.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                  <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Save status
                  </button>
                  {video.url ? (
                    <a href={video.url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      Open YouTube
                    </a>
                  ) : null}
                </form>
              </div>
              <details className="mt-5 rounded-lg border border-border/70 bg-background/50 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-foreground">
                  Raw summary
                </summary>
                <pre className="mt-4 max-h-80 overflow-auto rounded-lg bg-black/40 p-3 text-xs text-muted-foreground">
                  {stringifySafeJson(video.externalRawJson ?? null)}
                </pre>
              </details>
            </article>
          ))
        ) : (
          <section className="mission-panel rounded-lg p-8 text-center text-sm text-muted-foreground">
            No YouTube candidates for this launch yet.
          </section>
        )}
      </section>
    </div>
  )
}
