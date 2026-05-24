import type {
  LaunchLibraryLaunch,
  LaunchLibraryPaginatedResponse,
  SyncMode,
} from "@/lib/server/sync/types"

function launchLibraryBaseUrl() {
  return (process.env.LAUNCH_LIBRARY_BASE_URL ?? "https://ll.thespacedevs.com/2.3.0").replace(/\/$/, "")
}

function launchLibraryHeaders() {
  const apiKey = process.env.LAUNCH_LIBRARY_API_KEY
  const headers: Record<string, string> = {
    Accept: "application/json",
  }

  if (apiKey) {
    headers.Authorization = `Token ${apiKey}`
    headers["X-API-Key"] = apiKey
  }

  return headers
}

function endpointForMode(mode: Exclude<SyncMode, "both">) {
  return mode === "upcoming" ? "launches/upcoming/" : "launches/previous/"
}

function buildLaunchLibraryUrl(mode: Exclude<SyncMode, "both">, limit: number) {
  const url = new URL(`${launchLibraryBaseUrl()}/${endpointForMode(mode)}`)
  url.searchParams.set("format", "json")
  url.searchParams.set("limit", String(Math.min(Math.max(limit, 1), 100)))
  url.searchParams.set("search", "SpaceX")
  url.searchParams.set("ordering", mode === "upcoming" ? "net" : "-net")

  if (mode === "upcoming") {
    url.searchParams.set("hide_recent_previous", "true")
  }

  return url
}

function isSpaceXLaunch(launch: LaunchLibraryLaunch) {
  const haystack = [
    launch.name,
    launch.launch_service_provider?.name,
    launch.launch_service_provider?.abbrev,
    launch.rocket?.configuration?.manufacturer?.name,
    launch.rocket?.configuration?.manufacturer?.abbrev,
    launch.rocket?.configuration?.full_name,
    launch.rocket?.configuration?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return (
    haystack.includes("spacex") ||
    haystack.includes("falcon") ||
    haystack.includes("starship") ||
    haystack.includes("dragon")
  )
}

export async function fetchLaunchLibraryLaunches({
  mode,
  limit = 25,
}: {
  mode: Exclude<SyncMode, "both">
  limit?: number
}) {
  const url = buildLaunchLibraryUrl(mode, limit)
  const response = await fetch(url, {
    headers: launchLibraryHeaders(),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Launch Library request failed with HTTP ${response.status}`)
  }

  const payload = (await response.json()) as LaunchLibraryPaginatedResponse
  return (payload.results ?? []).filter(isSpaceXLaunch)
}

export async function fetchLaunchLibraryByMode(mode: SyncMode, limit = 25) {
  if (mode === "both") {
    const [upcoming, past] = await Promise.all([
      fetchLaunchLibraryLaunches({ mode: "upcoming", limit }),
      fetchLaunchLibraryLaunches({ mode: "past", limit }),
    ])

    return [...upcoming, ...past]
  }

  return fetchLaunchLibraryLaunches({ mode, limit })
}
