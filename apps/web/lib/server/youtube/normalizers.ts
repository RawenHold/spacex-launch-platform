import { parseYouTubeUrl } from "@/lib/youtube"
import type {
  NormalizedVideoCandidate,
  VideoDiscoveryLaunchInput,
  YouTubeDiscoverySource,
  YouTubeVideoItem,
} from "@/lib/server/youtube/types"

function localized(en: string, ru = en) {
  return { en, ru }
}

function dateOrUndefined(value?: string) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function bestThumbnail(item: YouTubeVideoItem) {
  const thumbnails = item.snippet?.thumbnails
  return thumbnails?.maxres?.url ?? thumbnails?.high?.url ?? thumbnails?.medium?.url ?? thumbnails?.default?.url
}

function missionTokens(launch: VideoDiscoveryLaunchInput) {
  return launch.missionName.en
    .toLowerCase()
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2)
}

export function scoreVideoCandidate(input: {
  launch: VideoDiscoveryLaunchInput
  title: string
  channelId?: string
  channelTitle?: string
  scheduledStartTime?: Date
  actualStartTime?: Date
  liveBroadcastContent?: string
}) {
  const officialChannelId = process.env.YOUTUBE_SPACEX_CHANNEL_ID
  const title = input.title.toLowerCase()
  const channelTitle = input.channelTitle?.toLowerCase() ?? ""
  const tokens = missionTokens(input.launch)
  const matchingTokens = tokens.filter((token) => title.includes(token)).length
  let score = 0
  const reasons: string[] = []

  if (officialChannelId && input.channelId === officialChannelId) {
    score += 45
    reasons.push("official SpaceX channel id matched")
  } else if (channelTitle.includes("spacex")) {
    score += 35
    reasons.push("channel title looks official")
  }

  if (matchingTokens > 0) {
    score += Math.min(25, matchingTokens * 8)
    reasons.push(`${matchingTokens} mission keyword(s) matched`)
  }

  if (title.includes(input.launch.rocketName.toLowerCase().split(" ")[0] ?? "")) {
    score += 8
    reasons.push("rocket keyword matched")
  }

  if (input.launch.launchPadName && title.includes(input.launch.launchPadName.toLowerCase().split(" ")[0] ?? "")) {
    score += 4
    reasons.push("launch pad keyword matched")
  }

  const videoTime = input.scheduledStartTime ?? input.actualStartTime
  if (videoTime) {
    const launchTime = new Date(input.launch.launchDateTimeUtc).getTime()
    const deltaDays = Math.abs(videoTime.getTime() - launchTime) / 86_400_000
    if (deltaDays <= 2) {
      score += 15
      reasons.push("start time is close to launch date")
    } else if (deltaDays <= 7) {
      score += 8
      reasons.push("start time is within discovery window")
    }
  }

  if (["live", "upcoming"].includes(input.liveBroadcastContent ?? "")) {
    score += 7
    reasons.push("live/upcoming broadcast signal")
  }

  return {
    score: Math.min(100, score),
    notes: reasons.length > 0 ? reasons.join("; ") : "Low-confidence candidate; admin review required.",
  }
}

function confidenceLevel(score: number, channelId?: string) {
  if (process.env.YOUTUBE_SPACEX_CHANNEL_ID && channelId === process.env.YOUTUBE_SPACEX_CHANNEL_ID && score >= 80) {
    return "official_confirmed" as const
  }
  if (score >= 70) return "multi_source_confirmed" as const
  if (score >= 45) return "estimated" as const
  return "unverified" as const
}

export function normalizeYouTubeVideoItem(
  item: YouTubeVideoItem,
  launch: VideoDiscoveryLaunchInput,
  discoverySource: YouTubeDiscoverySource
): NormalizedVideoCandidate {
  const videoId = item.id
  const title = item.snippet?.title ?? "Untitled YouTube video"
  const description = item.snippet?.description ?? ""
  const scheduledStartTime = dateOrUndefined(item.liveStreamingDetails?.scheduledStartTime)
  const actualStartTime = dateOrUndefined(item.liveStreamingDetails?.actualStartTime)
  const actualEndTime = dateOrUndefined(item.liveStreamingDetails?.actualEndTime)
  const scored = scoreVideoCandidate({
    launch,
    title,
    channelId: item.snippet?.channelId,
    channelTitle: item.snippet?.channelTitle,
    scheduledStartTime,
    actualStartTime,
    liveBroadcastContent: item.snippet?.liveBroadcastContent,
  })
  const official =
    Boolean(process.env.YOUTUBE_SPACEX_CHANNEL_ID && item.snippet?.channelId === process.env.YOUTUBE_SPACEX_CHANNEL_ID) ||
    item.snippet?.channelTitle?.toLowerCase().includes("spacex")

  return {
    launchId: launch.id,
    provider: "youtube",
    providerVideoId: videoId,
    url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined,
    title: localized(title),
    description: localized(description),
    channelId: item.snippet?.channelId,
    channelTitle: item.snippet?.channelTitle,
    thumbnailUrl: bestThumbnail(item),
    scheduledStartTime,
    actualStartTime,
    actualEndTime,
    liveBroadcastContent: item.snippet?.liveBroadcastContent,
    duration: item.contentDetails?.duration,
    confidenceLevel: confidenceLevel(scored.score, item.snippet?.channelId),
    sourceType: official ? "official" : "api",
    confidenceScore: scored.score,
    confidenceNotes: scored.notes,
    discoverySource,
    externalRawJson: item,
  }
}

export function normalizeYouTubeUrlCandidate(
  urlOrVideoId: string,
  launch: VideoDiscoveryLaunchInput,
  discoverySource: YouTubeDiscoverySource
): NormalizedVideoCandidate | null {
  const parsed = parseYouTubeUrl(urlOrVideoId)
  const videoId = parsed.providerVideoId

  if (!videoId) return null
  const sourceScore =
    discoverySource === "manual" ? 55 : discoverySource === "launch_library_metadata" ? 50 : 45

  return {
    launchId: launch.id,
    provider: "youtube",
    providerVideoId: videoId,
    url: parsed.canonicalUrl,
    title: localized(`${launch.missionName.en} video candidate`),
    description: localized("YouTube URL candidate. Admin review required before public use."),
    liveBroadcastContent: "none",
    confidenceLevel: "estimated",
    sourceType: discoverySource === "manual" ? "manual" : "secondary",
    confidenceScore: sourceScore,
    confidenceNotes:
      discoverySource === "manual"
        ? "Manual YouTube URL parsed successfully; admin approval required."
        : discoverySource === "launch_library_metadata"
          ? "Launch Library webcast URL parsed successfully; admin approval required."
        : "Existing launch/webcast YouTube URL parsed successfully; admin approval required.",
    discoverySource,
    externalRawJson: { urlOrVideoId, parsed },
  }
}
