import { configuredSpaceXChannelId, getYouTubeVideos, searchYouTubeVideos, youtubeApiConfigured } from "@/lib/server/youtube/client"
import { normalizeYouTubeUrlCandidate, normalizeYouTubeVideoItem } from "@/lib/server/youtube/normalizers"
import type {
  NormalizedVideoCandidate,
  VideoDiscoveryLaunchInput,
} from "@/lib/server/youtube/types"

function searchQueries(launch: VideoDiscoveryLaunchInput) {
  const date = launch.launchDateTimeUtc.slice(0, 10)
  const mission = launch.missionName.en
  const base = [
    mission,
    `${launch.rocketName} ${mission}`,
    `SpaceX ${mission}`,
  ]

  if (mission.toLowerCase().includes("starlink")) {
    base.push(`SpaceX Starlink ${date}`)
  }

  if (mission.toLowerCase().includes("starship") || launch.rocketName.toLowerCase().includes("starship")) {
    base.push(`SpaceX Starship ${mission}`)
  }

  return Array.from(new Set(base))
}

function dedupe(candidates: NormalizedVideoCandidate[]) {
  const seen = new Set<string>()
  const result: NormalizedVideoCandidate[] = []

  for (const candidate of candidates) {
    const key = candidate.providerVideoId ?? candidate.url
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(candidate)
  }

  return result.sort((a, b) => b.confidenceScore - a.confidenceScore)
}

export async function discoverYouTubeCandidatesForLaunch(launch: VideoDiscoveryLaunchInput) {
  const candidates: NormalizedVideoCandidate[] = []
  const messages: string[] = []

  if (launch.youtubeUrlOrVideoId) {
    const fromLaunch = normalizeYouTubeUrlCandidate(
      launch.youtubeUrlOrVideoId,
      launch,
      "launch_field"
    )
    if (fromLaunch) candidates.push(fromLaunch)
  }

  for (const url of launch.externalWebcastUrls ?? []) {
    const fromMetadata = normalizeYouTubeUrlCandidate(url, launch, "launch_library_metadata")
    if (fromMetadata) candidates.push(fromMetadata)
  }

  if (!youtubeApiConfigured()) {
    messages.push("YOUTUBE_API_KEY is not configured; discovery used only existing launch/webcast URLs.")
    return { candidates: dedupe(candidates), messages, apiConfigured: false }
  }

  const channelId = configuredSpaceXChannelId()
  if (!channelId) {
    messages.push("YOUTUBE_SPACEX_CHANNEL_ID is missing; search is broader and lower confidence.")
  }

  const discoveredVideoIds = new Set<string>()
  for (const query of searchQueries(launch)) {
    const searchItems = await searchYouTubeVideos({
      query,
      channelId,
      maxResults: 5,
    })

    for (const item of searchItems) {
      if (item.id?.videoId) discoveredVideoIds.add(item.id.videoId)
    }
  }

  const videos = await getYouTubeVideos(Array.from(discoveredVideoIds))
  candidates.push(
    ...videos.map((video) => normalizeYouTubeVideoItem(video, launch, "youtube_api"))
  )

  return { candidates: dedupe(candidates), messages, apiConfigured: true }
}
