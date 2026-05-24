import type { Prisma } from "@prisma/client"

import { localizedFromJson } from "@/lib/admin/prisma-mappers"
import type { DetectedLaunchConflict, NormalizedLaunch } from "@/lib/server/sync/types"

type ExistingLaunch = {
  missionName: Prisma.JsonValue
  launchDateTimeUtc: Date
  rocket: Prisma.JsonValue
  launchPad: Prisma.JsonValue
  status: string
  trajectory: Prisma.JsonValue
  orbit: string | null
  officialUrl: string | null
  youtubeUrlOrVideoId: string | null
}

function jsonRecord(value: Prisma.JsonValue) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function stringField(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function addConflict(
  conflicts: DetectedLaunchConflict[],
  field: string,
  existingValue: string | undefined | null,
  importedValue: string | undefined | null
) {
  const existing = (existingValue ?? "").trim()
  const imported = (importedValue ?? "").trim()

  if (existing && imported && existing !== imported) {
    conflicts.push({ field, existingValue: existing, importedValue: imported })
  }
}

export function detectLaunchConflicts(
  existing: ExistingLaunch,
  imported: NormalizedLaunch
): DetectedLaunchConflict[] {
  const conflicts: DetectedLaunchConflict[] = []
  const existingRocket = jsonRecord(existing.rocket)
  const existingPad = jsonRecord(existing.launchPad)

  addConflict(
    conflicts,
    "missionName",
    localizedFromJson(existing.missionName).en,
    imported.missionName.en
  )
  addConflict(
    conflicts,
    "launchDateUtc",
    existing.launchDateTimeUtc.toISOString(),
    imported.launchDateTimeUtc.toISOString()
  )
  addConflict(conflicts, "rocket", stringField(existingRocket.name), imported.rocket.name)
  addConflict(conflicts, "launchPad", stringField(existingPad.name), imported.launchPad.name)
  addConflict(conflicts, "status", existing.status.toLowerCase(), imported.status)
  addConflict(conflicts, "orbit", existing.orbit, imported.orbit)
  addConflict(
    conflicts,
    "orbitTrajectory",
    localizedFromJson(existing.trajectory).en,
    imported.trajectory.en
  )
  addConflict(conflicts, "officialUrl", existing.officialUrl, imported.officialUrl)
  addConflict(conflicts, "youtubeUrl", existing.youtubeUrlOrVideoId, imported.youtubeUrlOrVideoId)

  return conflicts
}
