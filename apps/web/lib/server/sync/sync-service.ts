import type {
  AdminLaunchStatus,
  DataConfidenceLevel as PrismaConfidenceLevel,
  ExternalImportSyncStatus,
  ExternalSyncRunStatus,
  Prisma,
} from "@prisma/client"

import { conflictFromDb, launchFromDb } from "@/lib/admin/prisma-mappers"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/server/logger"
import { detectLaunchConflicts } from "@/lib/server/sync/conflicts"
import { fetchLaunchLibraryByMode } from "@/lib/server/sync/launch-library"
import {
  hashNormalizedLaunch,
  normalizeLaunchLibraryLaunch,
  slugify,
} from "@/lib/server/sync/normalizers"
import type {
  DetectedLaunchConflict,
  LaunchLibraryLaunch,
  LaunchLibrarySyncSummary,
  NormalizedLaunch,
  SyncDashboardRun,
  SyncMode,
} from "@/lib/server/sync/types"
import { LAUNCH_LIBRARY_PROVIDER } from "@/lib/server/sync/types"

type Tx = Prisma.TransactionClient

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

function toLaunchStatus(value: NormalizedLaunch["status"]): AdminLaunchStatus {
  return value.toUpperCase() as AdminLaunchStatus
}

function toConfidence(value: NormalizedLaunch["confidenceLevel"]): PrismaConfidenceLevel {
  return value.toUpperCase() as PrismaConfidenceLevel
}

function toSyncStatus(value: ExternalImportSyncStatus): ExternalImportSyncStatus {
  return value
}

function sourceLaunchId(externalId: string) {
  return `launch-library:${externalId}`
}

function importedSourceUrl(launch: NormalizedLaunch) {
  return launch.sourceUrl ?? launch.externalUrl ?? `${process.env.LAUNCH_LIBRARY_BASE_URL ?? "https://ll.thespacedevs.com/2.3.0"}/launches/${launch.externalId}/`
}

async function uniqueSlug(tx: Tx, baseSlug: string, existingId?: string) {
  const base = slugify(baseSlug) || "launch-library-import"

  for (let index = 0; index < 50; index += 1) {
    const slug = index === 0 ? base : `${base}-${index + 1}`
    const existing = await tx.launch.findUnique({ where: { slug }, select: { id: true } })

    if (!existing || existing.id === existingId) {
      return slug
    }
  }

  return `${base}-${Date.now()}`
}

async function findExistingLaunch(tx: Tx, launch: NormalizedLaunch) {
  const byExternal = await tx.launch.findFirst({
    where: {
      OR: [
        { externalProvider: "LAUNCH_LIBRARY", externalId: launch.externalId },
        { sourceLaunchId: sourceLaunchId(launch.externalId) },
      ],
    },
  })

  if (byExternal) return byExternal

  const bySlug = await tx.launch.findUnique({ where: { slug: launch.slug } })
  if (bySlug) return bySlug

  const launchTime = launch.launchDateTimeUtc.getTime()
  const candidates = await tx.launch.findMany({
    where: {
      launchDateTimeUtc: {
        gte: new Date(launchTime - 12 * 60 * 60 * 1000),
        lte: new Date(launchTime + 12 * 60 * 60 * 1000),
      },
    },
    take: 20,
  })
  const missionName = launch.missionName.en.toLowerCase()

  return candidates.find((candidate) => {
    if (candidate.missionName && typeof candidate.missionName === "object" && !Array.isArray(candidate.missionName)) {
      const candidateName = (candidate.missionName as Record<string, unknown>).en
      return typeof candidateName === "string" && candidateName.toLowerCase() === missionName
    }

    return false
  })
}

async function upsertLaunchLibrarySource(tx: Tx, launchId: string, launch: NormalizedLaunch) {
  const url = importedSourceUrl(launch)
  const existing = await tx.sourceRecord.findFirst({
    where: {
      launchId,
      kind: "LAUNCH_LIBRARY",
      url,
    },
  })

  const data = {
    launchId,
    kind: "LAUNCH_LIBRARY" as const,
    title: json(launch.sourceTitle),
    publisher: "The Space Devs Launch Library 2",
    url,
    retrievedAt: new Date(),
    confidenceLevel: "ESTIMATED" as const,
    isPrimary: false,
    notes: "Imported from Launch Library 2. Admin verification required before publication.",
    sourceType: "API" as const,
    trustLevel: "SECONDARY" as const,
    lastCheckedAt: new Date(),
  }

  if (existing) {
    await tx.sourceRecord.update({ where: { id: existing.id }, data })
    return
  }

  await tx.sourceRecord.create({ data })
}

async function createOrUpdateConflict(
  tx: Tx,
  launchId: string,
  conflict: DetectedLaunchConflict
) {
  const sources = [
    {
      sourceName: "Current database record",
      value: conflict.existingValue,
      trustLevel: "primary",
    },
    {
      sourceName: "The Space Devs Launch Library 2",
      value: conflict.importedValue,
      trustLevel: "secondary",
    },
  ]
  const summary = `Launch Library value for ${conflict.field} differs from current admin-reviewed data.`
  const existing = await tx.sourceConflict.findFirst({
    where: {
      entityType: "LAUNCH",
      entityId: launchId,
      field: conflict.field,
      status: { not: "RESOLVED" },
    },
  })

  if (existing) {
    await tx.sourceConflict.update({
      where: { id: existing.id },
      data: {
        sources: json(sources),
        summary,
        status: "OPEN",
      },
    })
    return
  }

  await tx.sourceConflict.create({
    data: {
      entityType: "LAUNCH",
      entityId: launchId,
      field: conflict.field,
      sources: json(sources),
      summary,
      status: "OPEN",
    },
  })
}

async function createImportRecord(
  tx: Tx,
  input: {
    syncRunId: string
    actorId?: string
    raw: LaunchLibraryLaunch
    normalized: NormalizedLaunch
    hash: string
    entityId?: string
  }
) {
  await tx.externalImportRecord.create({
    data: {
      provider: "LAUNCH_LIBRARY",
      externalId: input.normalized.externalId,
      entityType: "LAUNCH",
      entityId: input.entityId,
      importBatchId: input.syncRunId,
      syncRunId: input.syncRunId,
      rawJson: json(input.raw),
      normalizedJson: json(input.normalized),
      hash: input.hash,
    },
  })
}

function launchUpdateData(
  launch: NormalizedLaunch,
  hash: string,
  syncRunId: string,
  status: ExternalImportSyncStatus
) {
  return {
    sourceLaunchId: sourceLaunchId(launch.externalId),
    missionName: json(launch.missionName),
    contentTitle: json(launch.missionName),
    contentDescription: json(launch.missionDescription),
    seoTitle: json(launch.missionName),
    metaDescription: json(launch.missionDescription),
    rocket: json(launch.rocket),
    launchPad: json(launch.launchPad),
    launchDateTimeUtc: launch.launchDateTimeUtc,
    localTimeDisplayHelper: "Render viewer-local time from imported UTC value.",
    trajectory: json(launch.trajectory),
    orbit: launch.orbit,
    payload: json(launch.payload),
    missionDescription: json(launch.missionDescription),
    officialUrl: launch.officialUrl,
    youtubeUrlOrVideoId: launch.youtubeUrlOrVideoId,
    confidenceLevel: toConfidence(launch.confidenceLevel),
    status: toLaunchStatus(launch.status),
    isPublished: false,
    isMock: false,
    externalProvider: "LAUNCH_LIBRARY" as const,
    externalId: launch.externalId,
    importedAt: new Date(),
    lastSyncedAt: new Date(),
    syncStatus: toSyncStatus(status),
    syncHash: hash,
    importBatchId: syncRunId,
    externalRawJson: json(launch.externalMetadata),
  }
}

async function processImportedLaunch(
  tx: Tx,
  input: {
    syncRunId: string
    actorId?: string
    raw: LaunchLibraryLaunch
    normalized: NormalizedLaunch
    hash: string
  }
) {
  const existing = await findExistingLaunch(tx, input.normalized)

  if (!existing) {
    const slug = await uniqueSlug(tx, input.normalized.slug)
    const launch = await tx.launch.create({
      data: {
        ...launchUpdateData(input.normalized, input.hash, input.syncRunId, "IMPORTED"),
        slug,
        publishStatus: "DRAFT",
      },
    })
    await upsertLaunchLibrarySource(tx, launch.id, input.normalized)
    await createImportRecord(tx, { ...input, entityId: launch.id })
    await tx.auditLog.create({
      data: {
        actorId: input.actorId,
        action: "CREATE",
        entityType: "LAUNCH",
        entityId: launch.id,
        reason: "Launch Library import created an unpublished draft.",
        metadata: json({
          provider: LAUNCH_LIBRARY_PROVIDER,
          externalId: input.normalized.externalId,
          syncRunId: input.syncRunId,
        }),
      },
    })
    return { imported: 1, updated: 0, skipped: 0, conflicts: 0, errors: 0 }
  }

  const protectedRecord =
    existing.isPublished ||
    existing.publishStatus === "PUBLISHED" ||
    existing.publishStatus === "APPROVED"

  if (protectedRecord) {
    const conflicts = detectLaunchConflicts(existing, input.normalized)
    for (const conflict of conflicts) {
      await createOrUpdateConflict(tx, existing.id, conflict)
    }
    await tx.launch.update({
      where: { id: existing.id },
      data: {
        externalProvider: "LAUNCH_LIBRARY",
        externalId: input.normalized.externalId,
        lastSyncedAt: new Date(),
        syncStatus: conflicts.length > 0 ? "CONFLICT" : "SKIPPED",
        syncHash: input.hash,
        importBatchId: input.syncRunId,
        externalRawJson: json(input.normalized.externalMetadata),
      },
    })
    await upsertLaunchLibrarySource(tx, existing.id, input.normalized)
    await createImportRecord(tx, { ...input, entityId: existing.id })
    await tx.auditLog.create({
      data: {
        actorId: input.actorId,
        action: "UPDATE",
        entityType: "LAUNCH",
        entityId: existing.id,
        reason:
          conflicts.length > 0
            ? "Launch Library import detected conflicts and did not overwrite approved/published data."
            : "Launch Library import matched protected data; no field overwrite performed.",
        metadata: json({
          provider: LAUNCH_LIBRARY_PROVIDER,
          externalId: input.normalized.externalId,
          syncRunId: input.syncRunId,
          conflictFields: conflicts.map((conflict) => conflict.field),
        }),
      },
    })
    return {
      imported: 0,
      updated: 0,
      skipped: conflicts.length > 0 ? 0 : 1,
      conflicts: conflicts.length,
      errors: 0,
    }
  }

  const slug = await uniqueSlug(tx, input.normalized.slug, existing.id)
  const launch = await tx.launch.update({
    where: { id: existing.id },
    data: {
      ...launchUpdateData(input.normalized, input.hash, input.syncRunId, "UPDATED"),
      slug,
      publishStatus: existing.publishStatus,
    },
  })
  await upsertLaunchLibrarySource(tx, launch.id, input.normalized)
  await createImportRecord(tx, { ...input, entityId: launch.id })
  await tx.auditLog.create({
    data: {
      actorId: input.actorId,
      action: "UPDATE",
      entityType: "LAUNCH",
      entityId: launch.id,
      reason: "Launch Library import updated an unpublished draft/imported record.",
      metadata: json({
        provider: LAUNCH_LIBRARY_PROVIDER,
        externalId: input.normalized.externalId,
        syncRunId: input.syncRunId,
      }),
    },
  })

  return { imported: 0, updated: 1, skipped: 0, conflicts: 0, errors: 0 }
}

function emptySummary(mode: SyncMode, dryRun: boolean): LaunchLibrarySyncSummary {
  return {
    provider: LAUNCH_LIBRARY_PROVIDER,
    mode,
    dryRun,
    fetchedCount: 0,
    importedCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    conflictCount: 0,
    errorCount: 0,
    errorMessages: [],
  }
}

export async function runLaunchLibrarySync({
  mode = "upcoming",
  requestedById,
  dryRun = false,
  limit = 25,
}: {
  mode?: SyncMode
  requestedById?: string
  dryRun?: boolean
  limit?: number
}): Promise<LaunchLibrarySyncSummary> {
  const summary = emptySummary(mode, dryRun)

  if (dryRun) {
    const rawLaunches = await fetchLaunchLibraryByMode(mode, limit)
    const normalized = rawLaunches.map(normalizeLaunchLibraryLaunch)
    return {
      ...summary,
      fetchedCount: rawLaunches.length,
      skippedCount: normalized.length,
    }
  }

  const syncRun = await prisma.externalSyncRun.create({
    data: {
      provider: "LAUNCH_LIBRARY",
      status: "RUNNING",
      requestedById,
      metadataJson: json({ mode, limit }),
    },
  })
  summary.syncRunId = syncRun.id

  await prisma.auditLog.create({
    data: {
      actorId: requestedById,
      action: "CREATE",
      entityType: "EXTERNAL_SYNC_RUN",
      entityId: syncRun.id,
      reason: "Manual Launch Library sync started.",
      metadata: json({ mode, limit, provider: LAUNCH_LIBRARY_PROVIDER }),
    },
  })

  try {
    const rawLaunches = await fetchLaunchLibraryByMode(mode, limit)
    summary.fetchedCount = rawLaunches.length

    for (const raw of rawLaunches) {
      try {
        const normalized = normalizeLaunchLibraryLaunch(raw)
        const hash = hashNormalizedLaunch(normalized)
        const result = await prisma.$transaction((tx) =>
          processImportedLaunch(tx, {
            syncRunId: syncRun.id,
            raw,
            normalized,
            hash,
            actorId: requestedById,
          })
        )

        summary.importedCount += result.imported
        summary.updatedCount += result.updated
        summary.skippedCount += result.skipped
        summary.conflictCount += result.conflicts
        summary.errorCount += result.errors
      } catch (error) {
        summary.errorCount += 1
        const message = error instanceof Error ? error.message : "Unknown import error"
        summary.errorMessages.push(message)
        logger.warn("launch_library_candidate_import_failed", { message })
      }
    }

    const status: ExternalSyncRunStatus =
      summary.errorCount > 0
        ? summary.importedCount + summary.updatedCount + summary.skippedCount + summary.conflictCount > 0
          ? "PARTIAL"
          : "FAILED"
        : "SUCCESS"

    await prisma.externalSyncRun.update({
      where: { id: syncRun.id },
      data: {
        status,
        finishedAt: new Date(),
        importedCount: summary.importedCount,
        updatedCount: summary.updatedCount,
        skippedCount: summary.skippedCount,
        conflictCount: summary.conflictCount,
        errorCount: summary.errorCount,
        errorMessage: summary.errorMessages[0],
      },
    })
    await prisma.auditLog.create({
      data: {
        actorId: requestedById,
        action: "UPDATE",
        entityType: "EXTERNAL_SYNC_RUN",
        entityId: syncRun.id,
        reason: "Manual Launch Library sync finished.",
        metadata: json(summary),
      },
    })

    return summary
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Launch Library sync error"
    summary.errorCount += 1
    summary.errorMessages.push(message)
    logger.error("launch_library_sync_failed", { message, syncRunId: syncRun.id })

    await prisma.externalSyncRun.update({
      where: { id: syncRun.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorCount: summary.errorCount,
        errorMessage: message,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: requestedById,
        action: "UPDATE",
        entityType: "EXTERNAL_SYNC_RUN",
        entityId: syncRun.id,
        reason: "Manual Launch Library sync failed.",
        metadata: json({ message }),
      },
    })

    return summary
  }
}

export async function getExternalSyncDashboardData() {
  const [runs, launches, conflicts] = await Promise.all([
    prisma.externalSyncRun.findMany({
      include: { requestedBy: true },
      orderBy: { startedAt: "desc" },
      take: 10,
    }),
    prisma.launch.findMany({
      where: {
        externalProvider: "LAUNCH_LIBRARY",
        isPublished: false,
      },
      include: { sourceRecords: true },
      orderBy: [{ lastSyncedAt: "desc" }, { importedAt: "desc" }],
      take: 25,
    }),
    prisma.sourceConflict.findMany({
      where: {
        entityType: "LAUNCH",
        status: { not: "RESOLVED" },
      },
      orderBy: { updatedAt: "desc" },
      take: 25,
    }),
  ])

  return {
    syncEnabled: process.env.ENABLE_EXTERNAL_SYNC === "true",
    runs: runs.map(
      (run): SyncDashboardRun => ({
        id: run.id,
        provider: run.provider.toLowerCase() as SyncDashboardRun["provider"],
        status: run.status.toLowerCase() as SyncDashboardRun["status"],
        startedAt: run.startedAt.toISOString(),
        finishedAt: run.finishedAt?.toISOString(),
        requestedByEmail: run.requestedBy?.email ?? undefined,
        importedCount: run.importedCount,
        updatedCount: run.updatedCount,
        skippedCount: run.skippedCount,
        conflictCount: run.conflictCount,
        errorCount: run.errorCount,
        errorMessage: run.errorMessage ?? undefined,
      })
    ),
    importedLaunches: launches.map(launchFromDb),
    conflicts: conflicts.map(conflictFromDb),
  }
}
