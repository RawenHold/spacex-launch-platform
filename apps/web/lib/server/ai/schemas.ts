import { z } from "zod"

import type { AIDraftType } from "@/types/admin"

const textArray = z.array(z.string())
const sourceNotes = z.array(z.string())
const confidenceLevel = z.enum([
  "official_confirmed",
  "admin_verified",
  "multi_source_confirmed",
  "estimated",
  "unverified",
  "conflicting",
])

export const launchSummaryDraftSchema = z.object({
  titleRu: z.string(),
  titleEn: z.string(),
  summaryRu: z.string(),
  summaryEn: z.string(),
  keyFacts: textArray,
  timelineNotes: textArray,
  sourceNotes,
  confidenceNotes: textArray,
  riskNotes: textArray,
  missingData: textArray,
  suggestedSourceIds: textArray,
  suggestedEdits: textArray,
})

export const articleDraftSchema = z.object({
  titleRu: z.string(),
  titleEn: z.string(),
  excerptRu: z.string(),
  excerptEn: z.string(),
  bodyRu: z.string(),
  bodyEn: z.string(),
  category: z.string(),
  seoTitleRu: z.string(),
  seoTitleEn: z.string(),
  metaDescriptionRu: z.string(),
  metaDescriptionEn: z.string(),
  tags: textArray,
  sourceNotes,
  confidenceNotes: textArray,
  riskNotes: textArray,
  missingData: textArray,
})

export const newsSummaryDraftSchema = z.object({
  titleRu: z.string(),
  titleEn: z.string(),
  summaryRu: z.string(),
  summaryEn: z.string(),
  sourceNotes,
  confidenceNotes: textArray,
  riskNotes: textArray,
  missingData: textArray,
})

export const faqDraftSchema = z.object({
  group: z.enum(["basics", "falcon9", "starship", "timeline", "livestreams", "accuracy", "reminders"]),
  items: z.array(
    z.object({
      questionRu: z.string(),
      questionEn: z.string(),
      answerRu: z.string(),
      answerEn: z.string(),
      sourceNotes,
      confidenceNotes: textArray,
    })
  ),
})

export const seoDraftSchema = z.object({
  seoTitleRu: z.string(),
  seoTitleEn: z.string(),
  metaDescriptionRu: z.string(),
  metaDescriptionEn: z.string(),
  keywordsRu: textArray,
  keywordsEn: textArray,
  openGraphTitleRu: z.string(),
  openGraphTitleEn: z.string(),
  openGraphDescriptionRu: z.string(),
  openGraphDescriptionEn: z.string(),
})

export const timelineSuggestionDraftSchema = z.object({
  suggestedEvents: z.array(
    z.object({
      relativeTime: z.string().regex(/^T[+-]\d{2}:\d{2}$/),
      eventType: z.enum([
        "countdown",
        "liftoff",
        "max_q",
        "meco",
        "stage_separation",
        "ses",
        "seco",
        "entry_burn",
        "landing_burn",
        "booster_landing",
        "payload_deploy",
        "custom",
      ]),
      titleRu: z.string(),
      titleEn: z.string(),
      descriptionRu: z.string(),
      descriptionEn: z.string(),
      confidenceLevel,
      sourceNotes,
    })
  ),
  missingData: textArray,
  conflictWarnings: textArray,
})

export const sourceComparisonDraftSchema = z.object({
  comparedSources: textArray,
  matchingClaims: textArray,
  conflictingClaims: textArray,
  missingData: textArray,
  recommendedAdminReview: textArray,
  confidenceNotes: textArray,
  riskNotes: textArray,
})

export const aiDraftSchemas = {
  launch_summary: launchSummaryDraftSchema,
  article: articleDraftSchema,
  news_summary: newsSummaryDraftSchema,
  faq: faqDraftSchema,
  seo: seoDraftSchema,
  timeline_suggestion: timelineSuggestionDraftSchema,
  source_comparison: sourceComparisonDraftSchema,
} satisfies Record<AIDraftType, z.ZodType>

const stringSchema = { type: "string" } as const
const stringArraySchema = { type: "array", items: stringSchema } as const

function objectSchema(properties: Record<string, unknown>) {
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required: Object.keys(properties),
  }
}

function arrayOfObjects(properties: Record<string, unknown>) {
  return {
    type: "array",
    items: objectSchema(properties),
  }
}

export const aiJsonSchemas: Record<AIDraftType, Record<string, unknown>> = {
  launch_summary: objectSchema({
    titleRu: stringSchema,
    titleEn: stringSchema,
    summaryRu: stringSchema,
    summaryEn: stringSchema,
    keyFacts: stringArraySchema,
    timelineNotes: stringArraySchema,
    sourceNotes: stringArraySchema,
    confidenceNotes: stringArraySchema,
    riskNotes: stringArraySchema,
    missingData: stringArraySchema,
    suggestedSourceIds: stringArraySchema,
    suggestedEdits: stringArraySchema,
  }),
  article: objectSchema({
    titleRu: stringSchema,
    titleEn: stringSchema,
    excerptRu: stringSchema,
    excerptEn: stringSchema,
    bodyRu: stringSchema,
    bodyEn: stringSchema,
    category: stringSchema,
    seoTitleRu: stringSchema,
    seoTitleEn: stringSchema,
    metaDescriptionRu: stringSchema,
    metaDescriptionEn: stringSchema,
    tags: stringArraySchema,
    sourceNotes: stringArraySchema,
    confidenceNotes: stringArraySchema,
    riskNotes: stringArraySchema,
    missingData: stringArraySchema,
  }),
  news_summary: objectSchema({
    titleRu: stringSchema,
    titleEn: stringSchema,
    summaryRu: stringSchema,
    summaryEn: stringSchema,
    sourceNotes: stringArraySchema,
    confidenceNotes: stringArraySchema,
    riskNotes: stringArraySchema,
    missingData: stringArraySchema,
  }),
  faq: objectSchema({
    group: {
      type: "string",
      enum: ["basics", "falcon9", "starship", "timeline", "livestreams", "accuracy", "reminders"],
    },
    items: arrayOfObjects({
      questionRu: stringSchema,
      questionEn: stringSchema,
      answerRu: stringSchema,
      answerEn: stringSchema,
      sourceNotes: stringArraySchema,
      confidenceNotes: stringArraySchema,
    }),
  }),
  seo: objectSchema({
    seoTitleRu: stringSchema,
    seoTitleEn: stringSchema,
    metaDescriptionRu: stringSchema,
    metaDescriptionEn: stringSchema,
    keywordsRu: stringArraySchema,
    keywordsEn: stringArraySchema,
    openGraphTitleRu: stringSchema,
    openGraphTitleEn: stringSchema,
    openGraphDescriptionRu: stringSchema,
    openGraphDescriptionEn: stringSchema,
  }),
  timeline_suggestion: objectSchema({
    suggestedEvents: arrayOfObjects({
      relativeTime: stringSchema,
      eventType: {
        type: "string",
        enum: [
          "countdown",
          "liftoff",
          "max_q",
          "meco",
          "stage_separation",
          "ses",
          "seco",
          "entry_burn",
          "landing_burn",
          "booster_landing",
          "payload_deploy",
          "custom",
        ],
      },
      titleRu: stringSchema,
      titleEn: stringSchema,
      descriptionRu: stringSchema,
      descriptionEn: stringSchema,
      confidenceLevel: {
        type: "string",
        enum: [
          "official_confirmed",
          "admin_verified",
          "multi_source_confirmed",
          "estimated",
          "unverified",
          "conflicting",
        ],
      },
      sourceNotes: stringArraySchema,
    }),
    missingData: stringArraySchema,
    conflictWarnings: stringArraySchema,
  }),
  source_comparison: objectSchema({
    comparedSources: stringArraySchema,
    matchingClaims: stringArraySchema,
    conflictingClaims: stringArraySchema,
    missingData: stringArraySchema,
    recommendedAdminReview: stringArraySchema,
    confidenceNotes: stringArraySchema,
    riskNotes: stringArraySchema,
  }),
}

export function parseAIDraftOutput(task: AIDraftType, value: unknown) {
  return aiDraftSchemas[task].parse(value)
}
