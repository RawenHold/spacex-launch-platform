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
import {
  listAdminVideoRecords,
  listLaunchesForVideoDiscovery,
} from "@/lib/server/youtube/service"
import type { DataConfidenceLevel } from "@/types/space"
import type { PublishableStatus } from "@/types/admin"

const statuses: PublishableStatus[] = [
  "draft",
  "in_review",
  "approved",
  "published",
  "rejected",
  "archived",
]

const confidenceLevels: DataConfidenceLevel[] = [
  "official_confirmed",
  "admin_verified",
  "multi_source_confirmed",
  "estimated",
  "unverified",
  "conflicting",
]

export default async function AdminVideosPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>
}) {
  await requireAdminRole(["admin", "editor", "researcher"])
  const query = (await searchParams) ?? {}
  const status = statuses.includes(query.status as PublishableStatus)
    ? (query.status as PublishableStatus)
    : undefined
  const confidenceLevel = confidenceLevels.includes(query.confidence as DataConfidenceLevel)
    ? query.confidence
    : undefined
  const [videos, launches] = await Promise.all([
    listAdminVideoRecords({
      status,
      launchId: query.launchId || undefined,
      confidenceLevel,
      provider: query.provider || undefined,
      liveBroadcastContent: query.live || undefined,
    }),
    listLaunchesForVideoDiscovery(),
  ])
  const discoveryEnabled = process.env.ENABLE_YOUTUBE_SYNC === "true"

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="Video review"
        title="YouTube candidates"
        description="Admin-only YouTube livestream and replay candidate review. Discovery stores drafts only; public embeds use approved/published video records."
        actions={
          <button
            type="submit"
            form="youtube-discovery-form"
            disabled={!discoveryEnabled}
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            <Search data-icon aria-hidden="true" />
            Run discovery
          </button>
        }
      />

      <section className="mission-panel rounded-lg p-5">
        <div className="grid gap-5 xl:grid-cols-2">
          <div>
            <p className="mission-eyebrow">Discover</p>
            <h2 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
              Official channel search
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Sync is {discoveryEnabled ? "enabled" : "disabled"}. Missing channel ID is allowed, but official SpaceX channel matching is more reliable when configured.
            </p>
            <form id="youtube-discovery-form" action={runYouTubeDiscoveryAction} className="mt-4 grid gap-3">
              <select name="launchId" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
                {launches.map((launch) => (
                  <option key={launch.id} value={launch.id}>
                    {typeof launch.missionName === "object" && !Array.isArray(launch.missionName)
                      ? String((launch.missionName as Record<string, unknown>).en ?? launch.id)
                      : launch.id}
                  </option>
                ))}
              </select>
            </form>
          </div>

          <div>
            <p className="mission-eyebrow">Manual candidate</p>
            <h2 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
              Add YouTube URL
            </h2>
            <form action={addManualYouTubeVideoAction} className="mt-4 grid gap-3">
              <select name="launchId" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
                {launches.map((launch) => (
                  <option key={launch.id} value={launch.id}>
                    {typeof launch.missionName === "object" && !Array.isArray(launch.missionName)
                      ? String((launch.missionName as Record<string, unknown>).en ?? launch.id)
                      : launch.id}
                  </option>
                ))}
              </select>
              <input name="url" placeholder="https://www.youtube.com/watch?v=..." required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
              <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
                <Video data-icon aria-hidden="true" />
                Add candidate
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="mission-panel rounded-lg p-5">
        <form className="grid gap-4 lg:grid-cols-6">
          <select name="status" defaultValue={query.status ?? ""} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            <option value="">All statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>{item.replaceAll("_", " ")}</option>
            ))}
          </select>
          <select name="launchId" defaultValue={query.launchId ?? ""} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            <option value="">All launches</option>
            {launches.map((launch) => (
              <option key={launch.id} value={launch.id}>{launch.id}</option>
            ))}
          </select>
          <select name="confidence" defaultValue={query.confidence ?? ""} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            <option value="">All confidence</option>
            {confidenceLevels.map((item) => (
              <option key={item} value={item}>{item.replaceAll("_", " ")}</option>
            ))}
          </select>
          <select name="live" defaultValue={query.live ?? ""} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            <option value="">All live states</option>
            <option value="upcoming">upcoming</option>
            <option value="live">live</option>
            <option value="none">completed/none</option>
          </select>
          <select name="provider" defaultValue={query.provider ?? ""} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            <option value="">All providers</option>
            <option value="youtube">YouTube</option>
          </select>
          <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Apply filters
          </button>
        </form>
      </section>

      <section className="grid gap-5">
        {videos.length > 0 ? (
          videos.map((video) => (
            <article key={video.id} className="mission-panel rounded-lg p-5">
              <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
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
                    {video.launchName ?? video.launchId} · {video.providerVideoId ?? "no video id"} · {video.channelTitle ?? "unknown channel"}
                  </p>
                  <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {video.provider} · {video.liveBroadcastContent ?? "unknown"} · {video.sourceType}
                    {video.scheduledStartTime ? ` · ${new Date(video.scheduledStartTime).toISOString()}` : ""}
                  </p>
                  <p className="mt-3 max-w-4xl text-sm leading-6 text-muted-foreground">
                    {video.confidenceNotes ?? "Admin review required."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/admin/launches/${video.launchId}/videos`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      Launch videos
                    </Link>
                    {video.url ? (
                      <a href={video.url} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                        Open YouTube
                      </a>
                    ) : null}
                  </div>
                </div>
                <form action={updateVideoStatusAction} className="grid gap-3">
                  <input type="hidden" name="id" value={video.id} />
                  <input type="hidden" name="launchId" value={video.launchId} />
                  <select name="status" defaultValue={video.publishStatus} className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
                    {statuses.map((item) => (
                      <option key={item} value={item}>{item.replaceAll("_", " ")}</option>
                    ))}
                  </select>
                  <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Save status
                  </button>
                </form>
              </div>
              <details className="mt-5 rounded-lg border border-border/70 bg-background/50 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-foreground">
                  Source metadata
                </summary>
                <pre className="mt-4 max-h-80 overflow-auto rounded-lg bg-black/40 p-3 text-xs text-muted-foreground">
                  {stringifySafeJson(video.externalRawJson ?? null)}
                </pre>
              </details>
            </article>
          ))
        ) : (
          <section className="mission-panel rounded-lg p-8 text-center text-sm text-muted-foreground">
            No video candidates match the current filters.
          </section>
        )}
      </section>
    </div>
  )
}
