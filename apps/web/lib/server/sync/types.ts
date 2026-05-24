import type { DataConfidenceLevel, LaunchCategory, LocalizedText } from "@/types/space"

export const LAUNCH_LIBRARY_PROVIDER = "launch_library" as const

export type ExternalProvider = typeof LAUNCH_LIBRARY_PROVIDER
export type SyncMode = "upcoming" | "past" | "both"

export interface LaunchLibraryPaginatedResponse {
  count?: number
  next?: string | null
  previous?: string | null
  results?: LaunchLibraryLaunch[]
}

export interface LaunchLibraryLaunch {
  id: string
  url?: string
  slug?: string
  name?: string
  last_updated?: string
  net?: string
  window_start?: string | null
  window_end?: string | null
  status?: {
    id?: number
    name?: string
    abbrev?: string
    description?: string
  } | null
  launch_service_provider?: {
    id?: number
    name?: string
    abbrev?: string
  } | null
  rocket?: {
    configuration?: {
      id?: number
      name?: string
      full_name?: string
      family?: string
      variant?: string
      manufacturer?: {
        name?: string
        abbrev?: string
      } | null
    } | null
  } | null
  mission?: {
    id?: number
    name?: string
    description?: string | null
    type?: string | null
    orbit?: {
      id?: number
      name?: string
      abbrev?: string
    } | null
  } | null
  pad?: {
    id?: number
    name?: string
    location?: {
      id?: number
      name?: string
      country_code?: string
    } | null
  } | null
  vidURLs?: Array<{
    url?: string
    source?: string
    type?: string
  }>
  infoURLs?: Array<{
    url?: string
    source?: string
    type?: string
  }>
  image?: {
    image_url?: string
    thumbnail_url?: string
    credit?: string
    license?: {
      name?: string
    } | null
  } | null
}

export interface NormalizedLaunch {
  provider: ExternalProvider
  externalId: string
  externalUrl?: string
  slug: string
  missionName: LocalizedText
  launchDateTimeUtc: Date
  status:
    | "draft"
    | "scheduled"
    | "confirmed"
    | "live"
    | "delayed"
    | "scrubbed"
    | "success"
    | "failure"
    | "partial_success"
  confidenceLevel: DataConfidenceLevel
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
  orbit?: string
  trajectory: LocalizedText
  payload: LocalizedText
  missionDescription: LocalizedText
  officialUrl?: string
  youtubeUrlOrVideoId?: string
  sourceTitle: LocalizedText
  sourceUrl?: string
  externalMetadata: Record<string, unknown>
}

export interface DetectedLaunchConflict {
  field: string
  existingValue: string
  importedValue: string
}

export interface LaunchLibrarySyncSummary {
  provider: ExternalProvider
  mode: SyncMode
  dryRun: boolean
  syncRunId?: string
  fetchedCount: number
  importedCount: number
  updatedCount: number
  skippedCount: number
  conflictCount: number
  errorCount: number
  errorMessages: string[]
}

export interface SyncDashboardRun {
  id: string
  provider: ExternalProvider
  status: "running" | "success" | "partial" | "failed"
  startedAt: string
  finishedAt?: string
  requestedByEmail?: string
  importedCount: number
  updatedCount: number
  skippedCount: number
  conflictCount: number
  errorCount: number
  errorMessage?: string
}
