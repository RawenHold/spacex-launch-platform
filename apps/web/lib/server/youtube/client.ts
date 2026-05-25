import type {
  YouTubeSearchResponse,
  YouTubeVideoItem,
  YouTubeVideosResponse,
} from "@/lib/server/youtube/types"

const youtubeApiBaseUrl = "https://www.googleapis.com/youtube/v3"

export function youtubeApiConfigured() {
  return Boolean(process.env.YOUTUBE_API_KEY)
}

export function configuredSpaceXChannelId() {
  return process.env.YOUTUBE_SPACEX_CHANNEL_ID?.trim() || undefined
}

function apiKey() {
  const key = process.env.YOUTUBE_API_KEY

  if (!key) {
    throw new Error("YOUTUBE_API_KEY is not configured.")
  }

  return key
}

async function youtubeGet<T>(path: string, params: Record<string, string>) {
  const url = new URL(`${youtubeApiBaseUrl}/${path}`)

  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value)
  }
  url.searchParams.set("key", apiKey())

  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  })

  if (!response.ok) {
    throw new Error(`YouTube API request failed with HTTP ${response.status}`)
  }

  return (await response.json()) as T
}

export async function searchYouTubeVideos(input: {
  query: string
  channelId?: string
  maxResults?: number
}) {
  const payload = await youtubeGet<YouTubeSearchResponse>("search", {
    part: "snippet",
    type: "video",
    order: "date",
    maxResults: String(input.maxResults ?? 5),
    q: input.query,
    channelId: input.channelId ?? "",
    safeSearch: "none",
  })

  return payload.items ?? []
}

export async function getYouTubeVideos(videoIds: string[]): Promise<YouTubeVideoItem[]> {
  const ids = Array.from(new Set(videoIds.filter(Boolean))).slice(0, 50)

  if (ids.length === 0) return []

  const payload = await youtubeGet<YouTubeVideosResponse>("videos", {
    part: "snippet,contentDetails,liveStreamingDetails,status",
    id: ids.join(","),
    maxResults: String(ids.length),
  })

  return payload.items ?? []
}
