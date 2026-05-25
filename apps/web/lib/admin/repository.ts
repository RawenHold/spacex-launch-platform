import type { AuditAction as DbAuditAction, Prisma } from "@prisma/client"

import { prisma } from "@/lib/db"
import { maskSensitiveJson } from "@/lib/admin/audit-safety"
import {
  adminUserFromDb,
  aiDraftFromDb,
  articleFromDb,
  conflictFromDb,
  faqFromDb,
  launchFromDb,
  localizedToJson,
  newsFromDb,
  prismaEnum,
  sourceFromDb,
  timelineEventFromDb,
  toPrismaEntityType,
  toPrismaPublishable,
} from "@/lib/admin/prisma-mappers"
import type {
  AdminAuditLogEntry,
  AdminAuditLogFilters,
  AdminArticle,
  AdminDashboardStats,
  AdminFAQItem,
  AdminLaunchRecord,
  AdminNewsItem,
  AdminSettings,
  AdminSourceRecord,
  AdminTimelineEvent,
  AdminUser,
  AdminUserStatus,
  AIDraft,
  AIDraftType,
  ApprovalRecord,
  PublishableStatus,
  SourceConflict,
} from "@/types/admin"
import type { DataConfidenceLevel, LocalizedText } from "@/types/space"

type EntityType =
  | "admin_user"
  | "launch"
  | "timeline_event"
  | "article"
  | "news_item"
  | "faq_item"
  | "source_record"
  | "source_conflict"
  | "video_record"
  | "external_sync_run"
  | "external_import_record"
  | "ai_draft"
  | "settings"

export interface CreateAdminUserInput {
  name: string
  email: string
  role: Exclude<AdminUser["role"], "ai_moderator">
  status: AdminUserStatus
}

export interface CreateAIDraftInput {
  type: AIDraftType
  status?: AIDraft["status"]
  relatedEntityType: AIDraft["relatedEntityType"]
  relatedEntityId: string
  title: LocalizedText
  content: LocalizedText
  contentJson?: unknown
  contentRu?: string
  contentEn?: string
  citations: AdminSourceRecord[]
  sourcesJson?: unknown
  confidenceNotes: LocalizedText
  riskNotes: LocalizedText
  missingData?: unknown
  sourceComparison?: unknown
  provider?: string
  model?: string
  promptVersion?: string
}

export interface CreateLaunchInput {
  missionName: LocalizedText
  slug: string
  rocketName: string
  launchPadName: string
  launchDateTimeUtc: Date
  status: AdminLaunchRecord["status"]
  confidenceLevel: DataConfidenceLevel
}

export interface UpdateLaunchInput {
  id: string
  missionName: LocalizedText
  slug: string
  rocketName: string
  launchPadName: string
  launchPadLocation: LocalizedText
  launchDateTimeUtc: Date
  trajectory: LocalizedText
  orbit?: string
  payload: LocalizedText
  missionDescription: LocalizedText
  officialUrl?: string
  youtubeUrlOrVideoId?: string
  confidenceLevel: DataConfidenceLevel
  status: AdminLaunchRecord["status"]
  isFeatured: boolean
}

export interface CreateTimelineEventInput {
  launchId: string
  type: AdminTimelineEvent["type"]
  relativeTime: string
  title: LocalizedText
  description: LocalizedText
  status: AdminTimelineEvent["status"]
}

export interface UpdateTimelineEventInput extends CreateTimelineEventInput {
  id: string
  sortOrder: number
}

export interface CreateArticleInput {
  slug: string
  title: LocalizedText
  body: LocalizedText
  category: string
}

export interface UpdateArticleInput {
  id: string
  slug: string
  title: LocalizedText
  body: LocalizedText
  seoTitle: LocalizedText
  metaDescription: LocalizedText
  category: string
}

export interface CreateNewsInput {
  slug: string
  title: LocalizedText
  summary: LocalizedText
  sourceName: string
  sourceUrl?: string
  publicationDate: Date
  confidenceLevel: DataConfidenceLevel
}

export interface UpdateNewsInput {
  id: string
  slug: string
  title: LocalizedText
  summary: LocalizedText
  sourceName: string
  sourceUrl?: string
  publicationDate: Date
  confidenceLevel: DataConfidenceLevel
}

export interface CreateFAQInput {
  group: AdminFAQItem["group"]
  question: LocalizedText
  answer: LocalizedText
}

export interface UpdateFAQInput {
  id: string
  group: AdminFAQItem["group"]
  question: LocalizedText
  answer: LocalizedText
  sortOrder: number
}

export interface CreateSourceInput {
  publisher: string
  title: LocalizedText
  url?: string
  kind: AdminSourceRecord["kind"]
  sourceType: AdminSourceRecord["sourceType"]
  trustLevel: AdminSourceRecord["trustLevel"]
  confidenceLevel: DataConfidenceLevel
  launchId?: string
  articleId?: string
  newsItemId?: string
  faqItemId?: string
  notes?: string
}

export interface UpdateSourceInput extends CreateSourceInput {
  id: string
}

export interface AdminRepository {
  getDashboardStats(): Promise<AdminDashboardStats>
  listUsers(): Promise<AdminUser[]>
  createAdminUser(input: CreateAdminUserInput, actorId: string): Promise<AdminUser>
  updateAdminUserRole(id: string, role: AdminUser["role"], actorId: string): Promise<AdminUser>
  updateAdminUserStatus(
    id: string,
    status: AdminUserStatus,
    actorId: string
  ): Promise<AdminUser>
  listAuditLogs(filters?: AdminAuditLogFilters): Promise<AdminAuditLogEntry[]>
  listAuditActors(): Promise<AdminUser[]>
  listLaunches(): Promise<AdminLaunchRecord[]>
  getLaunchById(id: string): Promise<AdminLaunchRecord | undefined>
  updateLaunch(input: UpdateLaunchInput, actorId: string): Promise<AdminLaunchRecord>
  listTimelineEvents(launchId: string): Promise<AdminTimelineEvent[]>
  updateTimelineEvent(
    input: UpdateTimelineEventInput,
    actorId: string
  ): Promise<AdminTimelineEvent>
  listArticles(): Promise<AdminArticle[]>
  getArticleById(id: string): Promise<AdminArticle | undefined>
  updateArticle(input: UpdateArticleInput, actorId: string): Promise<AdminArticle>
  listNews(): Promise<AdminNewsItem[]>
  getNewsById(id: string): Promise<AdminNewsItem | undefined>
  updateNews(input: UpdateNewsInput, actorId: string): Promise<AdminNewsItem>
  listFAQs(): Promise<AdminFAQItem[]>
  getFAQById(id: string): Promise<AdminFAQItem | undefined>
  updateFAQ(input: UpdateFAQInput, actorId: string): Promise<AdminFAQItem>
  listSources(): Promise<AdminSourceRecord[]>
  getSourceById(id: string): Promise<AdminSourceRecord | undefined>
  updateSource(input: UpdateSourceInput, actorId: string): Promise<AdminSourceRecord>
  listSourceConflicts(): Promise<SourceConflict[]>
  listAIDrafts(filters?: {
    type?: AIDraftType
    status?: AIDraft["status"]
    relatedEntityId?: string
    from?: string
    confidence?: string
  }): Promise<AIDraft[]>
  getAIDraftById(id: string): Promise<AIDraft | undefined>
  getSettings(): Promise<AdminSettings>
  createLaunch(input: CreateLaunchInput, actorId: string): Promise<AdminLaunchRecord>
  updateLaunchStatus(
    id: string,
    status: AdminLaunchRecord["status"],
    actorId: string
  ): Promise<AdminLaunchRecord>
  createTimelineEvent(
    input: CreateTimelineEventInput,
    actorId: string
  ): Promise<AdminTimelineEvent>
  updateTimelineEventStatus(
    id: string,
    status: AdminTimelineEvent["status"],
    actorId: string
  ): Promise<AdminTimelineEvent>
  deleteTimelineEvent(id: string, actorId: string): Promise<void>
  createArticle(input: CreateArticleInput, actorId: string): Promise<AdminArticle>
  updateArticleStatus(
    id: string,
    status: PublishableStatus,
    actorId: string
  ): Promise<AdminArticle>
  createNews(input: CreateNewsInput, actorId: string): Promise<AdminNewsItem>
  updateNewsStatus(
    id: string,
    status: PublishableStatus,
    actorId: string
  ): Promise<AdminNewsItem>
  createFAQ(input: CreateFAQInput, actorId: string): Promise<AdminFAQItem>
  updateFAQStatus(
    id: string,
    status: PublishableStatus,
    actorId: string
  ): Promise<AdminFAQItem>
  createSource(input: CreateSourceInput, actorId: string): Promise<AdminSourceRecord>
  updateSourceTrust(
    id: string,
    trustLevel: AdminSourceRecord["trustLevel"],
    actorId: string
  ): Promise<AdminSourceRecord>
  createAIDraft(input: CreateAIDraftInput): Promise<AIDraft>
  updateAIDraftStatus(
    id: string,
    status: AIDraft["status"],
    actorId: string
  ): Promise<AIDraft>
  mergeAIDraft(id: string, actorId: string): Promise<AIDraft>
  transitionApproval(
    entityId: string,
    status: PublishableStatus,
    userId: string,
    comments?: string
  ): Promise<ApprovalRecord>
}

function localized(value: string): LocalizedText {
  return { en: value, ru: value }
}

function entityTypeToPrisma(value: EntityType) {
  const map = {
    admin_user: "ADMIN_USER",
    launch: "LAUNCH",
    timeline_event: "TIMELINE_EVENT",
    article: "ARTICLE",
    news_item: "NEWS_ITEM",
    faq_item: "FAQ_ITEM",
    source_record: "SOURCE_RECORD",
    source_conflict: "SOURCE_CONFLICT",
    video_record: "VIDEO_RECORD",
    external_sync_run: "EXTERNAL_SYNC_RUN",
    external_import_record: "EXTERNAL_IMPORT_RECORD",
    ai_draft: "AI_DRAFT",
    settings: "SETTINGS",
  } as const

  return map[value]
}

function nowApproval(status: PublishableStatus, actorId: string, comments?: string): ApprovalRecord {
  const now = new Date().toISOString()

  return {
    status,
    submittedBy: status === "in_review" ? actorId : undefined,
    approvedBy: status === "approved" || status === "published" ? actorId : undefined,
    rejectedBy: status === "rejected" ? actorId : undefined,
    submittedAt: status === "in_review" ? now : undefined,
    approvedAt: status === "approved" || status === "published" ? now : undefined,
    rejectedAt: status === "rejected" ? now : undefined,
    publishedAt: status === "published" ? now : undefined,
    archivedAt: status === "archived" ? now : undefined,
    comments,
  }
}

function auditJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

async function writeAudit(
  tx: Prisma.TransactionClient,
  input: {
    actorId?: string
    action: DbAuditAction
    entityType: ReturnType<typeof entityTypeToPrisma>
    entityId: string
    before?: Prisma.InputJsonValue
    after?: Prisma.InputJsonValue
    reason?: string
    metadata?: Prisma.InputJsonValue
  }
) {
  await tx.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.before ?? undefined,
      after: input.after ?? undefined,
      reason: input.reason,
      metadata: input.metadata ?? undefined,
    },
  })
}

async function persistApproval(
  tx: Prisma.TransactionClient,
  entityType: ReturnType<typeof entityTypeToPrisma>,
  entityId: string,
  status: PublishableStatus,
  actorId: string,
  comments?: string
) {
  const approval = nowApproval(status, actorId, comments)

  await tx.approvalRecord.create({
    data: {
      entityType,
      entityId,
      status: toPrismaPublishable(status),
      submittedById: approval.submittedBy,
      approvedById: approval.approvedBy,
      rejectedById: approval.rejectedBy,
      submittedAt: approval.submittedAt ? new Date(approval.submittedAt) : undefined,
      approvedAt: approval.approvedAt ? new Date(approval.approvedAt) : undefined,
      rejectedAt: approval.rejectedAt ? new Date(approval.rejectedAt) : undefined,
      publishedAt: approval.publishedAt ? new Date(approval.publishedAt) : undefined,
      archivedAt: approval.archivedAt ? new Date(approval.archivedAt) : undefined,
      comments,
    },
  })

  return approval
}

export const prismaAdminRepository: AdminRepository = {
  async getDashboardStats() {
    const [launches, articleReviewCount, newsReviewCount, faqReviewCount, conflicts, drafts] =
      await Promise.all([
        prisma.launch.findMany({
          include: { sourceRecords: true },
          orderBy: { launchDateTimeUtc: "asc" },
        }),
        prisma.article.count({ where: { publishStatus: { in: ["IN_REVIEW", "APPROVED"] } } }),
        prisma.newsItem.count({ where: { publishStatus: { in: ["IN_REVIEW", "APPROVED"] } } }),
        prisma.fAQItem.count({ where: { publishStatus: { in: ["IN_REVIEW", "APPROVED"] } } }),
        prisma.sourceConflict.count({ where: { status: { not: "RESOLVED" } } }),
        prisma.aIDraft.count({ where: { status: { in: ["GENERATED", "NEEDS_REVIEW"] } } }),
      ])

    const now = Date.now()
    const nextLaunch = launches.find(
      (launch) => launch.launchDateTimeUtc.getTime() > now
    )
    const upcomingLaunchCount = launches.filter(
      (launch) => launch.launchDateTimeUtc.getTime() > now
    ).length

    return {
      nextLaunch: nextLaunch ? launchFromDb(nextLaunch) : undefined,
      upcomingLaunchCount,
      pastLaunchCount: launches.length - upcomingLaunchCount,
      draftsAwaitingApproval:
        articleReviewCount +
        newsReviewCount +
        faqReviewCount +
        launches.filter((launch) =>
          ["IN_REVIEW", "APPROVED"].includes(launch.publishStatus)
        ).length,
      sourceConflictCount: conflicts,
      aiDraftsPendingReview: drafts,
      lastSyncStatus: "not_configured",
    }
  },

  async listUsers() {
    const users = await prisma.adminUser.findMany({ orderBy: { createdAt: "asc" } })
    return users.map(adminUserFromDb)
  },

  async createAdminUser(input, actorId) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.adminUser.create({
        data: {
          email: input.email.toLowerCase(),
          name: input.name,
          role: prismaEnum.role(input.role),
          status: prismaEnum.userStatus(input.status),
          isHuman: true,
        },
      })
      await writeAudit(tx, {
        actorId,
        action: "CREATE",
        entityType: entityTypeToPrisma("admin_user"),
        entityId: user.id,
        after: auditJson(user),
        reason: "Placeholder invited admin user record created. Email invitation is not implemented in MVP.",
      })
      return adminUserFromDb(user)
    })
  },

  async updateAdminUserRole(id, role, actorId) {
    if (role === "ai_moderator") {
      throw new Error("AI Moderator is a system identity and cannot be assigned to a normal login user.")
    }

    return prisma.$transaction(async (tx) => {
      const before = await tx.adminUser.findUniqueOrThrow({ where: { id } })
      const user = await tx.adminUser.update({
        where: { id },
        data: { role: prismaEnum.role(role) },
      })
      await writeAudit(tx, {
        actorId,
        action: "UPDATE",
        entityType: entityTypeToPrisma("admin_user"),
        entityId: id,
        before: auditJson(before),
        after: auditJson(user),
        reason: "Admin role changed.",
      })
      return adminUserFromDb(user)
    })
  },

  async updateAdminUserStatus(id, status, actorId) {
    return prisma.$transaction(async (tx) => {
      const before = await tx.adminUser.findUniqueOrThrow({ where: { id } })

      if (before.role === "ADMIN" && before.status === "ACTIVE" && status !== "active") {
        const activeAdminCount = await tx.adminUser.count({
          where: {
            role: "ADMIN",
            status: "ACTIVE",
            isHuman: true,
            id: { not: id },
          },
        })

        if (activeAdminCount < 1) {
          throw new Error("Cannot disable or de-activate the last active admin.")
        }
      }

      const user = await tx.adminUser.update({
        where: { id },
        data: { status: prismaEnum.userStatus(status) },
      })
      await writeAudit(tx, {
        actorId,
        action: "UPDATE",
        entityType: entityTypeToPrisma("admin_user"),
        entityId: id,
        before: auditJson(before),
        after: auditJson(user),
        reason: "Admin user status changed.",
      })
      return adminUserFromDb(user)
    })
  },

  async listAuditLogs(filters) {
    const where: Prisma.AuditLogWhereInput = {}

    if (filters?.action) where.action = filters.action.toUpperCase() as Prisma.AuditLogWhereInput["action"]
    if (filters?.entityType) {
      where.entityType = filters.entityType.toUpperCase() as Prisma.AuditLogWhereInput["entityType"]
    }
    if (filters?.actorId) where.actorId = filters.actorId
    if (filters?.from || filters?.to) {
      where.createdAt = {
        gte: filters.from ? new Date(filters.from) : undefined,
        lte: filters.to ? new Date(filters.to) : undefined,
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    })

    return logs.map((entry) => ({
      id: entry.id,
      actorId: entry.actorId ?? undefined,
      actorName: entry.actor?.name,
      actorEmail: entry.actor?.email ?? undefined,
      actorRole: entry.actor?.role.toLowerCase() as AdminUser["role"] | undefined,
      action: entry.action.toLowerCase() as AdminAuditLogEntry["action"],
      entityType: entry.entityType.toLowerCase() as AdminAuditLogEntry["entityType"],
      entityId: entry.entityId,
      beforeJson: entry.before ? maskSensitiveJson(entry.before) : undefined,
      afterJson: entry.after ? maskSensitiveJson(entry.after) : undefined,
      metadataJson: entry.metadata ? maskSensitiveJson(entry.metadata) : undefined,
      reason: entry.reason ?? undefined,
      ipAddress: entry.ipAddress ?? undefined,
      userAgent: entry.userAgent ?? undefined,
      createdAt: entry.createdAt.toISOString(),
    }))
  },

  async listAuditActors() {
    const users = await prisma.adminUser.findMany({
      where: { auditLogs: { some: {} } },
      orderBy: { name: "asc" },
    })
    return users.map(adminUserFromDb)
  },

  async listLaunches() {
    const launches = await prisma.launch.findMany({
      include: { sourceRecords: true },
      orderBy: { launchDateTimeUtc: "asc" },
    })
    return launches.map(launchFromDb)
  },

  async getLaunchById(id) {
    const launch = await prisma.launch.findFirst({
      where: { OR: [{ id }, { sourceLaunchId: id }, { slug: id }] },
      include: { sourceRecords: true },
    })

    return launch ? launchFromDb(launch) : undefined
  },

  async updateLaunch(input, actorId) {
    return prisma.$transaction(async (tx) => {
      const before = await tx.launch.findUniqueOrThrow({ where: { id: input.id } })
      const launch = await tx.launch.update({
        where: { id: input.id },
        data: {
          slug: input.slug,
          missionName: localizedToJson(input.missionName),
          contentTitle: localizedToJson(input.missionName),
          contentDescription: localizedToJson(input.missionDescription),
          seoTitle: localizedToJson(input.missionName),
          metaDescription: localizedToJson(input.missionDescription),
          rocket: {
            id: input.rocketName.toLowerCase().replaceAll(" ", "-"),
            name: input.rocketName,
          },
          launchPad: {
            id: input.launchPadName.toLowerCase().replaceAll(" ", "-"),
            name: input.launchPadName,
            location: input.launchPadLocation,
          },
          launchDateTimeUtc: input.launchDateTimeUtc,
          trajectory: localizedToJson(input.trajectory),
          orbit: input.orbit,
          payload: localizedToJson(input.payload),
          missionDescription: localizedToJson(input.missionDescription),
          officialUrl: input.officialUrl,
          youtubeUrlOrVideoId: input.youtubeUrlOrVideoId,
          confidenceLevel: prismaEnum.confidence(input.confidenceLevel),
          status: prismaEnum.launchStatus(input.status),
          isFeatured: input.isFeatured,
        },
        include: { sourceRecords: true },
      })

      await writeAudit(tx, {
        actorId,
        action: "UPDATE",
        entityType: entityTypeToPrisma("launch"),
        entityId: input.id,
        before: auditJson(before),
        after: auditJson(launch),
      })

      return launchFromDb(launch)
    })
  },

  async listTimelineEvents(launchId) {
    const launch = await prisma.launch.findFirst({
      where: { OR: [{ id: launchId }, { sourceLaunchId: launchId }, { slug: launchId }] },
      select: { id: true },
    })

    if (!launch) return []

    const events = await prisma.missionTimelineEvent.findMany({
      where: { launchId: launch.id },
      orderBy: [{ sortOrder: "asc" }, { relativeTime: "asc" }],
    })

    return events.map(timelineEventFromDb)
  },

  async updateTimelineEvent(input, actorId) {
    return prisma.$transaction(async (tx) => {
      const before = await tx.missionTimelineEvent.findUniqueOrThrow({
        where: { id: input.id },
      })
      const event = await tx.missionTimelineEvent.update({
        where: { id: input.id },
        data: {
          type: prismaEnum.timelineType(input.type),
          title: localizedToJson(input.title),
          description: localizedToJson(input.description),
          relativeTime: input.relativeTime,
          status: prismaEnum.timelineStatus(input.status),
          sortOrder: input.sortOrder,
        },
      })
      await writeAudit(tx, {
        actorId,
        action: "UPDATE",
        entityType: entityTypeToPrisma("timeline_event"),
        entityId: input.id,
        before: auditJson(before),
        after: auditJson(event),
      })
      return timelineEventFromDb(event)
    })
  },

  async listArticles() {
    const articles = await prisma.article.findMany({
      include: { sources: true },
      orderBy: { updatedAt: "desc" },
    })
    return articles.map(articleFromDb)
  },

  async getArticleById(id) {
    const article = await prisma.article.findUnique({
      where: { id },
      include: { sources: true },
    })
    return article ? articleFromDb(article) : undefined
  },

  async updateArticle(input, actorId) {
    return prisma.$transaction(async (tx) => {
      const before = await tx.article.findUniqueOrThrow({ where: { id: input.id } })
      const article = await tx.article.update({
        where: { id: input.id },
        data: {
          slug: input.slug,
          title: localizedToJson(input.title),
          body: localizedToJson(input.body),
          seoTitle: localizedToJson(input.seoTitle),
          metaDescription: localizedToJson(input.metaDescription),
          category: input.category,
        },
        include: { sources: true },
      })
      await writeAudit(tx, {
        actorId,
        action: "UPDATE",
        entityType: entityTypeToPrisma("article"),
        entityId: input.id,
        before: auditJson(before),
        after: auditJson(article),
      })
      return articleFromDb(article)
    })
  },

  async listNews() {
    const news = await prisma.newsItem.findMany({
      include: { sources: true },
      orderBy: { publicationDate: "desc" },
    })
    return news.map(newsFromDb)
  },

  async getNewsById(id) {
    const item = await prisma.newsItem.findUnique({
      where: { id },
      include: { sources: true },
    })
    return item ? newsFromDb(item) : undefined
  },

  async updateNews(input, actorId) {
    return prisma.$transaction(async (tx) => {
      const before = await tx.newsItem.findUniqueOrThrow({ where: { id: input.id } })
      const item = await tx.newsItem.update({
        where: { id: input.id },
        data: {
          slug: input.slug,
          title: localizedToJson(input.title),
          summary: localizedToJson(input.summary),
          sourceName: input.sourceName,
          sourceUrl: input.sourceUrl,
          publicationDate: input.publicationDate,
          confidenceLevel: prismaEnum.confidence(input.confidenceLevel),
        },
        include: { sources: true },
      })
      await writeAudit(tx, {
        actorId,
        action: "UPDATE",
        entityType: entityTypeToPrisma("news_item"),
        entityId: input.id,
        before: auditJson(before),
        after: auditJson(item),
      })
      return newsFromDb(item)
    })
  },

  async listFAQs() {
    const faqs = await prisma.fAQItem.findMany({
      include: { sources: true },
      orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
    })
    return faqs.map(faqFromDb)
  },

  async getFAQById(id) {
    const item = await prisma.fAQItem.findUnique({
      where: { id },
      include: { sources: true },
    })
    return item ? faqFromDb(item) : undefined
  },

  async updateFAQ(input, actorId) {
    return prisma.$transaction(async (tx) => {
      const before = await tx.fAQItem.findUniqueOrThrow({ where: { id: input.id } })
      const item = await tx.fAQItem.update({
        where: { id: input.id },
        data: {
          group: prismaEnum.faqGroup(input.group),
          question: localizedToJson(input.question),
          answer: localizedToJson(input.answer),
          sortOrder: input.sortOrder,
        },
        include: { sources: true },
      })
      await writeAudit(tx, {
        actorId,
        action: "UPDATE",
        entityType: entityTypeToPrisma("faq_item"),
        entityId: input.id,
        before: auditJson(before),
        after: auditJson(item),
      })
      return faqFromDb(item)
    })
  },

  async listSources() {
    const sources = await prisma.sourceRecord.findMany({
      orderBy: [{ trustLevel: "asc" }, { updatedAt: "desc" }],
    })
    return sources.map(sourceFromDb)
  },

  async getSourceById(id) {
    const source = await prisma.sourceRecord.findUnique({ where: { id } })
    return source ? sourceFromDb(source) : undefined
  },

  async updateSource(input, actorId) {
    return prisma.$transaction(async (tx) => {
      const before = await tx.sourceRecord.findUniqueOrThrow({ where: { id: input.id } })
      const source = await tx.sourceRecord.update({
        where: { id: input.id },
        data: {
          launchId: input.launchId,
          articleId: input.articleId,
          newsItemId: input.newsItemId,
          faqItemId: input.faqItemId,
          kind: prismaEnum.sourceKind(input.kind),
          title: localizedToJson(input.title),
          publisher: input.publisher,
          url: input.url,
          confidenceLevel: prismaEnum.confidence(input.confidenceLevel),
          isPrimary: input.trustLevel === "primary",
          notes: input.notes,
          sourceType: prismaEnum.sourceType(input.sourceType),
          trustLevel: prismaEnum.trustLevel(input.trustLevel),
          lastCheckedAt: new Date(),
        },
      })
      await writeAudit(tx, {
        actorId,
        action: "UPDATE",
        entityType: entityTypeToPrisma("source_record"),
        entityId: input.id,
        before: auditJson(before),
        after: auditJson(source),
      })
      return sourceFromDb(source)
    })
  },

  async listSourceConflicts() {
    const conflicts = await prisma.sourceConflict.findMany({
      orderBy: { updatedAt: "desc" },
    })
    return conflicts.map(conflictFromDb)
  },

  async listAIDrafts(filters) {
    const where: Prisma.AIDraftWhereInput = {}

    if (filters?.type) where.type = prismaEnum.aiDraftType(filters.type)
    if (filters?.status) where.status = prismaEnum.aiDraftStatus(filters.status)
    if (filters?.relatedEntityId) where.relatedEntityId = filters.relatedEntityId
    if (filters?.from) where.createdAt = { gte: new Date(filters.from) }

    const drafts = await prisma.aIDraft.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 200,
    })
    const mapped = drafts.map(aiDraftFromDb)

    if (!filters?.confidence) return mapped

    const needle = filters.confidence.toLowerCase()
    return mapped.filter((draft) =>
      `${draft.confidenceNotes.en} ${draft.confidenceNotes.ru}`.toLowerCase().includes(needle)
    )
  },

  async getAIDraftById(id) {
    const draft = await prisma.aIDraft.findUnique({ where: { id } })
    return draft ? aiDraftFromDb(draft) : undefined
  },

  async getSettings() {
    return {
      siteName: "SpaceX",
      enabledLocales: ["en", "ru"],
      defaultLocale: "en",
      dataSyncEnabled: false,
      launchLibraryApiConfigured: false,
      youtubeDataApiConfigured: Boolean(process.env.YOUTUBE_API_KEY),
      openAiConfigured: Boolean(process.env.OPENAI_API_KEY),
      aiDraftsEnabled: process.env.ENABLE_AI_DRAFTS === "true",
      editorCanPublish: false,
      requireApprovalForAiDrafts: true,
    } satisfies AdminSettings
  },

  async createLaunch(input, actorId) {
    return prisma.$transaction(async (tx) => {
      const launch = await tx.launch.create({
        data: {
          slug: input.slug,
          missionName: localizedToJson(input.missionName),
          contentTitle: localizedToJson(input.missionName),
          contentDescription: localizedToJson(localized("Draft launch description.")),
          seoTitle: localizedToJson(input.missionName),
          metaDescription: localizedToJson(localized("Draft launch metadata.")),
          rocket: { id: input.rocketName.toLowerCase().replaceAll(" ", "-"), name: input.rocketName },
          launchPad: {
            id: input.launchPadName.toLowerCase().replaceAll(" ", "-"),
            name: input.launchPadName,
            location: { en: "TBD", ru: "TBD" },
          },
          launchDateTimeUtc: input.launchDateTimeUtc,
          localTimeDisplayHelper: "Render viewer-local time from launchDateTimeUtc on the client.",
          trajectory: localized("TBD"),
          payload: localized("TBD"),
          missionDescription: localized("Draft launch description."),
          confidenceLevel: prismaEnum.confidence(input.confidenceLevel),
          status: prismaEnum.launchStatus(input.status),
        },
        include: { sourceRecords: true },
      })

      await writeAudit(tx, {
        actorId,
        action: "CREATE",
        entityType: entityTypeToPrisma("launch"),
        entityId: launch.id,
        after: auditJson(launch),
      })

      return launchFromDb(launch)
    })
  },

  async updateLaunchStatus(id, status, actorId) {
    return prisma.$transaction(async (tx) => {
      const before = await tx.launch.findUniqueOrThrow({ where: { id } })
      const launch = await tx.launch.update({
        where: { id },
        data: { status: prismaEnum.launchStatus(status) },
        include: { sourceRecords: true },
      })

      await writeAudit(tx, {
        actorId,
        action: "UPDATE",
        entityType: entityTypeToPrisma("launch"),
        entityId: id,
        before: auditJson(before),
        after: auditJson(launch),
      })

      return launchFromDb(launch)
    })
  },

  async createTimelineEvent(input, actorId) {
    return prisma.$transaction(async (tx) => {
      const last = await tx.missionTimelineEvent.findFirst({
        where: { launchId: input.launchId },
        orderBy: { sortOrder: "desc" },
      })
      const event = await tx.missionTimelineEvent.create({
        data: {
          launchId: input.launchId,
          type: prismaEnum.timelineType(input.type),
          title: localizedToJson(input.title),
          description: localizedToJson(input.description),
          relativeTime: input.relativeTime,
          status: prismaEnum.timelineStatus(input.status),
          confidenceLevel: "ESTIMATED",
          sortOrder: (last?.sortOrder ?? -1) + 1,
        },
      })

      await writeAudit(tx, {
        actorId,
        action: "CREATE",
        entityType: entityTypeToPrisma("timeline_event"),
        entityId: event.id,
        after: auditJson(event),
      })

      return timelineEventFromDb(event)
    })
  },

  async updateTimelineEventStatus(id, status, actorId) {
    return prisma.$transaction(async (tx) => {
      const before = await tx.missionTimelineEvent.findUniqueOrThrow({ where: { id } })
      const event = await tx.missionTimelineEvent.update({
        where: { id },
        data: { status: prismaEnum.timelineStatus(status) },
      })
      await writeAudit(tx, {
        actorId,
        action: "UPDATE",
        entityType: entityTypeToPrisma("timeline_event"),
        entityId: id,
        before: auditJson(before),
        after: auditJson(event),
      })
      return timelineEventFromDb(event)
    })
  },

  async deleteTimelineEvent(id, actorId) {
    await prisma.$transaction(async (tx) => {
      const before = await tx.missionTimelineEvent.delete({ where: { id } })
      await writeAudit(tx, {
        actorId,
        action: "DELETE",
        entityType: entityTypeToPrisma("timeline_event"),
        entityId: id,
        before: auditJson(before),
      })
    })
  },

  async createArticle(input, actorId) {
    return prisma.$transaction(async (tx) => {
      const article = await tx.article.create({
        data: {
          slug: input.slug,
          title: localizedToJson(input.title),
          body: localizedToJson(input.body),
          seoTitle: localizedToJson(input.title),
          metaDescription: localizedToJson(input.body),
          category: input.category,
        },
        include: { sources: true },
      })
      await writeAudit(tx, {
        actorId,
        action: "CREATE",
        entityType: entityTypeToPrisma("article"),
        entityId: article.id,
        after: auditJson(article),
      })
      return articleFromDb(article)
    })
  },

  async updateArticleStatus(id, status, actorId) {
    return this.transitionApproval(id, status, actorId).then(async () => {
      const article = await prisma.article.findUniqueOrThrow({
        where: { id },
        include: { sources: true },
      })
      return articleFromDb(article)
    })
  },

  async createNews(input, actorId) {
    return prisma.$transaction(async (tx) => {
      const item = await tx.newsItem.create({
        data: {
          slug: input.slug,
          title: localizedToJson(input.title),
          summary: localizedToJson(input.summary),
          sourceName: input.sourceName,
          sourceUrl: input.sourceUrl,
          publicationDate: input.publicationDate,
          confidenceLevel: prismaEnum.confidence(input.confidenceLevel),
        },
        include: { sources: true },
      })
      await writeAudit(tx, {
        actorId,
        action: "CREATE",
        entityType: entityTypeToPrisma("news_item"),
        entityId: item.id,
        after: auditJson(item),
      })
      return newsFromDb(item)
    })
  },

  async updateNewsStatus(id, status, actorId) {
    return this.transitionApproval(id, status, actorId).then(async () => {
      const item = await prisma.newsItem.findUniqueOrThrow({
        where: { id },
        include: { sources: true },
      })
      return newsFromDb(item)
    })
  },

  async createFAQ(input, actorId) {
    return prisma.$transaction(async (tx) => {
      const last = await tx.fAQItem.findFirst({
        where: { group: prismaEnum.faqGroup(input.group) },
        orderBy: { sortOrder: "desc" },
      })
      const item = await tx.fAQItem.create({
        data: {
          group: prismaEnum.faqGroup(input.group),
          question: localizedToJson(input.question),
          answer: localizedToJson(input.answer),
          sortOrder: (last?.sortOrder ?? -1) + 1,
        },
        include: { sources: true },
      })
      await writeAudit(tx, {
        actorId,
        action: "CREATE",
        entityType: entityTypeToPrisma("faq_item"),
        entityId: item.id,
        after: auditJson(item),
      })
      return faqFromDb(item)
    })
  },

  async updateFAQStatus(id, status, actorId) {
    return this.transitionApproval(id, status, actorId).then(async () => {
      const item = await prisma.fAQItem.findUniqueOrThrow({
        where: { id },
        include: { sources: true },
      })
      return faqFromDb(item)
    })
  },

  async createSource(input, actorId) {
    return prisma.$transaction(async (tx) => {
      const source = await tx.sourceRecord.create({
        data: {
          launchId: input.launchId,
          articleId: input.articleId,
          newsItemId: input.newsItemId,
          faqItemId: input.faqItemId,
          kind: prismaEnum.sourceKind(input.kind),
          title: localizedToJson(input.title),
          publisher: input.publisher,
          url: input.url,
          confidenceLevel: prismaEnum.confidence(input.confidenceLevel),
          isPrimary: input.trustLevel === "primary",
          notes: input.notes,
          sourceType: prismaEnum.sourceType(input.sourceType),
          trustLevel: prismaEnum.trustLevel(input.trustLevel),
          lastCheckedAt: new Date(),
        },
      })
      await writeAudit(tx, {
        actorId,
        action: "CREATE",
        entityType: entityTypeToPrisma("source_record"),
        entityId: source.id,
        after: auditJson(source),
      })
      return sourceFromDb(source)
    })
  },

  async updateSourceTrust(id, trustLevel, actorId) {
    return prisma.$transaction(async (tx) => {
      const before = await tx.sourceRecord.findUniqueOrThrow({ where: { id } })
      const source = await tx.sourceRecord.update({
        where: { id },
        data: {
          trustLevel: prismaEnum.trustLevel(trustLevel),
          isPrimary: trustLevel === "primary",
          lastCheckedAt: new Date(),
        },
      })
      await writeAudit(tx, {
        actorId,
        action: "UPDATE",
        entityType: entityTypeToPrisma("source_record"),
        entityId: id,
        before: auditJson(before),
        after: auditJson(source),
      })
      return sourceFromDb(source)
    })
  },

  async createAIDraft(input) {
    const aiModerator =
      (await prisma.adminUser.findFirst({ where: { role: "AI_MODERATOR" } })) ??
      (await prisma.adminUser.create({
        data: { name: "AI Moderator", role: "AI_MODERATOR", isHuman: false },
      }))

    return prisma.$transaction(async (tx) => {
      const draft = await tx.aIDraft.create({
        data: {
          type: prismaEnum.aiDraftType(input.type),
          status: input.status ? prismaEnum.aiDraftStatus(input.status) : undefined,
          relatedEntityType: toPrismaEntityType(input.relatedEntityType),
          relatedEntityId: input.relatedEntityId,
          createdById: aiModerator.id,
          title: localizedToJson(input.title),
          content: localizedToJson(input.content),
          contentJson: input.contentJson === undefined ? undefined : auditJson(input.contentJson),
          contentRu: input.contentRu,
          contentEn: input.contentEn,
          citations: input.citations as unknown as Prisma.InputJsonValue,
          sourcesJson: input.sourcesJson === undefined ? undefined : auditJson(input.sourcesJson),
          confidenceNotes: localizedToJson(input.confidenceNotes),
          riskNotes: localizedToJson(input.riskNotes),
          missingData: input.missingData === undefined ? undefined : auditJson(input.missingData),
          sourceComparison: input.sourceComparison === undefined ? [] : auditJson(input.sourceComparison),
          provider: input.provider ?? "mock",
          model: input.model,
          promptVersion: input.promptVersion ?? "ai-drafts-v1",
        },
      })
      await writeAudit(tx, {
        actorId: aiModerator.id,
        action: input.status === "rejected" ? "AI_GENERATE_FAILED" : "AI_GENERATE_SUCCEEDED",
        entityType: entityTypeToPrisma("ai_draft"),
        entityId: draft.id,
        after: auditJson(draft),
        reason: "AI draft creation only; no publish rights.",
      })
      return aiDraftFromDb(draft)
    })
  },

  async updateAIDraftStatus(id, status, actorId) {
    return prisma.$transaction(async (tx) => {
      const before = await tx.aIDraft.findUniqueOrThrow({ where: { id } })
      const draft = await tx.aIDraft.update({
        where: { id },
        data: {
          status: prismaEnum.aiDraftStatus(status),
          reviewedById: ["approved", "rejected", "archived"].includes(status) ? actorId : before.reviewedById,
          reviewedAt: ["approved", "rejected", "archived"].includes(status) ? new Date() : before.reviewedAt,
        },
      })
      await writeAudit(tx, {
        actorId,
        action:
          status === "approved"
            ? "AI_DRAFT_APPROVED"
            : status === "rejected"
              ? "AI_DRAFT_REJECTED"
              : status === "archived"
                ? "AI_DRAFT_ARCHIVED"
                : "UPDATE",
        entityType: entityTypeToPrisma("ai_draft"),
        entityId: id,
        before: auditJson(before),
        after: auditJson(draft),
      })
      return aiDraftFromDb(draft)
    })
  },

  async mergeAIDraft(id, actorId) {
    return prisma.$transaction(async (tx) => {
      const before = await tx.aIDraft.findUniqueOrThrow({ where: { id } })

      if (before.status !== "APPROVED") {
        throw new Error("Approve the AI draft before merging it into editable content.")
      }

      const content =
        before.contentJson && typeof before.contentJson === "object" && !Array.isArray(before.contentJson)
          ? (before.contentJson as Record<string, unknown>)
          : {}
      const localizedField = (enKey: string, ruKey: string, fallback = "") => ({
        en: typeof content[enKey] === "string" ? (content[enKey] as string) : fallback,
        ru: typeof content[ruKey] === "string" ? (content[ruKey] as string) : fallback,
      })
      const protectedStatuses = ["APPROVED", "PUBLISHED"]

      if (before.relatedEntityType === "LAUNCH") {
        const launch = await tx.launch.findUniqueOrThrow({ where: { id: before.relatedEntityId } })
        if (protectedStatuses.includes(launch.publishStatus)) {
          throw new Error("AI drafts cannot overwrite approved or published launch records.")
        }

        if (before.type === "LAUNCH_SUMMARY") {
          await tx.launch.update({
            where: { id: launch.id },
            data: {
              contentTitle: localizedToJson(localizedField("titleEn", "titleRu", "")),
              contentDescription: localizedToJson(localizedField("summaryEn", "summaryRu", "")),
              missionDescription: localizedToJson(localizedField("summaryEn", "summaryRu", "")),
              aiGenerated: true,
            },
          })
        } else if (before.type === "SEO") {
          await tx.launch.update({
            where: { id: launch.id },
            data: {
              seoTitle: localizedToJson(localizedField("seoTitleEn", "seoTitleRu", "")),
              metaDescription: localizedToJson(localizedField("metaDescriptionEn", "metaDescriptionRu", "")),
              aiGenerated: true,
            },
          })
        } else if (before.type === "ARTICLE") {
          const slug = `${launch.slug}-ai-${before.id.slice(0, 8)}`
          await tx.article.create({
            data: {
              slug,
              title: localizedToJson(localizedField("titleEn", "titleRu", "AI article draft")),
              body: localizedToJson(localizedField("bodyEn", "bodyRu", "")),
              seoTitle: localizedToJson(localizedField("seoTitleEn", "seoTitleRu", "AI article draft")),
              metaDescription: localizedToJson(localizedField("metaDescriptionEn", "metaDescriptionRu", "")),
              category: typeof content.category === "string" ? content.category : "mission-guide",
              aiDraftId: before.id,
            },
          })
        } else if (before.type === "TIMELINE_SUGGESTION" && Array.isArray(content.suggestedEvents)) {
          const last = await tx.missionTimelineEvent.findFirst({
            where: { launchId: launch.id },
            orderBy: { sortOrder: "desc" },
          })
          let sortOrder = (last?.sortOrder ?? -1) + 1
          for (const event of content.suggestedEvents) {
            if (!event || typeof event !== "object" || Array.isArray(event)) continue
            const record = event as Record<string, unknown>
            await tx.missionTimelineEvent.create({
              data: {
                launchId: launch.id,
                type: prismaEnum.timelineType(
                  typeof record.eventType === "string" ? record.eventType : "custom"
                ),
                title: localizedToJson({
                  en: typeof record.titleEn === "string" ? record.titleEn : "AI timeline event",
                  ru: typeof record.titleRu === "string" ? record.titleRu : "AI timeline event",
                }),
                description: localizedToJson({
                  en: typeof record.descriptionEn === "string" ? record.descriptionEn : "",
                  ru: typeof record.descriptionRu === "string" ? record.descriptionRu : "",
                }),
                relativeTime: typeof record.relativeTime === "string" ? record.relativeTime : "T+00:00",
                status: "ESTIMATED",
                confidenceLevel: prismaEnum.confidence(
                  typeof record.confidenceLevel === "string" ? record.confidenceLevel : "estimated"
                ),
                sortOrder,
                aiGenerated: true,
              },
            })
            sortOrder += 1
          }
        } else {
          throw new Error("This AI draft type is review-only and cannot be merged into launch content.")
        }
      } else if (before.relatedEntityType === "ARTICLE") {
        const article = await tx.article.findUniqueOrThrow({ where: { id: before.relatedEntityId } })
        if (protectedStatuses.includes(article.publishStatus)) {
          throw new Error("AI drafts cannot overwrite approved or published article records.")
        }
        await tx.article.update({
          where: { id: article.id },
          data: {
            title: localizedToJson(localizedField("titleEn", "titleRu", article.slug)),
            body: localizedToJson(localizedField("bodyEn", "bodyRu", "")),
            seoTitle: localizedToJson(localizedField("seoTitleEn", "seoTitleRu", article.slug)),
            metaDescription: localizedToJson(localizedField("metaDescriptionEn", "metaDescriptionRu", "")),
            category: typeof content.category === "string" ? content.category : article.category,
            aiDraftId: before.id,
          },
        })
      } else if (before.relatedEntityType === "NEWS_ITEM") {
        const item = await tx.newsItem.findUniqueOrThrow({ where: { id: before.relatedEntityId } })
        if (protectedStatuses.includes(item.publishStatus)) {
          throw new Error("AI drafts cannot overwrite approved or published news records.")
        }
        await tx.newsItem.update({
          where: { id: item.id },
          data: {
            title: localizedToJson(localizedField("titleEn", "titleRu", item.slug)),
            summary: localizedToJson(localizedField("summaryEn", "summaryRu", "")),
          },
        })
      } else if (before.relatedEntityType === "FAQ_ITEM" || before.type === "FAQ") {
        if (!Array.isArray(content.items)) {
          throw new Error("FAQ draft has no valid items to merge.")
        }
        for (const item of content.items) {
          if (!item || typeof item !== "object" || Array.isArray(item)) continue
          const record = item as Record<string, unknown>
          await tx.fAQItem.create({
            data: {
              group: prismaEnum.faqGroup(typeof content.group === "string" ? content.group : "basics"),
              question: localizedToJson({
                en: typeof record.questionEn === "string" ? record.questionEn : "AI FAQ question",
                ru: typeof record.questionRu === "string" ? record.questionRu : "AI FAQ question",
              }),
              answer: localizedToJson({
                en: typeof record.answerEn === "string" ? record.answerEn : "",
                ru: typeof record.answerRu === "string" ? record.answerRu : "",
              }),
            },
          })
        }
      } else {
        throw new Error("This AI draft type is review-only and cannot be merged automatically.")
      }

      const draft = await tx.aIDraft.update({
        where: { id },
        data: {
          status: "MERGED",
          reviewedById: actorId,
          reviewedAt: new Date(),
        },
      })
      await writeAudit(tx, {
        actorId,
        action: "AI_DRAFT_MERGED",
        entityType: entityTypeToPrisma("ai_draft"),
        entityId: id,
        before: auditJson(before),
        after: auditJson(draft),
        reason: "AI draft merged into editable draft content only.",
      })
      return aiDraftFromDb(draft)
    })
  },

  async transitionApproval(entityId, status, userId, comments) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.adminUser.findUniqueOrThrow({ where: { id: userId } })
      const targets = await Promise.all([
        tx.launch.findUnique({ where: { id: entityId } }),
        tx.article.findUnique({ where: { id: entityId } }),
        tx.newsItem.findUnique({ where: { id: entityId } }),
        tx.fAQItem.findUnique({ where: { id: entityId } }),
      ])
      const [launch, article, news, faq] = targets
      const current = launch ?? article ?? news ?? faq

      if (!current) {
        throw new Error(`No publishable entity found for ${entityId}`)
      }

      const entityType = launch
        ? entityTypeToPrisma("launch")
        : article
          ? entityTypeToPrisma("article")
          : news
            ? entityTypeToPrisma("news_item")
            : entityTypeToPrisma("faq_item")
      const previousStatus = current.publishStatus

      if (status === "published" && previousStatus !== "APPROVED") {
        if (user.role !== "ADMIN") {
          throw new Error("Publishing requires approval before non-admin publication.")
        }

        await writeAudit(tx, {
          actorId: userId,
          action: "OVERRIDE",
          entityType,
          entityId,
          reason:
            comments ?? "Admin override: publish requested without prior approved status.",
          metadata: { previousStatus, nextStatus: status },
        })
      }

      const data = {
        publishStatus: prismaEnum.publishable(status),
        isPublished: status === "published",
        manualOverride: status === "published" && previousStatus !== "APPROVED",
      }

      if (launch) await tx.launch.update({ where: { id: entityId }, data })
      if (article) {
        await tx.article.update({
          where: { id: entityId },
          data: { publishStatus: prismaEnum.publishable(status) },
        })
      }
      if (news) {
        await tx.newsItem.update({
          where: { id: entityId },
          data: { publishStatus: prismaEnum.publishable(status) },
        })
      }
      if (faq) {
        await tx.fAQItem.update({
          where: { id: entityId },
          data: { publishStatus: prismaEnum.publishable(status) },
        })
      }

      const approval = await persistApproval(tx, entityType, entityId, status, userId, comments)
      await writeAudit(tx, {
        actorId: userId,
        action:
          status === "in_review"
            ? "SUBMIT_FOR_REVIEW"
            : status === "approved"
              ? "APPROVE"
              : status === "rejected"
                ? "REJECT"
                : status === "published"
                  ? "PUBLISH"
                  : status === "archived"
                    ? "ARCHIVE"
                    : "UPDATE",
        entityType,
        entityId,
        before: { publishStatus: previousStatus },
        after: { publishStatus: status },
        reason: comments,
      })

      return approval
    })
  },
}

export function getAdminRepository(): AdminRepository {
  return prismaAdminRepository
}
