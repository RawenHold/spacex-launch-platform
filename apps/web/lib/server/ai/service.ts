import type { Prisma } from "@prisma/client"

import { localizedFromJson, sourceFromDb, toPrismaEntityType } from "@/lib/admin/prisma-mappers"
import { getAdminRepository, type CreateAIDraftInput } from "@/lib/admin/repository"
import { prisma } from "@/lib/db"
import { logger } from "@/lib/server/logger"
import { createStructuredOpenAIResponse, openAIConfigured, openAIModel } from "@/lib/server/ai/openai-client"
import { buildAIDraftUserPrompt } from "@/lib/server/ai/prompts"
import { aiJsonSchemas, parseAIDraftOutput } from "@/lib/server/ai/schemas"
import { AI_DRAFT_SYSTEM_PROMPT, friendlyAIError, safeMetadata } from "@/lib/server/ai/safety"
import { AI_PROMPT_VERSION, type AIContext, type AIRuntimeConfig, type GenerateAIDraftRequest } from "@/lib/server/ai/types"
import type { AdminSourceRecord, AIDraftType } from "@/types/admin"
import type { LocalizedText } from "@/types/space"

function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

function localized(en: string, ru = en): LocalizedText {
  return { en, ru }
}

export function getAIRuntimeConfig(): AIRuntimeConfig {
  const enabled = process.env.ENABLE_AI_DRAFTS === "true"
  const apiConfigured = openAIConfigured()

  return {
    enabled,
    apiConfigured,
    realApiAvailable: enabled && apiConfigured,
    provider: enabled && apiConfigured ? "openai" : "mock",
    model: enabled && apiConfigured ? openAIModel() : "mock-deterministic",
    promptVersion: AI_PROMPT_VERSION,
  }
}

async function auditAI(input: {
  actorId?: string
  action: "AI_GENERATE_REQUESTED" | "AI_GENERATE_FAILED"
  relatedEntityType: GenerateAIDraftRequest["relatedEntityType"]
  relatedEntityId: string
  metadata: Record<string, unknown>
  reason?: string
}) {
  await prisma.auditLog
    .create({
      data: {
        actorId: input.actorId,
        action: input.action,
        entityType: toPrismaEntityType(input.relatedEntityType),
        entityId: input.relatedEntityId,
        reason: input.reason,
        metadata: json(safeMetadata(input.metadata)),
      },
    })
    .catch(() => undefined)
}

function sourceRecordsFromDb(sources: Awaited<ReturnType<typeof prisma.sourceRecord.findMany>>): AdminSourceRecord[] {
  return sources.map(sourceFromDb)
}

async function buildContext(request: GenerateAIDraftRequest): Promise<AIContext> {
  if (request.structuredInput || request.sources) {
    return {
      relatedEntityType: request.relatedEntityType,
      relatedEntityId: request.relatedEntityId,
      structuredInput: request.structuredInput ?? {},
      sources: request.sources ?? [],
    }
  }

  if (request.relatedEntityType === "launch") {
    const launch = await prisma.launch.findUnique({
      where: { id: request.relatedEntityId },
      include: { sourceRecords: true, timelineEvents: true, videoRecords: true },
    })

    if (!launch) throw new Error("Launch record was not found for AI context.")

    return {
      relatedEntityType: "launch",
      relatedEntityId: launch.id,
      structuredInput: {
        id: launch.id,
        slug: launch.slug,
        missionName: localizedFromJson(launch.missionName),
        rocket: launch.rocket,
        launchPad: launch.launchPad,
        launchDateTimeUtc: launch.launchDateTimeUtc.toISOString(),
        status: launch.status,
        publishStatus: launch.publishStatus,
        confidenceLevel: launch.confidenceLevel,
        trajectory: localizedFromJson(launch.trajectory),
        payload: localizedFromJson(launch.payload),
        missionDescription: localizedFromJson(launch.missionDescription),
        officialUrl: launch.officialUrl,
        timelineEvents: launch.timelineEvents.map((event) => ({
          type: event.type,
          relativeTime: event.relativeTime,
          title: localizedFromJson(event.title),
          description: localizedFromJson(event.description),
          status: event.status,
          confidenceLevel: event.confidenceLevel,
        })),
        videoCandidates: launch.videoRecords.map((video) => ({
          providerVideoId: video.providerVideoId,
          title: localizedFromJson(video.title),
          publishStatus: video.publishStatus,
          isApproved: video.isApproved,
        })),
      },
      sources: sourceRecordsFromDb(launch.sourceRecords),
    }
  }

  if (request.relatedEntityType === "article") {
    const article = await prisma.article.findUnique({
      where: { id: request.relatedEntityId },
      include: { sources: true },
    })
    if (!article) throw new Error("Article record was not found for AI context.")

    return {
      relatedEntityType: "article",
      relatedEntityId: article.id,
      structuredInput: {
        id: article.id,
        slug: article.slug,
        title: localizedFromJson(article.title),
        body: localizedFromJson(article.body),
        seoTitle: localizedFromJson(article.seoTitle),
        metaDescription: localizedFromJson(article.metaDescription),
        category: article.category,
        publishStatus: article.publishStatus,
      },
      sources: sourceRecordsFromDb(article.sources),
    }
  }

  if (request.relatedEntityType === "news") {
    const news = await prisma.newsItem.findUnique({
      where: { id: request.relatedEntityId },
      include: { sources: true },
    })
    if (!news) throw new Error("News record was not found for AI context.")

    return {
      relatedEntityType: "news",
      relatedEntityId: news.id,
      structuredInput: {
        id: news.id,
        slug: news.slug,
        title: localizedFromJson(news.title),
        summary: localizedFromJson(news.summary),
        sourceName: news.sourceName,
        sourceUrl: news.sourceUrl,
        publicationDate: news.publicationDate.toISOString(),
        confidenceLevel: news.confidenceLevel,
        publishStatus: news.publishStatus,
      },
      sources: sourceRecordsFromDb(news.sources),
    }
  }

  if (request.relatedEntityType === "faq") {
    const faq = await prisma.fAQItem.findUnique({
      where: { id: request.relatedEntityId },
      include: { sources: true },
    })

    return {
      relatedEntityType: "faq",
      relatedEntityId: request.relatedEntityId,
      structuredInput: faq
        ? {
            id: faq.id,
            group: faq.group,
            question: localizedFromJson(faq.question),
            answer: localizedFromJson(faq.answer),
            publishStatus: faq.publishStatus,
          }
        : { id: request.relatedEntityId, note: "No FAQ record found; generate educational draft only." },
      sources: faq ? sourceRecordsFromDb(faq.sources) : [],
    }
  }

  const [source, conflicts] = await Promise.all([
    prisma.sourceRecord.findUnique({ where: { id: request.relatedEntityId } }),
    prisma.sourceConflict.findMany({
      where: { OR: [{ entityId: request.relatedEntityId }, { status: { not: "RESOLVED" } }] },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ])

  return {
    relatedEntityType: "source",
    relatedEntityId: request.relatedEntityId,
    structuredInput: {
      source: source ? sourceFromDb(source) : undefined,
      conflicts: conflicts.map((conflict) => ({
        id: conflict.id,
        entityType: conflict.entityType,
        entityId: conflict.entityId,
        field: conflict.field,
        sources: conflict.sources,
        summary: conflict.summary,
        status: conflict.status,
      })),
    },
    sources: source ? [sourceFromDb(source)] : [],
  }
}

function mockOutput(task: AIDraftType, context: AIContext) {
  const entityLabel = `${context.relatedEntityType}:${context.relatedEntityId}`
  const sourceNames = context.sources.map((source) => source.publisher).filter(Boolean)
  const sourceNotes = sourceNames.length > 0 ? sourceNames : ["No source records were provided."]
  const commonMissing = context.sources.length > 0 ? [] : ["Primary official source record is missing."]

  if (task === "launch_summary") {
    return {
      titleRu: `Черновик миссии ${entityLabel}`,
      titleEn: `Mission draft ${entityLabel}`,
      summaryRu: "Детерминированный mock-черновик. Требуется проверка редактором перед публикацией.",
      summaryEn: "Deterministic mock draft. Editor review is required before publication.",
      keyFacts: ["Uses only provided database context.", "Does not claim official real-time telemetry."],
      timelineNotes: ["Timeline items remain planned or estimated unless confirmed by sources."],
      sourceNotes,
      confidenceNotes: ["Confidence is limited to provided source records."],
      riskNotes: ["Check launch time, payload, webcast, and mission status against primary sources."],
      missingData: commonMissing,
      suggestedSourceIds: context.sources.map((source) => source.id),
      suggestedEdits: ["Review bilingual wording.", "Attach official source before publication."],
    }
  }

  if (task === "article") {
    return {
      titleRu: `Статья: ${entityLabel}`,
      titleEn: `Article: ${entityLabel}`,
      excerptRu: "Mock-выдержка для редакторской проверки.",
      excerptEn: "Mock excerpt for editorial review.",
      bodyRu: "Черновик статьи создан в mock-режиме. Не публиковать без проверки источников.",
      bodyEn: "Article draft created in mock mode. Do not publish without source review.",
      category: "mission-guide",
      seoTitleRu: `SpaceX: ${entityLabel}`,
      seoTitleEn: `SpaceX: ${entityLabel}`,
      metaDescriptionRu: "Черновое SEO-описание для проверки.",
      metaDescriptionEn: "Draft SEO description for review.",
      tags: ["spacex", "launch", "draft"],
      sourceNotes,
      confidenceNotes: ["Mock article confidence depends on admin-supplied sources."],
      riskNotes: ["Avoid uncited factual claims."],
      missingData: commonMissing,
    }
  }

  if (task === "news_summary") {
    return {
      titleRu: `Новость: ${entityLabel}`,
      titleEn: `News: ${entityLabel}`,
      summaryRu: "Mock-сводка новости для проверки редактором.",
      summaryEn: "Mock news summary for editor review.",
      sourceNotes,
      confidenceNotes: ["No external URL was fetched by mock mode."],
      riskNotes: ["Verify publication date and source name."],
      missingData: commonMissing,
    }
  }

  if (task === "faq") {
    return {
      group: "timeline",
      items: [
        {
          questionRu: "Что означает Max Q?",
          questionEn: "What does Max Q mean?",
          answerRu: "Max Q - участок максимальной аэродинамической нагрузки; это образовательный черновик.",
          answerEn: "Max Q is the point of maximum aerodynamic pressure; this is an educational draft.",
          sourceNotes,
          confidenceNotes: ["Educational glossary draft; verify wording before publishing."],
        },
      ],
    }
  }

  if (task === "seo") {
    return {
      seoTitleRu: `SpaceX ${entityLabel}`,
      seoTitleEn: `SpaceX ${entityLabel}`,
      metaDescriptionRu: "Mock SEO metadata for admin review.",
      metaDescriptionEn: "Mock SEO metadata for admin review.",
      keywordsRu: ["SpaceX", "запуск", "миссия"],
      keywordsEn: ["SpaceX", "launch", "mission"],
      openGraphTitleRu: `SpaceX ${entityLabel}`,
      openGraphTitleEn: `SpaceX ${entityLabel}`,
      openGraphDescriptionRu: "Черновик Open Graph описания.",
      openGraphDescriptionEn: "Draft Open Graph description.",
    }
  }

  if (task === "timeline_suggestion") {
    return {
      suggestedEvents: [
        {
          relativeTime: "T-00:10",
          eventType: "countdown",
          titleRu: "Финальный отсчет",
          titleEn: "Terminal countdown",
          descriptionRu: "Плановое событие. Требуется проверка источником.",
          descriptionEn: "Planned event. Source verification required.",
          confidenceLevel: "estimated",
          sourceNotes,
        },
      ],
      missingData: commonMissing,
      conflictWarnings: ["Do not present suggested times as official telemetry."],
    }
  }

  return {
    comparedSources: sourceNames,
    matchingClaims: ["Mock comparison found no machine-verified matching claims."],
    conflictingClaims: ["Admin must inspect source records manually."],
    missingData: commonMissing,
    recommendedAdminReview: ["Compare primary sources before editing approved content."],
    confidenceNotes: ["Mock mode cannot verify external claims."],
    riskNotes: ["Do not silently choose one source over another."],
  }
}

function contentFromOutput(task: AIDraftType, output: Record<string, unknown>) {
  const en =
    (typeof output.summaryEn === "string" && output.summaryEn) ||
    (typeof output.bodyEn === "string" && output.bodyEn) ||
    (typeof output.metaDescriptionEn === "string" && output.metaDescriptionEn) ||
    JSON.stringify(output, null, 2)
  const ru =
    (typeof output.summaryRu === "string" && output.summaryRu) ||
    (typeof output.bodyRu === "string" && output.bodyRu) ||
    (typeof output.metaDescriptionRu === "string" && output.metaDescriptionRu) ||
    en
  const titleEn =
    (typeof output.titleEn === "string" && output.titleEn) ||
    (typeof output.seoTitleEn === "string" && output.seoTitleEn) ||
    `AI draft: ${task.replaceAll("_", " ")}`
  const titleRu =
    (typeof output.titleRu === "string" && output.titleRu) ||
    (typeof output.seoTitleRu === "string" && output.seoTitleRu) ||
    titleEn

  return {
    title: { en: titleEn, ru: titleRu },
    content: { en, ru },
    contentEn: en,
    contentRu: ru,
    confidenceNotes: {
      en: Array.isArray(output.confidenceNotes) ? output.confidenceNotes.join("\n") : "Review required.",
      ru: Array.isArray(output.confidenceNotes) ? output.confidenceNotes.join("\n") : "Review required.",
    },
    riskNotes: {
      en: Array.isArray(output.riskNotes) ? output.riskNotes.join("\n") : "Review for source coverage and uncertainty.",
      ru: Array.isArray(output.riskNotes) ? output.riskNotes.join("\n") : "Review for source coverage and uncertainty.",
    },
    missingData: Array.isArray(output.missingData) ? output.missingData : [],
  }
}

function draftInputFromOutput(
  request: GenerateAIDraftRequest,
  context: AIContext,
  output: Record<string, unknown>,
  runtime: AIRuntimeConfig
): CreateAIDraftInput {
  const mapped = contentFromOutput(request.task, output)

  return {
    type: request.task,
    relatedEntityType: request.relatedEntityType,
    relatedEntityId: request.relatedEntityId,
    title: mapped.title,
    content: mapped.content,
    contentJson: output,
    contentEn: mapped.contentEn,
    contentRu: mapped.contentRu,
    citations: context.sources,
    sourcesJson: context.sources,
    confidenceNotes: mapped.confidenceNotes,
    riskNotes: mapped.riskNotes,
    missingData: mapped.missingData,
    sourceComparison: request.task === "source_comparison" ? output : undefined,
    provider: runtime.provider,
    model: runtime.model,
    promptVersion: runtime.promptVersion,
  }
}

function failedDraftInput(
  request: GenerateAIDraftRequest,
  context: AIContext,
  error: string,
  runtime: AIRuntimeConfig
): CreateAIDraftInput {
  return {
    type: request.task,
    status: "rejected",
    relatedEntityType: request.relatedEntityType,
    relatedEntityId: request.relatedEntityId,
    title: localized("Failed AI draft attempt", "Failed AI draft attempt"),
    content: localized(error),
    contentJson: { error, task: request.task },
    contentEn: error,
    contentRu: error,
    citations: context.sources,
    sourcesJson: context.sources,
    confidenceNotes: localized("No valid draft was generated."),
    riskNotes: localized("The failed attempt was saved for review; do not merge invalid output."),
    missingData: [error],
    provider: runtime.provider,
    model: runtime.model,
    promptVersion: runtime.promptVersion,
  }
}

export function dryRunAIDraftFixture(task: AIDraftType = "launch_summary") {
  const context: AIContext = {
    relatedEntityType: "launch",
    relatedEntityId: "dry-run-launch",
    structuredInput: {
      missionName: { en: "Falcon 9 dry-run mission", ru: "Falcon 9 dry-run mission" },
      launchDateTimeUtc: "2026-07-10T02:14:00.000Z",
      confidenceLevel: "estimated",
    },
    sources: [],
  }
  const output = parseAIDraftOutput(task, mockOutput(task, context))

  return {
    dryRun: true,
    writes: false,
    runtime: getAIRuntimeConfig(),
    task,
    output,
  }
}

export async function generateAIDraft(request: GenerateAIDraftRequest) {
  const repository = getAdminRepository()
  const context = await buildContext(request)
  const runtime = getAIRuntimeConfig()

  await auditAI({
    actorId: request.actorId,
    action: "AI_GENERATE_REQUESTED",
    relatedEntityType: request.relatedEntityType,
    relatedEntityId: request.relatedEntityId,
    reason: "Admin requested AI draft generation.",
    metadata: {
      task: request.task,
      provider: runtime.provider,
      model: runtime.model,
      promptVersion: runtime.promptVersion,
      sourceCount: context.sources.length,
      inputKeys: Object.keys(context.structuredInput),
      realApiAvailable: runtime.realApiAvailable,
    },
  })

  try {
    const rawOutput = runtime.realApiAvailable
      ? await createStructuredOpenAIResponse({
          model: runtime.model,
          schemaName: `${request.task}_draft`,
          jsonSchema: aiJsonSchemas[request.task],
          systemPrompt: AI_DRAFT_SYSTEM_PROMPT,
          userPrompt: buildAIDraftUserPrompt(request, context),
        })
      : mockOutput(request.task, context)
    const output = parseAIDraftOutput(request.task, rawOutput) as Record<string, unknown>

    if (request.dryRun) {
      return draftInputFromOutput(request, context, output, runtime)
    }

    return repository.createAIDraft(draftInputFromOutput(request, context, output, runtime))
  } catch (error) {
    const friendly = friendlyAIError(error)
    logger.error("ai_generate_failed", {
      task: request.task,
      relatedEntityType: request.relatedEntityType,
      relatedEntityId: request.relatedEntityId,
      provider: runtime.provider,
      model: runtime.model,
      message: friendly,
    })

    await auditAI({
      actorId: request.actorId,
      action: "AI_GENERATE_FAILED",
      relatedEntityType: request.relatedEntityType,
      relatedEntityId: request.relatedEntityId,
      reason: friendly,
      metadata: {
        task: request.task,
        provider: runtime.provider,
        model: runtime.model,
        promptVersion: runtime.promptVersion,
      },
    })

    if (request.dryRun) throw new Error(friendly)

    return repository.createAIDraft(failedDraftInput(request, context, friendly, runtime))
  }
}
