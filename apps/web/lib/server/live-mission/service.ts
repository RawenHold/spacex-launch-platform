import type { MissionTimelineEvent as DbMissionTimelineEvent, Prisma } from "@prisma/client"

import { maskSensitiveJson } from "@/lib/admin/audit-safety"
import {
  launchFromDb,
  prismaEnum,
  timelineEventFromDb,
  videoFromDb,
} from "@/lib/admin/prisma-mappers"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/server/logger"
import { parseRelativeMissionTime } from "@/lib/mission-time/mission-clock"
import { computeAnimationProgress } from "@/lib/mission-time/animation-progress"
import type {
  AdminLaunchRecord,
  AdminLiveMissionEventLog,
  AdminLiveMissionMode,
  AdminLiveMissionState,
  AdminLiveMissionStreamStatus,
  AdminLiveMissionSourceType,
  AdminTimelineEvent,
  AdminTimelineEventStatus,
  AdminVideoRecord,
} from "@/types/admin"
import type { MissionTimelineEvent, TimelineEventType } from "@/types/space"

type LiveStateWithLogs = Prisma.LiveMissionStateGetPayload<Record<string, never>>
type LiveEventLogWithActor = Prisma.LiveMissionEventLogGetPayload<{
  include: { actor: true }
}>

export interface LiveMissionAdminData {
  launches: AdminLaunchRecord[]
  selectedLaunch?: AdminLaunchRecord
  state?: AdminLiveMissionState
  timeline: AdminTimelineEvent[]
  eventLogs: AdminLiveMissionEventLog[]
  approvedVideos: AdminVideoRecord[]
}

function fromDb(value: string) {
  return value.toLowerCase()
}

function inputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(maskSensitiveJson(value))) as Prisma.InputJsonValue
}

function mapLiveState(state: LiveStateWithLogs): AdminLiveMissionState {
  return {
    id: state.id,
    launchId: state.launchId,
    mode: fromDb(state.mode) as AdminLiveMissionMode,
    countdownTargetUtc: state.countdownTargetUtc.toISOString(),
    t0Utc: state.t0Utc?.toISOString(),
    currentMissionTimeSeconds: state.currentMissionTimeSeconds ?? undefined,
    activeTimelineEventId: state.activeTimelineEventId ?? undefined,
    currentPhase: state.currentPhase ?? undefined,
    animationProgress: state.animationProgress,
    streamStatus: fromDb(state.streamStatus) as AdminLiveMissionStreamStatus,
    manualOverrideEnabled: state.manualOverrideEnabled,
    publicBanner:
      state.publicBannerEn || state.publicBannerRu
        ? {
            en: state.publicBannerEn ?? state.publicBannerRu ?? "",
            ru: state.publicBannerRu ?? state.publicBannerEn ?? "",
          }
        : undefined,
    internalNotes: state.internalNotes ?? undefined,
    lastUpdatedById: state.lastUpdatedById ?? undefined,
    updatedAt: state.updatedAt.toISOString(),
  }
}

function mapLiveEventLog(entry: LiveEventLogWithActor): AdminLiveMissionEventLog {
  return {
    id: entry.id,
    launchId: entry.launchId,
    timelineEventId: entry.timelineEventId ?? undefined,
    eventType: entry.eventType,
    previousStatus: entry.previousStatus
      ? (fromDb(entry.previousStatus) as AdminTimelineEventStatus)
      : undefined,
    newStatus: entry.newStatus ? (fromDb(entry.newStatus) as AdminTimelineEventStatus) : undefined,
    missionTimeSeconds: entry.missionTimeSeconds ?? undefined,
    note:
      entry.noteEn || entry.noteRu
        ? {
            en: entry.noteEn ?? entry.noteRu ?? "",
            ru: entry.noteRu ?? entry.noteEn ?? "",
          }
        : undefined,
    sourceType: fromDb(entry.sourceType) as AdminLiveMissionSourceType,
    actorName: entry.actor?.name,
    actorEmail: entry.actor?.email ?? undefined,
    createdAt: entry.createdAt.toISOString(),
  }
}

function publicTimelineType(type: string): TimelineEventType {
  if (type === "PAYLOAD_DEPLOY") return "payload_deployment"
  const normalized = type.toLowerCase()
  if (
    [
      "liftoff",
      "max_q",
      "meco",
      "stage_separation",
      "ses",
      "seco",
      "landing_burn",
      "booster_landing",
    ].includes(normalized)
  ) {
    return normalized as TimelineEventType
  }

  return "custom"
}

function timelineForAnimation(events: DbMissionTimelineEvent[]) {
  return events.map(
    (event): MissionTimelineEvent => ({
      id: event.id,
      type: publicTimelineType(event.type),
      title: { en: "", ru: "" },
      description: { en: "", ru: "" },
      relativeTime: event.relativeTime,
      status: fromDb(event.status) as MissionTimelineEvent["status"],
      confidenceLevel: fromDb(event.confidenceLevel) as MissionTimelineEvent["confidenceLevel"],
    })
  )
}

function modeToPrisma(value: AdminLiveMissionMode) {
  return value.toUpperCase() as Prisma.LiveMissionStateCreateInput["mode"]
}

function streamStatusToPrisma(value: AdminLiveMissionStreamStatus) {
  return value.toUpperCase() as Prisma.LiveMissionStateCreateInput["streamStatus"]
}

async function writeAudit(
  tx: Prisma.TransactionClient,
  input: {
    actorId: string
    action?: "CREATE" | "UPDATE" | "OVERRIDE"
    entityType?: "LAUNCH" | "TIMELINE_EVENT"
    entityId: string
    before?: unknown
    after?: unknown
    reason: string
    metadata?: unknown
  }
) {
  await tx.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action ?? "UPDATE",
      entityType: input.entityType ?? "LAUNCH",
      entityId: input.entityId,
      before: input.before ? inputJson(input.before) : undefined,
      after: input.after ? inputJson(input.after) : undefined,
      reason: input.reason,
      metadata: input.metadata ? inputJson(input.metadata) : undefined,
    },
  })
  logger.info("live_mission_admin_action", {
    actorId: input.actorId,
    action: input.action ?? "UPDATE",
    entityType: input.entityType ?? "LAUNCH",
    entityId: input.entityId,
    reason: input.reason,
  })
}

async function ensureLiveMissionState(
  tx: Prisma.TransactionClient,
  launchId: string,
  actorId: string
) {
  const launch = await tx.launch.findUnique({
    where: { id: launchId },
    select: { id: true, launchDateTimeUtc: true },
  })

  if (!launch) {
    throw new Error("Launch not found.")
  }

  const existing = await tx.liveMissionState.findUnique({ where: { launchId } })
  if (existing) return existing

  return tx.liveMissionState.create({
    data: {
      launchId,
      countdownTargetUtc: launch.launchDateTimeUtc,
      t0Utc: launch.launchDateTimeUtc,
      mode: "PLANNED",
      streamStatus: "UNAVAILABLE",
      lastUpdatedById: actorId,
    },
  })
}

export async function getLiveMissionAdminData(
  selectedLaunchId?: string
): Promise<LiveMissionAdminData> {
  const launchesDb = await prisma.launch.findMany({
    include: { sourceRecords: true },
    orderBy: [{ launchDateTimeUtc: "asc" }],
  })
  const launches = launchesDb.map(launchFromDb)
  const fallbackLaunch =
    launchesDb.find((launch) => launch.launchDateTimeUtc.getTime() >= Date.now()) ?? launchesDb[0]
  const selectedLaunchDb =
    launchesDb.find((launch) => launch.id === selectedLaunchId) ?? fallbackLaunch

  if (!selectedLaunchDb) {
    return { launches, timeline: [], eventLogs: [], approvedVideos: [] }
  }

  const [state, timelineDb, logsDb, videosDb] = await Promise.all([
    prisma.liveMissionState.findUnique({ where: { launchId: selectedLaunchDb.id } }),
    prisma.missionTimelineEvent.findMany({
      where: { launchId: selectedLaunchDb.id },
      orderBy: [{ sortOrder: "asc" }, { relativeTime: "asc" }],
    }),
    prisma.liveMissionEventLog.findMany({
      where: { launchId: selectedLaunchDb.id },
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.videoRecord.findMany({
      where: {
        launchId: selectedLaunchDb.id,
        isApproved: true,
        publishStatus: { in: ["APPROVED", "PUBLISHED"] },
      },
      include: { launch: { select: { missionName: true } } },
      orderBy: [{ publishStatus: "desc" }, { updatedAt: "desc" }],
    }),
  ])

  return {
    launches,
    selectedLaunch: launches.find((launch) => launch.id === selectedLaunchDb.id),
    state: state ? mapLiveState(state) : undefined,
    timeline: timelineDb.map(timelineEventFromDb),
    eventLogs: logsDb.map(mapLiveEventLog),
    approvedVideos: videosDb.map(videoFromDb),
  }
}

export async function initializeLiveMissionState(launchId: string, actorId: string) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.liveMissionState.findUnique({ where: { launchId } })
    const state = await ensureLiveMissionState(tx, launchId, actorId)

    await tx.liveMissionEventLog.create({
      data: {
        launchId,
        eventType: "state_initialized",
        sourceType: "PLANNED",
        actorId,
        noteEn: "Live mission state initialized for manual/admin control.",
        noteRu: "Live mission state initialized for manual/admin control.",
      },
    })

    await writeAudit(tx, {
      actorId,
      action: before ? "UPDATE" : "CREATE",
      entityId: launchId,
      before,
      after: state,
      reason: "Initialized Live Mission Mode state.",
    })

    return mapLiveState(state)
  })
}

export async function updateLiveMissionMode(
  launchId: string,
  mode: AdminLiveMissionMode,
  actorId: string
) {
  return prisma.$transaction(async (tx) => {
    await ensureLiveMissionState(tx, launchId, actorId)
    const before = await tx.liveMissionState.findUnique({ where: { launchId } })
    const state = await tx.liveMissionState.update({
      where: { launchId },
      data: {
        mode: modeToPrisma(mode),
        manualOverrideEnabled: true,
        lastUpdatedById: actorId,
        ...(mode === "live" ? { t0Utc: new Date(), streamStatus: "LIVE" as const } : {}),
        ...(mode === "completed" ? { streamStatus: "ENDED" as const } : {}),
        ...(mode === "replay" ? { streamStatus: "REPLAY" as const } : {}),
      },
    })

    if (mode === "live" || mode === "delayed" || mode === "scrubbed") {
      await tx.launch.update({
        where: { id: launchId },
        data: { status: prismaEnum.launchStatus(mode) },
      })
    }

    await tx.liveMissionEventLog.create({
      data: {
        launchId,
        eventType: `mode_${mode}`,
        sourceType: "MANUAL_OVERRIDE",
        actorId,
      },
    })

    await writeAudit(tx, {
      actorId,
      action: "OVERRIDE",
      entityId: launchId,
      before,
      after: state,
      reason: `Live mission mode set to ${mode}.`,
    })

    return mapLiveState(state)
  })
}

export async function updateLiveMissionTiming(input: {
  launchId: string
  countdownTargetUtc: Date
  t0Utc?: Date
  internalNotes?: string
  actorId: string
}) {
  return prisma.$transaction(async (tx) => {
    await ensureLiveMissionState(tx, input.launchId, input.actorId)
    const before = await tx.liveMissionState.findUnique({ where: { launchId: input.launchId } })
    const state = await tx.liveMissionState.update({
      where: { launchId: input.launchId },
      data: {
        countdownTargetUtc: input.countdownTargetUtc,
        t0Utc: input.t0Utc ?? input.countdownTargetUtc,
        internalNotes: input.internalNotes,
        mode: "DELAYED",
        manualOverrideEnabled: true,
        lastUpdatedById: input.actorId,
      },
    })

    await tx.launch.update({
      where: { id: input.launchId },
      data: {
        launchDateTimeUtc: input.countdownTargetUtc,
        status: "DELAYED",
        manualOverride: true,
      },
    })

    await tx.liveMissionEventLog.create({
      data: {
        launchId: input.launchId,
        eventType: "launch_delayed",
        sourceType: "MANUAL_OVERRIDE",
        actorId: input.actorId,
        noteEn: input.internalNotes,
        noteRu: input.internalNotes,
      },
    })

    await writeAudit(tx, {
      actorId: input.actorId,
      action: "OVERRIDE",
      entityId: input.launchId,
      before,
      after: state,
      reason: "Updated mission countdown target/T-0.",
    })

    return mapLiveState(state)
  })
}

export async function updateLiveMissionStreamStatus(
  launchId: string,
  streamStatus: AdminLiveMissionStreamStatus,
  actorId: string
) {
  return prisma.$transaction(async (tx) => {
    await ensureLiveMissionState(tx, launchId, actorId)
    const before = await tx.liveMissionState.findUnique({ where: { launchId } })
    const state = await tx.liveMissionState.update({
      where: { launchId },
      data: {
        streamStatus: streamStatusToPrisma(streamStatus),
        manualOverrideEnabled: true,
        lastUpdatedById: actorId,
      },
    })

    await tx.liveMissionEventLog.create({
      data: {
        launchId,
        eventType: `stream_${streamStatus}`,
        sourceType: "MANUAL_OVERRIDE",
        actorId,
      },
    })

    await writeAudit(tx, {
      actorId,
      action: "OVERRIDE",
      entityId: launchId,
      before,
      after: state,
      reason: `Stream status set to ${streamStatus}.`,
    })

    return mapLiveState(state)
  })
}

export async function updateLiveMissionBanner(input: {
  launchId: string
  publicBannerEn?: string
  publicBannerRu?: string
  actorId: string
}) {
  return prisma.$transaction(async (tx) => {
    await ensureLiveMissionState(tx, input.launchId, input.actorId)
    const before = await tx.liveMissionState.findUnique({ where: { launchId: input.launchId } })
    const state = await tx.liveMissionState.update({
      where: { launchId: input.launchId },
      data: {
        publicBannerEn: input.publicBannerEn || null,
        publicBannerRu: input.publicBannerRu || null,
        manualOverrideEnabled: true,
        lastUpdatedById: input.actorId,
      },
    })

    await writeAudit(tx, {
      actorId: input.actorId,
      action: "UPDATE",
      entityId: input.launchId,
      before,
      after: state,
      reason: "Updated public live mission banner.",
    })

    return mapLiveState(state)
  })
}

export async function clearLiveMissionBanner(launchId: string, actorId: string) {
  return updateLiveMissionBanner({ launchId, actorId })
}

export async function setLiveMissionActiveEvent(input: {
  launchId: string
  timelineEventId: string
  actorId: string
}) {
  return prisma.$transaction(async (tx) => {
    await ensureLiveMissionState(tx, input.launchId, input.actorId)
    const event = await tx.missionTimelineEvent.findFirst({
      where: { id: input.timelineEventId, launchId: input.launchId },
    })
    if (!event) throw new Error("Timeline event not found.")

    const missionTimeSeconds = parseRelativeMissionTime(event.relativeTime)
    const events = await tx.missionTimelineEvent.findMany({
      where: { launchId: input.launchId },
      orderBy: [{ sortOrder: "asc" }, { relativeTime: "asc" }],
    })
    const animation = computeAnimationProgress(
      timelineForAnimation(events),
      missionTimeSeconds,
      "live"
    )
    const before = await tx.liveMissionState.findUnique({ where: { launchId: input.launchId } })
    const state = await tx.liveMissionState.update({
      where: { launchId: input.launchId },
      data: {
        activeTimelineEventId: event.id,
        currentMissionTimeSeconds: missionTimeSeconds,
        currentPhase: animation.phase,
        animationProgress: Math.round(animation.progressPercent),
        manualOverrideEnabled: true,
        lastUpdatedById: input.actorId,
      },
    })

    await tx.liveMissionEventLog.create({
      data: {
        launchId: input.launchId,
        timelineEventId: event.id,
        eventType: "active_event_set",
        missionTimeSeconds,
        sourceType: "MANUAL_OVERRIDE",
        actorId: input.actorId,
      },
    })

    await writeAudit(tx, {
      actorId: input.actorId,
      action: "OVERRIDE",
      entityType: "TIMELINE_EVENT",
      entityId: event.id,
      before,
      after: state,
      reason: "Set active live mission timeline event.",
      metadata: { launchId: input.launchId },
    })

    return mapLiveState(state)
  })
}

export async function updateLiveTimelineEventStatus(input: {
  launchId: string
  timelineEventId: string
  status: AdminTimelineEventStatus
  noteEn?: string
  noteRu?: string
  actorId: string
}) {
  return prisma.$transaction(async (tx) => {
    await ensureLiveMissionState(tx, input.launchId, input.actorId)
    const beforeEvent = await tx.missionTimelineEvent.findFirst({
      where: { id: input.timelineEventId, launchId: input.launchId },
    })
    if (!beforeEvent) throw new Error("Timeline event not found.")

    const updatedEvent = await tx.missionTimelineEvent.update({
      where: { id: input.timelineEventId },
      data: {
        status: prismaEnum.timelineStatus(input.status),
        approvalStatus: input.status === "confirmed" ? "APPROVED" : undefined,
      },
    })

    const missionTimeSeconds = parseRelativeMissionTime(updatedEvent.relativeTime)
    const events = await tx.missionTimelineEvent.findMany({
      where: { launchId: input.launchId },
      orderBy: [{ sortOrder: "asc" }, { relativeTime: "asc" }],
    })
    const animation = computeAnimationProgress(
      timelineForAnimation(events),
      missionTimeSeconds,
      "live"
    )

    const sourceType: Prisma.LiveMissionEventLogCreateInput["sourceType"] =
      input.status === "confirmed"
        ? "ADMIN_CONFIRMED"
        : input.status === "estimated"
          ? "ESTIMATED"
          : "MANUAL_OVERRIDE"

    await tx.liveMissionState.update({
      where: { launchId: input.launchId },
      data: {
        activeTimelineEventId: updatedEvent.id,
        currentMissionTimeSeconds: missionTimeSeconds,
        currentPhase: animation.phase,
        animationProgress: Math.round(animation.progressPercent),
        manualOverrideEnabled: true,
        lastUpdatedById: input.actorId,
      },
    })

    await tx.liveMissionEventLog.create({
      data: {
        launchId: input.launchId,
        timelineEventId: updatedEvent.id,
        eventType: `event_${input.status}`,
        previousStatus: beforeEvent.status,
        newStatus: updatedEvent.status,
        missionTimeSeconds,
        sourceType,
        actorId: input.actorId,
        noteEn: input.noteEn,
        noteRu: input.noteRu,
      },
    })

    await writeAudit(tx, {
      actorId: input.actorId,
      action: input.status === "confirmed" ? "UPDATE" : "OVERRIDE",
      entityType: "TIMELINE_EVENT",
      entityId: updatedEvent.id,
      before: beforeEvent,
      after: updatedEvent,
      reason: `Live mission event marked ${input.status}.`,
      metadata: {
        launchId: input.launchId,
        missionTimeSeconds,
        sourceType,
      },
    })

    return timelineEventFromDb(updatedEvent)
  })
}

export async function completeLiveMission(input: {
  launchId: string
  result: "success" | "failure" | "partial_success"
  actorId: string
}) {
  return prisma.$transaction(async (tx) => {
    await ensureLiveMissionState(tx, input.launchId, input.actorId)
    const before = await tx.liveMissionState.findUnique({ where: { launchId: input.launchId } })
    const state = await tx.liveMissionState.update({
      where: { launchId: input.launchId },
      data: {
        mode: "COMPLETED",
        streamStatus: "ENDED",
        animationProgress: 100,
        manualOverrideEnabled: true,
        lastUpdatedById: input.actorId,
      },
    })

    await tx.launch.update({
      where: { id: input.launchId },
      data: {
        status: prismaEnum.launchStatus(input.result),
        manualOverride: true,
      },
    })

    await tx.liveMissionEventLog.create({
      data: {
        launchId: input.launchId,
        eventType: `mission_${input.result}`,
        sourceType: "MANUAL_OVERRIDE",
        actorId: input.actorId,
      },
    })

    await writeAudit(tx, {
      actorId: input.actorId,
      action: "OVERRIDE",
      entityId: input.launchId,
      before,
      after: state,
      reason: `Mission result set to ${input.result}.`,
    })

    return mapLiveState(state)
  })
}
