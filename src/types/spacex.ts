export type Locale = "en" | "ru" | "es" | "it" | "fr"

export type ApprovalStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "published"
  | "archived"

export type DataConfidenceLevel =
  | "official_confirmed"
  | "admin_verified"
  | "multi_source_confirmed"
  | "estimated"
  | "unverified"
  | "conflicting"

export type SourceKind =
  | "official_spacex"
  | "official_youtube"
  | "nasa"
  | "faa"
  | "launch_library"
  | "spaceflight_now"
  | "nasaspaceflight"
  | "next_spaceflight"
  | "other"

export type LaunchStatus =
  | "go"
  | "tbd"
  | "hold"
  | "success"
  | "partial_failure"
  | "failure"
  | "scrubbed"
  | "unknown"

export type TimelineEventKind =
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

export type TimelineTimingKind = "planned" | "estimated" | "actual" | "unknown"

export type VideoState = "upcoming" | "live" | "completed" | "unavailable"

export type AdminRole = "viewer" | "editor" | "verifier" | "publisher" | "owner"

export interface LocalizedText {
  en: string
  ru: string
  es?: string
  it?: string
  fr?: string
}

export interface SourceRecord {
  id: string
  kind: SourceKind
  title: string
  url: string
  publisher: string
  retrievedAt?: string
  claim?: string
  confidence: DataConfidenceLevel
  isPrimary: boolean
  notes?: string
}

export interface Rocket {
  id: string
  name: string
  family: "falcon_9" | "falcon_heavy" | "starship" | "other"
  variant?: string
  reusable: boolean
  sourceRecords: SourceRecord[]
}

export interface LaunchPad {
  id: string
  name: string
  location: string
  operator?: string
  latitude?: number
  longitude?: number
  sourceRecords: SourceRecord[]
}

export interface MissionTimelineEvent {
  id: string
  kind: TimelineEventKind
  label: LocalizedText
  timingKind: TimelineTimingKind
  missionElapsedTime?: string
  utcTime?: string
  confidence: DataConfidenceLevel
  sourceRecordIds: string[]
  notes?: LocalizedText
}

export interface VideoRecord {
  id: string
  provider: "youtube"
  youtubeVideoId: string
  title: string
  state: VideoState
  channelId?: string
  sourceRecordIds: string[]
}

export interface Launch {
  id: string
  slug: string
  missionName: string
  summary: LocalizedText
  status: LaunchStatus
  confidence: DataConfidenceLevel
  windowStartUtc?: string
  windowEndUtc?: string
  netUtc?: string
  rocket: Rocket
  launchPad: LaunchPad
  timeline: MissionTimelineEvent[]
  sourceRecords: SourceRecord[]
  videos: VideoRecord[]
  tags?: string[]
}

export interface Article {
  id: string
  slug: string
  title: LocalizedText
  excerpt: LocalizedText
  body: LocalizedText
  status: ApprovalStatus
  sourceRecords: SourceRecord[]
  publishedAt?: string
}

export interface NewsItem {
  id: string
  slug: string
  title: LocalizedText
  summary: LocalizedText
  status: ApprovalStatus
  sourceRecords: SourceRecord[]
  publishedAt?: string
}

export interface FAQItem {
  id: string
  question: LocalizedText
  answer: LocalizedText
  status: ApprovalStatus
  sourceRecords: SourceRecord[]
}

export interface AdminUser {
  id: string
  email: string
  displayName: string
  roles: AdminRole[]
  preferredLocale: Locale
  active: boolean
}

export interface AIDraft {
  id: string
  targetType: "launch" | "article" | "news" | "faq" | "timeline"
  targetId?: string
  locale: Locale
  status: ApprovalStatus
  promptSummary: string
  generatedContent: unknown
  sourceRecordIds: string[]
  confidence: DataConfidenceLevel
  conflictSummary?: string
  createdByUserId: string
  createdAt: string
  reviewedByUserId?: string
  reviewedAt?: string
}
