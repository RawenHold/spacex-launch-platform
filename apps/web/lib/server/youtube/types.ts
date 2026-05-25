import type { DataConfidenceLevel, LocalizedText } from "@/types/space"

export type YouTubeProvider = "youtube"
export type YouTubeDiscoverySource = "launch_field" | "launch_library_metadata" | "manual" | "youtube_api" | "fixture"

export interface YouTubeSearchResponse {
  items?: YouTubeSearchItem[]
}

export interface YouTubeSearchItem {
  id?: {
    videoId?: string
  }
  snippet?: {
    publishedAt?: string
    channelId?: string
    title?: string
    description?: string
    channelTitle?: string
    liveBroadcastContent?: string
    thumbnails?: Record<string, { url?: string }>
  }
}

export interface YouTubeVideosResponse {
  items?: YouTubeVideoItem[]
}

export interface YouTubeVideoItem {
  id?: string
  snippet?: {
    publishedAt?: string
    channelId?: string
    title?: string
    description?: string
    channelTitle?: string
    liveBroadcastContent?: string
    thumbnails?: Record<string, { url?: string }>
  }
  contentDetails?: {
    duration?: string
  }
  liveStreamingDetails?: {
    scheduledStartTime?: string
    actualStartTime?: string
    actualEndTime?: string
  }
  status?: {
    uploadStatus?: string
    privacyStatus?: string
    license?: string
    embeddable?: boolean
    publicStatsViewable?: boolean
  }
}

export interface VideoDiscoveryLaunchInput {
  id: string
  missionName: LocalizedText
  launchDateTimeUtc: string
  rocketName: string
  launchPadName?: string
  youtubeUrlOrVideoId?: string
  externalWebcastUrls?: string[]
}

export interface NormalizedVideoCandidate {
  launchId: string
  provider: YouTubeProvider
  providerVideoId?: string
  url?: string
  title: LocalizedText
  description: LocalizedText
  channelId?: string
  channelTitle?: string
  thumbnailUrl?: string
  scheduledStartTime?: Date
  actualStartTime?: Date
  actualEndTime?: Date
  liveBroadcastContent?: string
  duration?: string
  confidenceLevel: DataConfidenceLevel
  sourceType: "official" | "api" | "secondary" | "manual"
  confidenceScore: number
  confidenceNotes: string
  discoverySource: YouTubeDiscoverySource
  externalRawJson?: unknown
}

export interface YouTubeDiscoverySummary {
  dryRun: boolean
  launchId?: string
  apiConfigured: boolean
  channelIdConfigured: boolean
  discoveredCount: number
  createdCount: number
  updatedCount: number
  skippedCount: number
  conflictCount: number
  errorCount: number
  candidates: NormalizedVideoCandidate[]
  messages: string[]
}
