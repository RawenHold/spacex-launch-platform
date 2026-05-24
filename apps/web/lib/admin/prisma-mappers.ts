import type {
  AdminEntityType as PrismaEntityType,
  AdminLaunchStatus as PrismaLaunchStatus,
  AdminRole as PrismaRole,
  AdminUserStatus as PrismaUserStatus,
  AdminSourceType as PrismaSourceType,
  AdminTimelineEventStatus as PrismaTimelineEventStatus,
  AdminTimelineEventType as PrismaTimelineEventType,
  AdminTrustLevel as PrismaTrustLevel,
  AIDraft as DbAIDraft,
  AIDraftStatus as PrismaAIDraftStatus,
  AIDraftType as PrismaAIDraftType,
  Article as DbArticle,
  DataConfidenceLevel as PrismaConfidenceLevel,
  FAQGroup as PrismaFAQGroup,
  FAQItem as DbFAQItem,
  Launch as DbLaunch,
  MissionTimelineEvent as DbTimelineEvent,
  NewsItem as DbNewsItem,
  Prisma,
  PublishableStatus as PrismaPublishableStatus,
  SourceConflict as DbSourceConflict,
  SourceConflictStatus as PrismaConflictStatus,
  SourceKind as PrismaSourceKind,
  SourceRecord as DbSourceRecord,
} from "@prisma/client"

import type {
  AdminArticle,
  AdminFAQItem,
  AdminLaunchRecord,
  AdminNewsItem,
  AdminSourceRecord,
  AdminTimelineEvent,
  AdminUser,
  AIDraft,
  ApprovalRecord,
  PublishableStatus,
  SourceConflict,
} from "@/types/admin"
import type { LocalizedText } from "@/types/space"

type LaunchWithSources = DbLaunch & { sourceRecords: DbSourceRecord[] }
type ArticleWithSources = DbArticle & { sources: DbSourceRecord[] }
type NewsWithSources = DbNewsItem & { sources: DbSourceRecord[] }
type FAQWithSources = DbFAQItem & { sources: DbSourceRecord[] }

function toUpperSnake(value: string): string {
  return value.toUpperCase()
}

function fromUpperSnake(value: string): string {
  return value.toLowerCase()
}

export function toPrismaRole(value: AdminUser["role"]): PrismaRole {
  return toUpperSnake(value) as PrismaRole
}

export function fromPrismaRole(value: PrismaRole): AdminUser["role"] {
  return fromUpperSnake(value) as AdminUser["role"]
}

export function toPrismaUserStatus(value: AdminUser["status"]): PrismaUserStatus {
  return toUpperSnake(value) as PrismaUserStatus
}

export function fromPrismaUserStatus(value: PrismaUserStatus): AdminUser["status"] {
  return fromUpperSnake(value) as AdminUser["status"]
}

export function toPrismaPublishable(value: PublishableStatus): PrismaPublishableStatus {
  return toUpperSnake(value) as PrismaPublishableStatus
}

export function fromPrismaPublishable(value: PrismaPublishableStatus): PublishableStatus {
  return fromUpperSnake(value) as PublishableStatus
}

export function toPrismaEntityType(value: AIDraft["relatedEntityType"]): PrismaEntityType {
  const map: Record<AIDraft["relatedEntityType"], PrismaEntityType> = {
    launch: "LAUNCH" as PrismaEntityType,
    article: "ARTICLE" as PrismaEntityType,
    news: "NEWS_ITEM" as PrismaEntityType,
    source: "SOURCE_RECORD" as PrismaEntityType,
    faq: "FAQ_ITEM" as PrismaEntityType,
  }

  return map[value]
}

export function entityTypeFromDb(value: PrismaEntityType): AIDraft["relatedEntityType"] {
  const map: Partial<Record<PrismaEntityType, AIDraft["relatedEntityType"]>> = {
    LAUNCH: "launch",
    ARTICLE: "article",
    NEWS_ITEM: "news",
    SOURCE_RECORD: "source",
    FAQ_ITEM: "faq",
  }

  return map[value] ?? "launch"
}

export function toPrismaConfidence(value: string): PrismaConfidenceLevel {
  return toUpperSnake(value) as PrismaConfidenceLevel
}

export function fromPrismaConfidence(value: PrismaConfidenceLevel) {
  return fromUpperSnake(value) as AdminLaunchRecord["confidenceLevel"]
}

export function localizedToJson(value: LocalizedText): Prisma.InputJsonValue {
  return value
}

export function localizedFromJson(value: Prisma.JsonValue): LocalizedText {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const record = value as Record<string, unknown>
    const en = typeof record.en === "string" ? record.en : ""
    const ru = typeof record.ru === "string" ? record.ru : en

    return { en, ru }
  }

  return { en: String(value ?? ""), ru: String(value ?? "") }
}

export function adminUserFromDb(user: {
  id: string
  email: string | null
  name: string
  role: PrismaRole
  status: PrismaUserStatus
  isHuman: boolean
  lastActiveAt: Date | null
  createdAt?: Date
  updatedAt?: Date
}): AdminUser {
  return {
    id: user.id,
    email: user.email ?? undefined,
    name: user.name,
    role: fromPrismaRole(user.role),
    status: fromPrismaUserStatus(user.status),
    isHuman: user.isHuman,
    lastActiveAt: user.lastActiveAt?.toISOString(),
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
    permissions: [],
  }
}

export function sourceFromDb(source: DbSourceRecord): AdminSourceRecord {
  return {
    id: source.id,
    kind: fromUpperSnake(source.kind) as AdminSourceRecord["kind"],
    title: localizedFromJson(source.title),
    publisher: source.publisher,
    url: source.url ?? undefined,
    retrievedAt: source.retrievedAt?.toISOString(),
    confidenceLevel: fromPrismaConfidence(source.confidenceLevel),
    isPrimary: source.isPrimary,
    notes: source.notes ?? undefined,
    sourceType: fromUpperSnake(source.sourceType) as AdminSourceRecord["sourceType"],
    trustLevel: fromUpperSnake(source.trustLevel) as AdminSourceRecord["trustLevel"],
    lastCheckedAt: source.lastCheckedAt?.toISOString(),
    conflictingFields:
      source.conflictingFields.length > 0 ? source.conflictingFields : undefined,
  }
}

function approvalSnapshot(status: PrismaPublishableStatus): ApprovalRecord {
  return {
    status: fromPrismaPublishable(status),
    comments: "Current persisted approval status snapshot.",
  }
}

export function launchFromDb(launch: LaunchWithSources): AdminLaunchRecord {
  return {
    id: launch.id,
    sourceLaunchId: launch.sourceLaunchId ?? launch.id,
    missionName: localizedFromJson(launch.missionName),
    slug: launch.slug,
    content: {
      title: localizedFromJson(launch.contentTitle),
      description: localizedFromJson(launch.contentDescription),
      seoTitle: localizedFromJson(launch.seoTitle),
      metaDescription: localizedFromJson(launch.metaDescription),
    },
    rocket: launch.rocket as AdminLaunchRecord["rocket"],
    launchPad: launch.launchPad as AdminLaunchRecord["launchPad"],
    launchDateTimeUtc: launch.launchDateTimeUtc.toISOString(),
    localTimeDisplayHelper: launch.localTimeDisplayHelper,
    trajectory: localizedFromJson(launch.trajectory),
    orbit: launch.orbit ?? undefined,
    payload: localizedFromJson(launch.payload),
    missionDescription: localizedFromJson(launch.missionDescription),
    officialUrl: launch.officialUrl ?? undefined,
    youtubeUrlOrVideoId: launch.youtubeUrlOrVideoId ?? undefined,
    sourceRecords: launch.sourceRecords.map(sourceFromDb),
    confidenceLevel: fromPrismaConfidence(launch.confidenceLevel),
    status: fromUpperSnake(launch.status) as AdminLaunchRecord["status"],
    publishStatus: fromPrismaPublishable(launch.publishStatus),
    isFeatured: launch.isFeatured,
    isPublished: launch.isPublished,
    isMock: launch.isMock,
    manualOverride: launch.manualOverride,
    aiGenerated: launch.aiGenerated,
    approval: approvalSnapshot(launch.publishStatus),
    updatedAt: launch.updatedAt.toISOString(),
  }
}

export function timelineEventFromDb(event: DbTimelineEvent): AdminTimelineEvent {
  return {
    id: event.id,
    launchId: event.launchId,
    type: fromUpperSnake(event.type) as AdminTimelineEvent["type"],
    title: localizedFromJson(event.title),
    description: localizedFromJson(event.description),
    relativeTime: event.relativeTime,
    status: fromUpperSnake(event.status) as AdminTimelineEvent["status"],
    confidenceLevel: fromPrismaConfidence(event.confidenceLevel),
    sortOrder: event.sortOrder,
    approval: approvalSnapshot(event.approvalStatus),
    aiGenerated: event.aiGenerated,
  }
}

export function articleFromDb(article: ArticleWithSources): AdminArticle {
  return {
    id: article.id,
    slug: article.slug,
    title: localizedFromJson(article.title),
    body: localizedFromJson(article.body),
    seoTitle: localizedFromJson(article.seoTitle),
    metaDescription: localizedFromJson(article.metaDescription),
    category: article.category,
    sources: article.sources.map(sourceFromDb),
    aiDraftId: article.aiDraftId ?? undefined,
    publishStatus: fromPrismaPublishable(article.publishStatus),
    approval: approvalSnapshot(article.publishStatus),
    updatedAt: article.updatedAt.toISOString(),
  }
}

export function newsFromDb(item: NewsWithSources): AdminNewsItem {
  return {
    id: item.id,
    slug: item.slug,
    title: localizedFromJson(item.title),
    summary: localizedFromJson(item.summary),
    sourceUrl: item.sourceUrl ?? undefined,
    sourceName: item.sourceName,
    publicationDate: item.publicationDate.toISOString(),
    confidenceLevel: fromPrismaConfidence(item.confidenceLevel),
    publishStatus: fromPrismaPublishable(item.publishStatus),
    approval: approvalSnapshot(item.publishStatus),
    updatedAt: item.updatedAt.toISOString(),
  }
}

export function faqFromDb(item: FAQWithSources): AdminFAQItem {
  return {
    id: item.id,
    group: fromUpperSnake(item.group) as AdminFAQItem["group"],
    question: localizedFromJson(item.question),
    answer: localizedFromJson(item.answer),
    sources: item.sources.map(sourceFromDb),
    publishStatus: fromPrismaPublishable(item.publishStatus),
    sortOrder: item.sortOrder,
    approval: approvalSnapshot(item.publishStatus),
    updatedAt: item.updatedAt.toISOString(),
  }
}

export function conflictFromDb(conflict: DbSourceConflict): SourceConflict {
  return {
    id: conflict.id,
    entityType: entityTypeFromDb(conflict.entityType) as SourceConflict["entityType"],
    entityId: conflict.entityId,
    field: conflict.field,
    sources: Array.isArray(conflict.sources)
      ? (conflict.sources as SourceConflict["sources"])
      : [],
    summary: conflict.summary,
    status: fromUpperSnake(conflict.status) as SourceConflict["status"],
    updatedAt: conflict.updatedAt.toISOString(),
  }
}

export function aiDraftFromDb(draft: DbAIDraft): AIDraft {
  return {
    id: draft.id,
    type: fromUpperSnake(draft.type) as AIDraft["type"],
    status: fromUpperSnake(draft.status) as AIDraft["status"],
    createdBy: "ai_moderator",
    relatedEntityType: entityTypeFromDb(draft.relatedEntityType),
    relatedEntityId: draft.relatedEntityId,
    title: localizedFromJson(draft.title),
    content: localizedFromJson(draft.content),
    citations: Array.isArray(draft.citations)
      ? (draft.citations as unknown as AdminSourceRecord[])
      : [],
    confidenceNotes: localizedFromJson(draft.confidenceNotes),
    riskNotes: localizedFromJson(draft.riskNotes),
    sourceComparison: Array.isArray(draft.sourceComparison)
      ? (draft.sourceComparison as unknown as SourceConflict[])
      : [],
    createdAt: draft.createdAt.toISOString(),
    updatedAt: draft.updatedAt.toISOString(),
    approval: {
      status:
        draft.status === ("APPROVED" as PrismaAIDraftStatus)
          ? "approved"
          : draft.status === ("REJECTED" as PrismaAIDraftStatus)
            ? "rejected"
            : "draft",
    },
  }
}

export const prismaEnum = {
  role: toPrismaRole,
  userStatus: toPrismaUserStatus,
  publishable: toPrismaPublishable,
  confidence: toPrismaConfidence,
  launchStatus: (value: string) => toUpperSnake(value) as PrismaLaunchStatus,
  timelineType: (value: string) => toUpperSnake(value) as PrismaTimelineEventType,
  timelineStatus: (value: string) => toUpperSnake(value) as PrismaTimelineEventStatus,
  sourceKind: (value: string) => toUpperSnake(value) as PrismaSourceKind,
  sourceType: (value: string) => toUpperSnake(value) as PrismaSourceType,
  trustLevel: (value: string) => toUpperSnake(value) as PrismaTrustLevel,
  conflictStatus: (value: string) => toUpperSnake(value) as PrismaConflictStatus,
  aiDraftType: (value: string) => toUpperSnake(value) as PrismaAIDraftType,
  aiDraftStatus: (value: string) => toUpperSnake(value) as PrismaAIDraftStatus,
  faqGroup: (value: string) => toUpperSnake(value) as PrismaFAQGroup,
}
