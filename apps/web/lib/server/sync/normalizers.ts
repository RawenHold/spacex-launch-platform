import { createHash } from "node:crypto"

import type { LaunchLibraryLaunch, NormalizedLaunch } from "@/lib/server/sync/types"

function localized(en: string, ru = en) {
  return { en, ru }
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function inferRocketFamily(name: string): NormalizedLaunch["rocket"]["family"] {
  const lower = name.toLowerCase()

  if (lower.includes("starship")) return "starship"
  if (lower.includes("falcon heavy")) return "falcon_heavy"
  if (lower.includes("dragon") || lower.includes("crew")) return "dragon_crew"
  if (lower.includes("starlink")) return "starlink"
  if (lower.includes("falcon 9")) return "falcon_9"

  return "other"
}

function mapStatus(launch: LaunchLibraryLaunch): NormalizedLaunch["status"] {
  const status = `${launch.status?.name ?? ""} ${launch.status?.abbrev ?? ""}`.toLowerCase()

  if (status.includes("partial")) return "partial_success"
  if (status.includes("success")) return "success"
  if (status.includes("fail")) return "failure"
  if (status.includes("scrub")) return "scrubbed"
  if (status.includes("hold") || status.includes("delay")) return "delayed"
  if (status.includes("in flight")) return "live"
  if (status.includes("go") || status.includes("confirmed")) return "confirmed"
  if (status.includes("tbc") || status.includes("tbd") || status.includes("to be")) {
    return "scheduled"
  }

  return launch.net ? "scheduled" : "draft"
}

function firstUsefulUrl(
  urls: LaunchLibraryLaunch["infoURLs"] | LaunchLibraryLaunch["vidURLs"],
  preferredSources: string[]
) {
  const values = urls ?? []
  const preferred = values.find((entry) =>
    preferredSources.some((source) =>
      `${entry.source ?? ""} ${entry.url ?? ""}`.toLowerCase().includes(source)
    )
  )

  return preferred?.url ?? values.find((entry) => entry.url)?.url
}

function rocketName(launch: LaunchLibraryLaunch) {
  return (
    launch.rocket?.configuration?.full_name ??
    launch.rocket?.configuration?.name ??
    "Unknown vehicle"
  )
}

export function normalizeLaunchLibraryLaunch(launch: LaunchLibraryLaunch): NormalizedLaunch {
  const name = launch.name ?? launch.mission?.name ?? `Launch Library ${launch.id}`
  const net = launch.net ? new Date(launch.net) : new Date()
  const rocket = rocketName(launch)
  const padName = launch.pad?.name ?? "Unknown launch pad"
  const locationName = launch.pad?.location?.name ?? "Unknown location"
  const missionDescription =
    launch.mission?.description ??
    launch.status?.description ??
    "Imported Launch Library record. Admin verification required before publication."
  const orbitName = launch.mission?.orbit?.name ?? launch.mission?.orbit?.abbrev
  const officialUrl = firstUsefulUrl(launch.infoURLs, ["spacex", "nasa", "faa", "official"])
  const webcastUrl = firstUsefulUrl(launch.vidURLs, ["youtube", "spacex"])

  return {
    provider: "launch_library",
    externalId: launch.id,
    externalUrl: launch.url,
    slug: slugify(launch.slug ?? name) || `launch-library-${launch.id}`,
    missionName: localized(name),
    launchDateTimeUtc: Number.isNaN(net.getTime()) ? new Date() : net,
    status: mapStatus(launch),
    confidenceLevel: "estimated",
    rocket: {
      id: slugify(rocket) || "unknown-vehicle",
      name: rocket,
      family: inferRocketFamily(`${rocket} ${name}`),
      variant: launch.rocket?.configuration?.variant,
    },
    launchPad: {
      id: slugify(padName) || "unknown-pad",
      name: padName,
      location: localized(locationName),
    },
    orbit: orbitName,
    trajectory: localized(orbitName ? `${orbitName} trajectory from Launch Library` : "Trajectory imported from Launch Library; admin verification required."),
    payload: localized(launch.mission?.name ?? name),
    missionDescription: localized(missionDescription),
    officialUrl,
    youtubeUrlOrVideoId: webcastUrl,
    sourceTitle: localized(`Launch Library 2 record: ${name}`),
    sourceUrl: launch.url,
    externalMetadata: {
      lastUpdated: launch.last_updated,
      windowStart: launch.window_start,
      windowEnd: launch.window_end,
      status: launch.status,
      launchServiceProvider: launch.launch_service_provider,
      missionType: launch.mission?.type,
      infoURLs: launch.infoURLs,
      vidURLs: launch.vidURLs,
      image: launch.image,
    },
  }
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`
  }

  return JSON.stringify(value)
}

export function hashNormalizedLaunch(launch: NormalizedLaunch) {
  return createHash("sha256").update(stableStringify(launch)).digest("hex")
}
