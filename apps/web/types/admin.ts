import type {
  DataConfidenceLevel,
  Launch,
  Locale,
  LocalizedText,
  MissionTimelineEvent,
  SourceRecord,
} from "@/types/space"

export type AdminRocket = Launch["rocket"]
export type AdminLaunchPad = Launch["launchPad"]

export type AdminRole = "admin" | "editor" | "researcher" | "ai_moderator"

export type AdminPermission =
  | "publish"
  | "approve"
  | "edit_content"
  | "manage_sources"
  | "manage_timeline"
  | "manual_override"
  | "manage_settings"
  | "generate_ai_drafts"

export type PublishableStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "published"
  | "archived"

export type AdminLaunchStatus =
  | "draft"
  | "scheduled"
  | "confirmed"
  | "live"
  | "delayed"
  | "scrubbed"
  | "success"
  | "failure"
  | "partial_success"

export type AdminTimelineEventType =
  | "countdown"
  | "liftoff"
  | "max_q"
  | "meco"
  | "stage_separation"
  | "ses"
  | "seco"
  | "entry_burn"
  | "landing_burn"
  | "booster_landing"
  | "payload_deploy"
  | "custom"

export type AdminTimelineEventStatus =
  | "planned"
  | "confirmed"
  | "estimated"
  | "skipped"
  | "failed"

export type AdminSourceType = "official" | "api" | "secondary" | "manual"
export type AdminTrustLevel = "primary" | "secondary" | "low"

export type AIDraftType =
  | "launch_summary"
  | "article"
  | "news_summary"
  | "faq"
  | "seo"
  | "timeline_suggestion"
  | "source_comparison"

export type AIDraftStatus =
  | "generated"
  | "needs_review"
  | "approved"
  | "rejected"
  | "merged"

export interface AdminUser {
  id: string
  name: string
  email?: string
  role: AdminRole
  permissions: AdminPermission[]
  isHuman: boolean
  lastActiveAt?: string
}

export interface ApprovalRecord {
  status: PublishableStatus
  submittedBy?: string
  approvedBy?: string
  rejectedBy?: string
  submittedAt?: string
  approvedAt?: string
  rejectedAt?: string
  publishedAt?: string
  archivedAt?: string
  comments?: string
  diffNotes?: string
}

export interface AdminSourceRecord extends Omit<SourceRecord, "notes"> {
  sourceType: AdminSourceType
  trustLevel: AdminTrustLevel
  lastCheckedAt?: string
  notes?: string
  conflictingFields?: string[]
}

export interface SourceConflict {
  id: string
  entityType: "launch" | "article" | "news" | "source"
  entityId: string
  field: string
  sources: Array<{
    sourceName: string
    value: string
    trustLevel: AdminTrustLevel
  }>
  summary: string
  status: "open" | "reviewing" | "resolved"
  updatedAt: string
}

export interface AdminLaunchRecord {
  id: string
  sourceLaunchId: Launch["id"]
  missionName: LocalizedText
  slug: string
  content: {
    title: LocalizedText
    description: LocalizedText
    seoTitle: LocalizedText
    metaDescription: LocalizedText
  }
  rocket: AdminRocket
  launchPad: AdminLaunchPad
  launchDateTimeUtc: string
  localTimeDisplayHelper: string
  trajectory: LocalizedText
  orbit?: string
  payload: LocalizedText
  missionDescription: LocalizedText
  officialUrl?: string
  youtubeUrlOrVideoId?: string
  sourceRecords: AdminSourceRecord[]
  confidenceLevel: DataConfidenceLevel
  status: AdminLaunchStatus
  publishStatus: PublishableStatus
  isFeatured: boolean
  isPublished: boolean
  isMock: boolean
  manualOverride: boolean
  aiGenerated: boolean
  approval: ApprovalRecord
  updatedAt: string
}

export interface AdminTimelineEvent
  extends Omit<
    MissionTimelineEvent,
    "type" | "status" | "title" | "description"
  > {
  launchId: string
  type: AdminTimelineEventType
  status: AdminTimelineEventStatus
  title: LocalizedText
  description: LocalizedText
  sortOrder: number
  approval: ApprovalRecord
  aiGenerated: boolean
}

export interface AIDraft {
  id: string
  type: AIDraftType
  status: AIDraftStatus
  createdBy: "ai_moderator"
  relatedEntityType: "launch" | "article" | "news" | "source" | "faq"
  relatedEntityId: string
  title: LocalizedText
  content: LocalizedText
  citations: AdminSourceRecord[]
  confidenceNotes: LocalizedText
  riskNotes: LocalizedText
  sourceComparison?: SourceConflict[]
  createdAt: string
  updatedAt: string
  approval: ApprovalRecord
}

export interface AdminArticle {
  id: string
  slug: string
  title: LocalizedText
  body: LocalizedText
  seoTitle: LocalizedText
  metaDescription: LocalizedText
  category: string
  sources: AdminSourceRecord[]
  aiDraftId?: string
  publishStatus: PublishableStatus
  approval: ApprovalRecord
  updatedAt: string
}

export interface AdminNewsItem {
  id: string
  title: LocalizedText
  summary: LocalizedText
  sourceUrl?: string
  sourceName: string
  publicationDate: string
  confidenceLevel: DataConfidenceLevel
  publishStatus: PublishableStatus
  approval: ApprovalRecord
  updatedAt: string
}

export interface AdminSettings {
  siteName: string
  enabledLocales: Locale[]
  defaultLocale: Locale
  dataSyncEnabled: boolean
  launchLibraryApiConfigured: boolean
  youtubeDataApiConfigured: boolean
  openAiConfigured: boolean
  editorCanPublish: boolean
  requireApprovalForAiDrafts: boolean
}

export interface AdminDashboardStats {
  nextLaunch?: AdminLaunchRecord
  upcomingLaunchCount: number
  pastLaunchCount: number
  draftsAwaitingApproval: number
  sourceConflictCount: number
  aiDraftsPendingReview: number
  lastSyncStatus: "not_configured" | "idle" | "running" | "failed" | "success"
}
