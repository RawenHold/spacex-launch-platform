import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db"
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
  AdminArticle,
  AdminDashboardStats,
  AdminFAQItem,
  AdminLaunchRecord,
  AdminNewsItem,
  AdminSettings,
  AdminSourceRecord,
  AdminTimelineEvent,
  AdminUser,
  AIDraft,
  AIDraftType,
  ApprovalRecord,
  PublishableStatus,
  SourceConflict,
} from "@/types/admin"
import type { DataConfidenceLevel, LocalizedText } from "@/types/space"

type EntityType =
  | "launch"
  | "timeline_event"
  | "article"
  | "news_item"
  | "faq_item"
  | "source_record"
  | "ai_draft"

export interface CreateAIDraftInput {
  type: AIDraftType
  relatedEntityType: AIDraft["relatedEntityType"]
  relatedEntityId: string
  title: LocalizedText
  content: LocalizedText
  citations: AdminSourceRecord[]
  confidenceNotes: LocalizedText
  riskNotes: LocalizedText
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

export interface CreateTimelineEventInput {
  launchId: string
  type: AdminTimelineEvent["type"]
  relativeTime: string
  title: LocalizedText
  description: LocalizedText
  status: AdminTimelineEvent["status"]
}

export interface CreateArticleInput {
  slug: string
  title: LocalizedText
  body: LocalizedText
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

export interface CreateFAQInput {
  group: AdminFAQItem["group"]
  question: LocalizedText
  answer: LocalizedText
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

export interface AdminRepository {
  getDashboardStats(): Promise<AdminDashboardStats>
  listUsers(): Promise<AdminUser[]>
  listLaunches(): Promise<AdminLaunchRecord[]>
  getLaunchById(id: string): Promise<AdminLaunchRecord | undefined>
  listTimelineEvents(launchId: string): Promise<AdminTimelineEvent[]>
  listArticles(): Promise<AdminArticle[]>
  listNews(): Promise<AdminNewsItem[]>
  listFAQs(): Promise<AdminFAQItem[]>
  listSources(): Promise<AdminSourceRecord[]>
  listSourceConflicts(): Promise<SourceConflict[]>
  listAIDrafts(): Promise<AIDraft[]>
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
    launch: "LAUNCH",
    timeline_event: "TIMELINE_EVENT",
    article: "ARTICLE",
    news_item: "NEWS_ITEM",
    faq_item: "FAQ_ITEM",
    source_record: "SOURCE_RECORD",
    ai_draft: "AI_DRAFT",
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
    action:
      | "CREATE"
      | "UPDATE"
      | "DELETE"
      | "SUBMIT_FOR_REVIEW"
      | "APPROVE"
      | "REJECT"
      | "PUBLISH"
      | "ARCHIVE"
      | "OVERRIDE"
      | "SIGN_IN"
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

  async listArticles() {
    const articles = await prisma.article.findMany({
      include: { sources: true },
      orderBy: { updatedAt: "desc" },
    })
    return articles.map(articleFromDb)
  },

  async listNews() {
    const news = await prisma.newsItem.findMany({
      include: { sources: true },
      orderBy: { publicationDate: "desc" },
    })
    return news.map(newsFromDb)
  },

  async listFAQs() {
    const faqs = await prisma.fAQItem.findMany({
      include: { sources: true },
      orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
    })
    return faqs.map(faqFromDb)
  },

  async listSources() {
    const sources = await prisma.sourceRecord.findMany({
      orderBy: [{ trustLevel: "asc" }, { updatedAt: "desc" }],
    })
    return sources.map(sourceFromDb)
  },

  async listSourceConflicts() {
    const conflicts = await prisma.sourceConflict.findMany({
      orderBy: { updatedAt: "desc" },
    })
    return conflicts.map(conflictFromDb)
  },

  async listAIDrafts() {
    const drafts = await prisma.aIDraft.findMany({ orderBy: { updatedAt: "desc" } })
    return drafts.map(aiDraftFromDb)
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
          relatedEntityType: toPrismaEntityType(input.relatedEntityType),
          relatedEntityId: input.relatedEntityId,
          createdById: aiModerator.id,
          title: localizedToJson(input.title),
          content: localizedToJson(input.content),
          citations: input.citations as unknown as Prisma.InputJsonValue,
          confidenceNotes: localizedToJson(input.confidenceNotes),
          riskNotes: localizedToJson(input.riskNotes),
          sourceComparison: [],
        },
      })
      await writeAudit(tx, {
        actorId: aiModerator.id,
        action: "CREATE",
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
        data: { status: prismaEnum.aiDraftStatus(status) },
      })
      await writeAudit(tx, {
        actorId,
        action:
          status === "approved"
            ? "APPROVE"
            : status === "rejected"
              ? "REJECT"
              : "UPDATE",
        entityType: entityTypeToPrisma("ai_draft"),
        entityId: id,
        before: auditJson(before),
        after: auditJson(draft),
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
