import { articles, launches, newsItems } from "@/data/mock-data"
import type {
  AdminArticle,
  AdminDashboardStats,
  AdminLaunchRecord,
  AdminLaunchStatus,
  AdminNewsItem,
  AdminSettings,
  AdminSourceRecord,
  AdminTimelineEvent,
  AdminUser,
  AIDraft,
  ApprovalRecord,
  PublishableStatus,
  SourceConflict,
} from "@/types/admin"
import type {
  DataConfidenceLevel,
  Launch,
  LaunchStatus,
  MissionTimelineEvent,
  SourceKind,
  SourceRecord,
  TimelineEventType,
} from "@/types/space"

export const adminUsers: AdminUser[] = [
  {
    id: "admin-dev",
    name: "Dev Admin",
    email: "admin@example.local",
    role: "admin",
    isHuman: true,
    lastActiveAt: "2026-05-24T08:45:00.000Z",
    permissions: [
      "publish",
      "approve",
      "edit_content",
      "manage_sources",
      "manage_timeline",
      "manual_override",
      "manage_settings",
      "generate_ai_drafts",
    ],
  },
  {
    id: "editor-dev",
    name: "Editorial Operator",
    email: "editor@example.local",
    role: "editor",
    isHuman: true,
    permissions: ["edit_content", "manage_timeline", "generate_ai_drafts"],
  },
  {
    id: "researcher-dev",
    name: "Source Researcher",
    email: "researcher@example.local",
    role: "researcher",
    isHuman: true,
    permissions: ["manage_sources", "generate_ai_drafts"],
  },
  {
    id: "ai-moderator",
    name: "AI Moderator",
    role: "ai_moderator",
    isHuman: false,
    permissions: ["generate_ai_drafts"],
  },
]

const baseApproval: ApprovalRecord = {
  status: "draft",
  submittedBy: "editor-dev",
  submittedAt: "2026-05-24T08:00:00.000Z",
  comments:
    "MVP mock content. Human approval is required before any production publish.",
}

const approvedApproval: ApprovalRecord = {
  status: "approved",
  submittedBy: "editor-dev",
  approvedBy: "admin-dev",
  submittedAt: "2026-05-20T11:00:00.000Z",
  approvedAt: "2026-05-21T09:00:00.000Z",
  comments: "Approved for mock public demo only.",
}

function sourceTypeForKind(kind: SourceKind): AdminSourceRecord["sourceType"] {
  if (
    kind === "official_spacex" ||
    kind === "official_youtube" ||
    kind === "nasa" ||
    kind === "faa"
  ) {
    return "official"
  }

  if (kind === "launch_library") {
    return "api"
  }

  if (
    kind === "spaceflight_now" ||
    kind === "nasaspaceflight" ||
    kind === "next_spaceflight"
  ) {
    return "secondary"
  }

  return "manual"
}

function trustLevelForSource(source: SourceRecord): AdminSourceRecord["trustLevel"] {
  if (source.isPrimary && source.confidenceLevel === "official_confirmed") {
    return "primary"
  }

  if (source.kind === "mock_dataset" || source.confidenceLevel === "unverified") {
    return "low"
  }

  return "secondary"
}

function toAdminSource(source: SourceRecord): AdminSourceRecord {
  return {
    ...source,
    sourceType: sourceTypeForKind(source.kind),
    trustLevel: trustLevelForSource(source),
    lastCheckedAt: source.retrievedAt ?? "2026-05-24T08:10:00.000Z",
    notes:
      source.notes?.en ??
      "Source migrated into the admin review model for MVP scaffolding.",
    conflictingFields:
      source.confidenceLevel === "conflicting" ? ["launchDateTimeUtc"] : undefined,
  }
}

function launchStatusToAdmin(status: LaunchStatus): AdminLaunchStatus {
  const map: Record<LaunchStatus, AdminLaunchStatus> = {
    go: "confirmed",
    tbd: "scheduled",
    hold: "delayed",
    success: "success",
    partial_failure: "partial_success",
    failure: "failure",
    scrubbed: "scrubbed",
    unknown: "draft",
  }

  return map[status]
}

function publishStatusForLaunch(launch: Launch): PublishableStatus {
  if (launch.status === "success" || launch.status === "partial_failure") {
    return "published"
  }

  if (launch.confidenceLevel === "estimated" || launch.confidenceLevel === "conflicting") {
    return "in_review"
  }

  return "approved"
}

function timelineType(type: TimelineEventType): AdminTimelineEvent["type"] {
  if (type === "payload_deployment") {
    return "payload_deploy"
  }

  return type
}

function toAdminTimelineEvent(
  launch: Launch,
  event: MissionTimelineEvent,
  index: number
): AdminTimelineEvent {
  return {
    ...event,
    launchId: launch.id,
    type: timelineType(event.type),
    sortOrder: index,
    approval: {
      status: event.status === "confirmed" ? "approved" : "draft",
      submittedBy: "editor-dev",
      comments: "Timeline event is planned/estimated unless confirmed by sources.",
    },
    aiGenerated: false,
  }
}

export const adminLaunches: AdminLaunchRecord[] = launches.map((launch, index) => {
  const publishStatus = publishStatusForLaunch(launch)

  return {
    id: `admin-${launch.id}`,
    sourceLaunchId: launch.id,
    missionName: launch.missionName,
    slug: launch.slug,
    content: {
      title: launch.missionName,
      description: launch.summary,
      seoTitle: {
        en: `${launch.missionName.en} | SpaceX launch tracker`,
        ru: `${launch.missionName.ru} | SpaceX launch tracker`,
      },
      metaDescription: launch.summary,
    },
    rocket: launch.rocket,
    launchPad: launch.launchPad,
    launchDateTimeUtc: launch.netUtc,
    localTimeDisplayHelper: "Render viewer-local time from launchDateTimeUtc on the client.",
    trajectory: launch.trajectory,
    orbit: launch.orbit.en,
    payload: launch.payload,
    missionDescription: launch.details,
    officialUrl: launch.officialLink,
    youtubeUrlOrVideoId: launch.videos[0]?.url ?? launch.videos[0]?.videoId,
    sourceRecords: launch.sourceRecords.map(toAdminSource),
    confidenceLevel: launch.confidenceLevel,
    status: launchStatusToAdmin(launch.status),
    publishStatus,
    isFeatured: index === 0,
    isPublished: publishStatus === "published",
    isMock: launch.isMock,
    manualOverride: launch.status === "hold",
    aiGenerated: false,
    approval:
      publishStatus === "published" || publishStatus === "approved"
        ? approvedApproval
        : baseApproval,
    updatedAt: "2026-05-24T08:15:00.000Z",
  }
})

export const adminTimelineEvents: AdminTimelineEvent[] = launches.flatMap((launch) =>
  launch.timeline.map((event, index) => toAdminTimelineEvent(launch, event, index))
)

export const adminArticles: AdminArticle[] = articles.map((article, index) => ({
  id: article.id,
  slug: article.slug,
  title: article.title,
  body: {
    en: `${article.excerpt.en}\n\nFull article body placeholder for editorial workflow.`,
    ru: `${article.excerpt.ru}\n\nDraft body placeholder for editorial workflow.`,
  },
  seoTitle: {
    en: `${article.title.en} | SpaceX mission guide`,
    ru: `${article.title.ru} | SpaceX mission guide`,
  },
  metaDescription: article.excerpt,
  category: article.category,
  sources: adminLaunches[index % adminLaunches.length]?.sourceRecords.slice(0, 1) ?? [],
  aiDraftId: index === 0 ? "ai-draft-mission-summary" : undefined,
  publishStatus: index === 0 ? "in_review" : "draft",
  approval: index === 0 ? baseApproval : { status: "draft" },
  updatedAt: "2026-05-24T08:20:00.000Z",
}))

export const adminNews: AdminNewsItem[] = newsItems.map((item, index) => ({
  id: item.id,
  title: item.title,
  summary: item.summary,
  sourceUrl: item.sourceUrl,
  sourceName: item.sourceLabel,
  publicationDate: item.publishedAt,
  confidenceLevel: item.confidenceLevel,
  publishStatus: index === 0 ? "in_review" : "draft",
  approval: index === 0 ? baseApproval : { status: "draft" },
  updatedAt: "2026-05-24T08:25:00.000Z",
}))

export const managedSources: AdminSourceRecord[] = Array.from(
  new Map(
    adminLaunches
      .flatMap((launch) => launch.sourceRecords)
      .map((source) => [source.id, source])
  ).values()
)

export const sourceConflicts: SourceConflict[] = [
  {
    id: "conflict-starship-net",
    entityType: "launch",
    entityId: "starship-integrated-test-mock",
    field: "launchDateTimeUtc",
    sources: [
      {
        sourceName: "Internal MVP mock planning dataset",
        value: "2026-08-21T13:30:00.000Z",
        trustLevel: "low",
      },
      {
        sourceName: "Future primary source placeholder",
        value: "No official confirmation attached",
        trustLevel: "primary",
      },
    ],
    summary:
      "Mock schedule exists, but no primary official confirmation is attached. Keep public copy estimated.",
    status: "open",
    updatedAt: "2026-05-24T08:30:00.000Z",
  },
]

export const aiDrafts: AIDraft[] = [
  {
    id: "ai-draft-mission-summary",
    type: "launch_summary",
    status: "needs_review",
    createdBy: "ai_moderator",
    relatedEntityType: "launch",
    relatedEntityId: adminLaunches[0]?.id ?? "unknown",
    title: {
      en: "AI mission summary draft",
      ru: "AI mission summary draft",
    },
    content: {
      en: "Draft summary based only on attached mock source records. Requires editor review before publishing.",
      ru: "Draft summary based only on attached mock source records. Requires editor review before publishing.",
    },
    citations: adminLaunches[0]?.sourceRecords ?? [],
    confidenceNotes: {
      en: "Mock data only. No primary official mission page attached.",
      ru: "Mock data only. No primary official mission page attached.",
    },
    riskNotes: {
      en: "Do not publish as verified launch information until a human adds primary sources.",
      ru: "Do not publish as verified launch information until a human adds primary sources.",
    },
    sourceComparison: [],
    createdAt: "2026-05-24T08:35:00.000Z",
    updatedAt: "2026-05-24T08:35:00.000Z",
    approval: {
      status: "in_review",
      submittedBy: "ai-moderator",
      submittedAt: "2026-05-24T08:35:00.000Z",
      comments: "AI generated. Human approval required.",
    },
  },
  {
    id: "ai-draft-source-conflict",
    type: "source_comparison",
    status: "generated",
    createdBy: "ai_moderator",
    relatedEntityType: "launch",
    relatedEntityId: adminLaunches[1]?.id ?? "unknown",
    title: {
      en: "Source conflict report",
      ru: "Source conflict report",
    },
    content: {
      en: "A mock launch date is present without an official source record. Keep public labels estimated.",
      ru: "A mock launch date is present without an official source record. Keep public labels estimated.",
    },
    citations: adminLaunches[1]?.sourceRecords ?? [],
    confidenceNotes: {
      en: "Low confidence until an official source is attached.",
      ru: "Low confidence until an official source is attached.",
    },
    riskNotes: {
      en: "AI must summarize the conflict and cannot silently choose a winning date.",
      ru: "AI must summarize the conflict and cannot silently choose a winning date.",
    },
    sourceComparison: sourceConflicts,
    createdAt: "2026-05-24T08:40:00.000Z",
    updatedAt: "2026-05-24T08:40:00.000Z",
    approval: { status: "draft", submittedBy: "ai-moderator" },
  },
]

export const adminSettings: AdminSettings = {
  siteName: "SpaceX",
  enabledLocales: ["en", "ru"],
  defaultLocale: "en",
  dataSyncEnabled: false,
  launchLibraryApiConfigured: Boolean(process.env.LAUNCH_LIBRARY_API_KEY),
  youtubeDataApiConfigured: Boolean(process.env.YOUTUBE_DATA_API_KEY),
  openAiConfigured: Boolean(process.env.OPENAI_API_KEY),
  editorCanPublish: false,
  requireApprovalForAiDrafts: true,
}

function isFutureLaunch(launch: AdminLaunchRecord): boolean {
  return new Date(launch.launchDateTimeUtc).getTime() > Date.now()
}

function isPendingApproval(status: PublishableStatus): boolean {
  return status === "in_review" || status === "approved"
}

export function getAdminDashboardStats(): AdminDashboardStats {
  const upcomingLaunches = adminLaunches.filter(isFutureLaunch)
  const nextLaunch = [...upcomingLaunches].sort(
    (a, b) =>
      new Date(a.launchDateTimeUtc).getTime() - new Date(b.launchDateTimeUtc).getTime()
  )[0]

  const articleDrafts = adminArticles.filter((article) =>
    isPendingApproval(article.publishStatus)
  ).length
  const newsDrafts = adminNews.filter((item) => isPendingApproval(item.publishStatus)).length

  return {
    nextLaunch,
    upcomingLaunchCount: upcomingLaunches.length,
    pastLaunchCount: adminLaunches.length - upcomingLaunches.length,
    draftsAwaitingApproval:
      articleDrafts +
      newsDrafts +
      adminLaunches.filter((launch) => isPendingApproval(launch.publishStatus)).length,
    sourceConflictCount: sourceConflicts.filter((conflict) => conflict.status !== "resolved")
      .length,
    aiDraftsPendingReview: aiDrafts.filter(
      (draft) => draft.status === "generated" || draft.status === "needs_review"
    ).length,
    lastSyncStatus: "not_configured",
  }
}

export function confidenceLabel(level: DataConfidenceLevel): string {
  return level.replaceAll("_", " ")
}
