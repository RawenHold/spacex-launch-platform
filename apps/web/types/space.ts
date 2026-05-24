export type Locale = "en" | "ru" | "es" | "it" | "fr"

export type LocalizedText = Record<"en" | "ru", string> &
  Partial<Record<"es" | "it" | "fr", string>>

export type DataConfidenceLevel =
  | "official_confirmed"
  | "admin_verified"
  | "multi_source_confirmed"
  | "estimated"
  | "unverified"
  | "conflicting"

export type LaunchStatus =
  | "go"
  | "tbd"
  | "hold"
  | "success"
  | "partial_failure"
  | "failure"
  | "scrubbed"
  | "unknown"

export type LaunchCategory =
  | "starship"
  | "falcon_9"
  | "falcon_heavy"
  | "dragon_crew"
  | "starlink"
  | "other"

export type MissionType =
  | "communications"
  | "crew"
  | "cargo"
  | "test_flight"
  | "rideshare"
  | "science"
  | "other"

export type SourceKind =
  | "official_spacex"
  | "official_youtube"
  | "nasa"
  | "faa"
  | "launch_library"
  | "spaceflight_now"
  | "nasaspaceflight"
  | "next_spaceflight"
  | "mock_dataset"
  | "other"

export type TimelineEventType =
  | "liftoff"
  | "max_q"
  | "meco"
  | "stage_separation"
  | "ses"
  | "seco"
  | "landing_burn"
  | "booster_landing"
  | "payload_deployment"
  | "custom"

export type TimelineEventStatus =
  | "planned"
  | "confirmed"
  | "skipped"
  | "failed"
  | "estimated"

export type VideoState = "upcoming" | "live" | "completed" | "unavailable"

export interface SourceRecord {
  id: string
  kind: SourceKind
  title: LocalizedText
  publisher: string
  url?: string
  retrievedAt?: string
  confidenceLevel: DataConfidenceLevel
  isPrimary: boolean
  notes?: LocalizedText
}

export interface VideoRecord {
  id: string
  provider: "youtube"
  title: LocalizedText
  videoId?: string
  url?: string
  state: VideoState
  sourceLabel: LocalizedText
  isPlaceholder: boolean
}

export interface MissionTimelineEvent {
  id: string
  type: TimelineEventType
  title: LocalizedText
  description: LocalizedText
  relativeTime: string
  status: TimelineEventStatus
  confidenceLevel: DataConfidenceLevel
}

export interface Launch {
  id: string
  slug: string
  missionName: LocalizedText
  summary: LocalizedText
  details: LocalizedText
  status: LaunchStatus
  category: LaunchCategory
  missionType: MissionType
  rocket: {
    id: string
    name: string
    family: LaunchCategory
    variant?: string
  }
  launchPad: {
    id: string
    name: string
    location: LocalizedText
  }
  netUtc: string
  windowEndUtc?: string
  orbit: LocalizedText
  trajectory: LocalizedText
  payload: LocalizedText
  result?: LocalizedText
  officialLink?: string
  videos: VideoRecord[]
  timeline: MissionTimelineEvent[]
  sourceRecords: SourceRecord[]
  confidenceLevel: DataConfidenceLevel
  isMock: boolean
  tags: string[]
}

export interface Article {
  id: string
  slug: string
  title: LocalizedText
  excerpt: LocalizedText
  category: string
  readingMinutes: number
  publishedAt: string
  isMock: boolean
}

export interface NewsItem {
  id: string
  slug: string
  title: LocalizedText
  summary: LocalizedText
  sourceLabel: string
  sourceUrl?: string
  publishedAt: string
  confidenceLevel: DataConfidenceLevel
  isMock: boolean
}

export interface FAQItem {
  id: string
  group: "basics" | "falcon9" | "starship" | "timeline" | "livestreams" | "accuracy" | "reminders"
  question: LocalizedText
  answer: LocalizedText
  isMock: boolean
}
