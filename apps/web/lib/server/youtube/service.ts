import type {
  AdminSourceType as DbAdminSourceType,
  DataConfidenceLevel as DbDataConfidenceLevel,
  Prisma,
  VideoProvider as DbVideoProvider,
} from "@prisma/client"

import { videoFromDb } from "@/lib/admin/prisma-mappers"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/server/logger"
import { detectVideoConflicts } from "@/lib/server/youtube/conflicts"
import { discoverYouTubeCandidatesForLaunch } from "@/lib/server/youtube/discovery"
import { normalizeYouTubeUrlCandidate } from "@/lib/server/youtube/normalizers"
import type {
  NormalizedVideoCandidate,
  VideoDiscoveryLaunchInput,
  YouTubeDiscoverySummary,
} from "@/lib/server/youtube/types"
import { extractYouTubeId } from "@/lib/youtube"
import type { AdminVideoRecord, PublishableStatus } from "@/types/admin"

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

function localizedFromDb(value: Prisma.JsonValue) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>
    return {
      en: typeof record.en === "string" ? record.en : "",
      ru: typeof record.ru === "string" ? record.ru : typeof record.en === "string" ? record.en : "",
    }
  }

  return { en: String(value ?? ""), ru: String(value ?? "") }
}

function externalWebcastUrls(value: Prisma.JsonValue | null | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return []
  const record = value as Record<string, unknown>
  const vidUrls = Array.isArray(record.vidURLs) ? record.vidURLs : []

  return vidUrls.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return []
    const url = (entry as Record<string, unknown>).url
    return typeof url === "string" ? [url] : []
  })
}

function launchToDiscoveryInput(launch: {
  id: string
  missionName: Prisma.JsonValue
  launchDateTimeUtc: Date
  rocket: Prisma.JsonValue
  launchPad: Prisma.JsonValue
  youtubeUrlOrVideoId: string | null
  externalRawJson?: Prisma.JsonValue | null
}): VideoDiscoveryLaunchInput {
  const rocket =
    launch.rocket && typeof launch.rocket === "object" && !Array.isArray(launch.rocket)
      ? (launch.rocket as Record<string, unknown>)
      : {}
  const launchPad =
    launch.launchPad && typeof launch.launchPad === "object" && !Array.isArray(launch.launchPad)
      ? (launch.launchPad as Record<string, unknown>)
      : {}

  return {
    id: launch.id,
    missionName: localizedFromDb(launch.missionName),
    launchDateTimeUtc: launch.launchDateTimeUtc.toISOString(),
    rocketName: typeof rocket.name === "string" ? rocket.name : "SpaceX",
    launchPadName: typeof launchPad.name === "string" ? launchPad.name : undefined,
    youtubeUrlOrVideoId: launch.youtubeUrlOrVideoId ?? undefined,
    externalWebcastUrls: externalWebcastUrls(launch.externalRawJson),
  }
}

function emptySummary(dryRun: boolean, launchId?: string): YouTubeDiscoverySummary {
  return {
    dryRun,
    launchId,
    apiConfigured: Boolean(process.env.YOUTUBE_API_KEY),
    channelIdConfigured: Boolean(process.env.YOUTUBE_SPACEX_CHANNEL_ID),
    discoveredCount: 0,
    createdCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    conflictCount: 0,
    errorCount: 0,
    candidates: [],
    messages: [],
  }
}

function videoData(candidate: NormalizedVideoCandidate) {
  return {
    launchId: candidate.launchId,
    provider: "YOUTUBE" as const,
    providerVideoId: candidate.providerVideoId,
    url: candidate.url,
    title: json(candidate.title),
    description: json(candidate.description),
    channelId: candidate.channelId,
    channelTitle: candidate.channelTitle,
    thumbnailUrl: candidate.thumbnailUrl,
    scheduledStartTime: candidate.scheduledStartTime,
    actualStartTime: candidate.actualStartTime,
    actualEndTime: candidate.actualEndTime,
    liveBroadcastContent: candidate.liveBroadcastContent,
    duration: candidate.duration,
    publishStatus: "DRAFT" as const,
    confidenceLevel: candidate.confidenceLevel.toUpperCase() as DbDataConfidenceLevel,
    sourceType: candidate.sourceType.toUpperCase() as DbAdminSourceType,
    confidenceScore: candidate.confidenceScore,
    confidenceNotes: candidate.confidenceNotes,
    isApproved: false,
    externalRawJson: json({
      discoverySource: candidate.discoverySource,
      raw: candidate.externalRawJson,
    }),
  }
}

async function createSourceConflict(input: {
  launchId: string
  field: string
  existingValue: string
  importedValue: string
  summary: string
}) {
  const existing = await prisma.sourceConflict.findFirst({
    where: {
      entityType: "LAUNCH",
      entityId: input.launchId,
      field: input.field,
      status: { not: "RESOLVED" },
    },
  })
  const sources = [
    { sourceName: "Current approved/admin data", value: input.existingValue, trustLevel: "primary" },
    { sourceName: "YouTube discovery candidate", value: input.importedValue, trustLevel: "secondary" },
  ]

  if (existing) {
    await prisma.sourceConflict.update({
      where: { id: existing.id },
      data: { sources: json(sources), summary: input.summary, status: "OPEN" },
    })
    return
  }

  await prisma.sourceConflict.create({
    data: {
      entityType: "LAUNCH",
      entityId: input.launchId,
      field: input.field,
      sources: json(sources),
      summary: input.summary,
      status: "OPEN",
    },
  })
}

async function persistCandidate(candidate: NormalizedVideoCandidate, actorId?: string) {
  if (!candidate.providerVideoId) {
    return { created: 0, updated: 0, skipped: 1, conflicts: 0 }
  }

  const [launch, approvedVideos, existingByVideoId] = await Promise.all([
    prisma.launch.findUniqueOrThrow({ where: { id: candidate.launchId } }),
    prisma.videoRecord.findMany({
      where: {
        launchId: candidate.launchId,
        isApproved: true,
        publishStatus: { in: ["APPROVED", "PUBLISHED"] },
      },
      select: { providerVideoId: true },
    }),
    prisma.videoRecord.findUnique({
      where: {
        provider_providerVideoId: {
          provider: "YOUTUBE",
          providerVideoId: candidate.providerVideoId,
        },
      },
    }),
  ])

  if (existingByVideoId && existingByVideoId.launchId !== candidate.launchId) {
    await createSourceConflict({
      launchId: candidate.launchId,
      field: "youtubeVideoOwnership",
      existingValue: existingByVideoId.launchId,
      importedValue: candidate.providerVideoId,
      summary: "YouTube candidate already belongs to a different launch record.",
    })
    return { created: 0, updated: 0, skipped: 0, conflicts: 1 }
  }

  const conflicts = detectVideoConflicts({
    launchYoutubeUrl: launch.youtubeUrlOrVideoId,
    approvedVideoIds: approvedVideos.flatMap((video) => video.providerVideoId ?? []),
    candidate,
  })

  for (const conflict of conflicts) {
    await createSourceConflict({
      launchId: candidate.launchId,
      field: conflict.field,
      existingValue: conflict.existingValue,
      importedValue: conflict.importedValue,
      summary: conflict.summary,
    })
  }

  if (existingByVideoId?.isApproved || existingByVideoId?.publishStatus === "APPROVED" || existingByVideoId?.publishStatus === "PUBLISHED") {
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "UPDATE",
        entityType: "VIDEO_RECORD",
        entityId: existingByVideoId.id,
        reason: "YouTube discovery matched an approved/published video and did not overwrite it.",
        metadata: json({ providerVideoId: candidate.providerVideoId, conflicts }),
      },
    })
    return { created: 0, updated: 0, skipped: 1, conflicts: conflicts.length }
  }

  if (existingByVideoId) {
    const video = await prisma.videoRecord.update({
      where: { id: existingByVideoId.id },
      data: videoData(candidate),
    })
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "UPDATE",
        entityType: "VIDEO_RECORD",
        entityId: video.id,
        reason: "YouTube discovery updated an unpublished video candidate.",
        metadata: json({ providerVideoId: candidate.providerVideoId, conflicts }),
      },
    })
    return { created: 0, updated: 1, skipped: 0, conflicts: conflicts.length }
  }

  const video = await prisma.videoRecord.create({ data: videoData(candidate) })
  await prisma.auditLog.create({
    data: {
      actorId,
      action: "CREATE",
      entityType: "VIDEO_RECORD",
      entityId: video.id,
      reason: "YouTube discovery created an unpublished video candidate.",
      metadata: json({ providerVideoId: candidate.providerVideoId, conflicts }),
    },
  })
  return { created: 1, updated: 0, skipped: 0, conflicts: conflicts.length }
}

export async function discoverAndStoreYouTubeVideos({
  launchId,
  actorId,
  dryRun = false,
}: {
  launchId: string
  actorId?: string
  dryRun?: boolean
}) {
  const launch = await prisma.launch.findUniqueOrThrow({ where: { id: launchId } })
  const launchInput = launchToDiscoveryInput(launch)
  const summary = emptySummary(dryRun, launchId)
  const discovery = await discoverYouTubeCandidatesForLaunch(launchInput)

  summary.apiConfigured = discovery.apiConfigured
  summary.messages.push(...discovery.messages)
  summary.candidates = discovery.candidates
  summary.discoveredCount = discovery.candidates.length

  if (dryRun) return summary

  for (const candidate of discovery.candidates) {
    try {
      const result = await persistCandidate(candidate, actorId)
      summary.createdCount += result.created
      summary.updatedCount += result.updated
      summary.skippedCount += result.skipped
      summary.conflictCount += result.conflicts
    } catch (error) {
      summary.errorCount += 1
      const message = error instanceof Error ? error.message : "Unknown YouTube candidate error"
      summary.messages.push(message)
      logger.warn("youtube_candidate_persist_failed", { launchId, message })
    }
  }

  await prisma.auditLog.create({
    data: {
      actorId,
      action: "UPDATE",
      entityType: "LAUNCH",
      entityId: launchId,
      reason: "Manual YouTube discovery completed for launch.",
      metadata: json({
        discovered: summary.discoveredCount,
        created: summary.createdCount,
        updated: summary.updatedCount,
        skipped: summary.skippedCount,
        conflicts: summary.conflictCount,
        errors: summary.errorCount,
      }),
    },
  })
  logger.info("youtube_discovery_completed", {
    launchId,
    discovered: summary.discoveredCount,
    created: summary.createdCount,
    updated: summary.updatedCount,
    conflicts: summary.conflictCount,
    errors: summary.errorCount,
  })

  return summary
}

export async function addManualYouTubeVideoCandidate(input: {
  launchId: string
  url: string
  actorId: string
}) {
  const launch = await prisma.launch.findUniqueOrThrow({ where: { id: input.launchId } })
  const candidate = normalizeYouTubeUrlCandidate(
    input.url,
    launchToDiscoveryInput(launch),
    "manual"
  )

  if (!candidate) {
    throw new Error("Could not parse a YouTube video id from that URL.")
  }

  await persistCandidate(candidate, input.actorId)
}

export async function updateVideoRecordStatus(input: {
  id: string
  status: PublishableStatus
  actorId: string
}) {
  const before = await prisma.videoRecord.findUniqueOrThrow({ where: { id: input.id } })

  if (input.status === "published" && !before.isApproved && before.publishStatus !== "APPROVED") {
    throw new Error("Video must be approved before publishing.")
  }

  const approve = input.status === "approved" || input.status === "published"
  const video = await prisma.videoRecord.update({
    where: { id: input.id },
    data: {
      publishStatus: input.status.toUpperCase() as Prisma.VideoRecordUpdateInput["publishStatus"],
      isApproved: approve,
      approvedById: approve ? input.actorId : before.approvedById,
      approvedAt: approve ? new Date() : before.approvedAt,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action:
        input.status === "approved"
          ? "APPROVE"
          : input.status === "rejected"
            ? "REJECT"
            : input.status === "published"
              ? "PUBLISH"
              : input.status === "archived"
                ? "ARCHIVE"
                : "UPDATE",
      entityType: "VIDEO_RECORD",
      entityId: input.id,
      before: json(before),
      after: json(video),
      reason: "Video approval workflow status changed.",
    },
  })
}

export async function listAdminVideoRecords(filters?: {
  status?: PublishableStatus
  launchId?: string
  confidenceLevel?: string
  provider?: string
  liveBroadcastContent?: string
}) {
  const where: Prisma.VideoRecordWhereInput = {}
  if (filters?.status) where.publishStatus = filters.status.toUpperCase() as Prisma.VideoRecordWhereInput["publishStatus"]
  if (filters?.launchId) where.launchId = filters.launchId
  if (filters?.provider) where.provider = filters.provider.toUpperCase() as DbVideoProvider
  if (filters?.liveBroadcastContent) where.liveBroadcastContent = filters.liveBroadcastContent
  if (filters?.confidenceLevel) {
    where.confidenceLevel = filters.confidenceLevel.toUpperCase() as Prisma.VideoRecordWhereInput["confidenceLevel"]
  }

  const videos = await prisma.videoRecord.findMany({
    where,
    include: { launch: { select: { missionName: true } } },
    orderBy: { updatedAt: "desc" },
    take: 200,
  })
  return videos.map(videoFromDb)
}

export async function getLaunchVideoReviewData(launchId: string) {
  const [launch, videos, conflicts] = await Promise.all([
    prisma.launch.findUnique({
      where: { id: launchId },
      include: { sourceRecords: true },
    }),
    listAdminVideoRecords({ launchId }),
    prisma.sourceConflict.findMany({
      where: {
        entityType: "LAUNCH",
        entityId: launchId,
        field: { in: ["youtubeVideoId", "approvedVideoId", "youtubeChannelId", "youtubeVideoOwnership"] },
        status: { not: "RESOLVED" },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ])

  return { launch, videos, conflicts }
}

export async function listLaunchesForVideoDiscovery() {
  return prisma.launch.findMany({
    orderBy: { launchDateTimeUtc: "desc" },
    select: {
      id: true,
      missionName: true,
      launchDateTimeUtc: true,
      youtubeUrlOrVideoId: true,
    },
    take: 100,
  })
}

export function publicVideoState(video: AdminVideoRecord) {
  if (video.liveBroadcastContent === "live") return "live"
  if (video.liveBroadcastContent === "upcoming") return "upcoming"
  if (video.actualEndTime || video.liveBroadcastContent === "none") return "completed"
  return "unavailable"
}

export function candidateVideoId(value?: string) {
  return extractYouTubeId(value)
}
