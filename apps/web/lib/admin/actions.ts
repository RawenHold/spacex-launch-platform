"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdminPermission, requireAdminRole } from "@/lib/admin/auth"
import { enforceAdminWriteRateLimit } from "@/lib/admin/rate-limit"
import { getAdminRepository } from "@/lib/admin/repository"
import { generateAIDraft } from "@/lib/server/ai/service"
import { getSafeServerEnvStatus } from "@/lib/server/env"
import { runLaunchLibrarySync } from "@/lib/server/sync/sync-service"
import {
  addManualYouTubeVideoCandidate,
  discoverAndStoreYouTubeVideos,
  updateVideoRecordStatus,
} from "@/lib/server/youtube/service"
import {
  clearLiveMissionBanner,
  completeLiveMission,
  initializeLiveMissionState,
  setLiveMissionActiveEvent,
  updateLiveMissionBanner,
  updateLiveMissionMode,
  updateLiveMissionStreamStatus,
  updateLiveMissionTiming,
  updateLiveTimelineEventStatus,
} from "@/lib/server/live-mission/service"
import type {
  AdminLaunchRecord,
  AdminRole,
  AdminSourceRecord,
  AdminTimelineEvent,
  AIDraft,
} from "@/types/admin"
import type { LocalizedText } from "@/types/space"

const localizedSchema = z.object({
  en: z.string().min(1),
  ru: z.string().min(1),
})

const confidenceSchema = z.enum([
  "official_confirmed",
  "admin_verified",
  "multi_source_confirmed",
  "estimated",
  "unverified",
  "conflicting",
])

const publishableSchema = z.enum([
  "draft",
  "in_review",
  "approved",
  "published",
  "rejected",
  "archived",
])

const aiDraftStatusSchema = z.enum([
  "generated",
  "needs_review",
  "approved",
  "rejected",
  "merged",
  "archived",
])

const aiDraftTypeSchema = z.enum([
  "launch_summary",
  "article",
  "news_summary",
  "faq",
  "seo",
  "timeline_suggestion",
  "source_comparison",
])

const aiRelatedEntitySchema = z.enum(["launch", "article", "news", "source", "faq"])

const slugSchema = z
  .string()
  .min(3, "Use at least 3 characters.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.")

const urlSchema = z
  .string()
  .trim()
  .url("Use a valid URL.")
  .optional()
  .or(z.literal("").transform(() => undefined))

const relativeTimeSchema = z
  .string()
  .regex(/^T[+-]\d{2}:\d{2}$/, "Use a relative time like T-00:10 or T+01:12.")

const validDateSchema = z.coerce.date().refine((date) => !Number.isNaN(date.getTime()), {
  message: "Use a valid date.",
})

const launchStatusSchema = z.enum([
  "draft",
  "scheduled",
  "confirmed",
  "live",
  "delayed",
  "scrubbed",
  "success",
  "failure",
  "partial_success",
])

const timelineTypeSchema = z.enum([
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
])

const timelineStatusSchema = z.enum(["planned", "confirmed", "estimated", "skipped", "failed"])

const liveMissionModeSchema = z.enum([
  "planned",
  "live",
  "replay",
  "paused",
  "completed",
  "scrubbed",
  "delayed",
])

const liveMissionStreamStatusSchema = z.enum([
  "unavailable",
  "scheduled",
  "live",
  "ended",
  "replay",
])

async function requireWritePermission(permissions: Parameters<typeof requireAdminPermission>[0]) {
  const user = await requireAdminPermission(permissions)
  await enforceAdminWriteRateLimit(user.id)
  return user
}

function booleanFromForm(value: FormDataEntryValue | null) {
  return value === "on" || value === "true"
}

function localizedFromForm(formData: FormData, enKey: string, ruKey: string): LocalizedText {
  return localizedSchema.parse({
    en: String(formData.get(enKey) ?? ""),
    ru: String(formData.get(ruKey) ?? ""),
  })
}

function revalidateAdmin(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path)
  }
}

export async function createLaunchAction(formData: FormData) {
  const user = await requireWritePermission(["edit_content"])
  const repository = getAdminRepository()
  const parsed = z
    .object({
      missionName: localizedSchema,
      slug: slugSchema,
      rocketName: z.string().min(2),
      launchPadName: z.string().min(2),
      launchDateTimeUtc: z.coerce.date(),
      status: z.enum([
        "draft",
        "scheduled",
        "confirmed",
        "live",
        "delayed",
        "scrubbed",
        "success",
        "failure",
        "partial_success",
      ]),
      confidenceLevel: confidenceSchema,
    })
    .parse({
      missionName: localizedFromForm(formData, "missionNameEn", "missionNameRu"),
      slug: formData.get("slug"),
      rocketName: formData.get("rocketName"),
      launchPadName: formData.get("launchPadName"),
      launchDateTimeUtc: formData.get("launchDateTimeUtc"),
      status: formData.get("status"),
      confidenceLevel: formData.get("confidenceLevel"),
    })

  await repository.createLaunch(parsed, user.id)
  revalidateAdmin(["/admin", "/admin/launches"])
}

export async function updateLaunchStatusAction(formData: FormData) {
  const user = await requireWritePermission(["edit_content"])
  const repository = getAdminRepository()
  const parsed = z
    .object({
      id: z.string().min(1),
      status: z.enum([
        "draft",
        "scheduled",
        "confirmed",
        "live",
        "delayed",
        "scrubbed",
        "success",
        "failure",
        "partial_success",
      ]),
    })
    .parse({
      id: formData.get("id"),
      status: formData.get("status"),
    })

  await repository.updateLaunchStatus(parsed.id, parsed.status, user.id)
  revalidateAdmin(["/admin", "/admin/launches"])
}

export async function updateLaunchAction(formData: FormData) {
  const user = await requireWritePermission(["edit_content"])
  const repository = getAdminRepository()
  const parsed = z
    .object({
      id: z.string().min(1),
      missionName: localizedSchema,
      slug: slugSchema,
      rocketName: z.string().min(2),
      launchPadName: z.string().min(2),
      launchPadLocation: localizedSchema,
      launchDateTimeUtc: validDateSchema,
      trajectory: localizedSchema,
      orbit: z.string().trim().optional(),
      payload: localizedSchema,
      missionDescription: localizedSchema,
      officialUrl: urlSchema,
      youtubeUrlOrVideoId: z.string().trim().optional(),
      confidenceLevel: confidenceSchema,
      status: launchStatusSchema,
      isFeatured: z.boolean(),
    })
    .parse({
      id: formData.get("id"),
      missionName: localizedFromForm(formData, "missionNameEn", "missionNameRu"),
      slug: formData.get("slug"),
      rocketName: formData.get("rocketName"),
      launchPadName: formData.get("launchPadName"),
      launchPadLocation: localizedFromForm(formData, "launchPadLocationEn", "launchPadLocationRu"),
      launchDateTimeUtc: formData.get("launchDateTimeUtc"),
      trajectory: localizedFromForm(formData, "trajectoryEn", "trajectoryRu"),
      orbit: String(formData.get("orbit") ?? "") || undefined,
      payload: localizedFromForm(formData, "payloadEn", "payloadRu"),
      missionDescription: localizedFromForm(formData, "missionDescriptionEn", "missionDescriptionRu"),
      officialUrl: String(formData.get("officialUrl") ?? ""),
      youtubeUrlOrVideoId: String(formData.get("youtubeUrlOrVideoId") ?? "") || undefined,
      confidenceLevel: formData.get("confidenceLevel"),
      status: formData.get("status"),
      isFeatured: booleanFromForm(formData.get("isFeatured")),
    })

  await repository.updateLaunch(parsed, user.id)
  revalidateAdmin(["/admin", "/admin/launches", `/admin/launches/${parsed.id}`])
}

export async function transitionApprovalAction(formData: FormData) {
  const status = publishableSchema.parse(formData.get("status"))
  const requiredPermission =
    status === "approved" || status === "published" || status === "archived"
      ? "approve"
      : "edit_content"
  const user = await requireWritePermission([requiredPermission])
  const repository = getAdminRepository()
  const entityId = z.string().min(1).parse(formData.get("entityId"))
  const comments = String(formData.get("comments") ?? "") || undefined

  await repository.transitionApproval(entityId, status, user.id, comments)
  revalidateAdmin(["/admin", "/admin/launches", "/admin/articles", "/admin/news", "/admin/faq"])
}

export async function createTimelineEventAction(formData: FormData) {
  const user = await requireWritePermission(["manage_timeline"])
  const repository = getAdminRepository()
  const parsed = z
    .object({
      launchId: z.string().min(1),
      type: z.enum([
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
      relativeTime: relativeTimeSchema,
      title: localizedSchema,
      description: localizedSchema,
      status: z.enum(["planned", "confirmed", "estimated", "skipped", "failed"]),
    })
    .parse({
      launchId: formData.get("launchId"),
      type: formData.get("type"),
      relativeTime: formData.get("relativeTime"),
      title: localizedFromForm(formData, "titleEn", "titleRu"),
      description: localizedFromForm(formData, "descriptionEn", "descriptionRu"),
      status: formData.get("status"),
    })

  await repository.createTimelineEvent(parsed, user.id)
  revalidateAdmin(["/admin/launches", `/admin/launches/${parsed.launchId}/timeline`])
}

export async function updateTimelineEventStatusAction(formData: FormData) {
  const user = await requireWritePermission(["manage_timeline"])
  const repository = getAdminRepository()
  const parsed = z
    .object({
      id: z.string().min(1),
      launchId: z.string().min(1),
      status: z.enum(["planned", "confirmed", "estimated", "skipped", "failed"]),
    })
    .parse({
      id: formData.get("id"),
      launchId: formData.get("launchId"),
      status: formData.get("status"),
    })

  await repository.updateTimelineEventStatus(parsed.id, parsed.status, user.id)
  revalidatePath(`/admin/launches/${parsed.launchId}/timeline`)
}

export async function deleteTimelineEventAction(formData: FormData) {
  const user = await requireWritePermission(["manage_timeline"])
  const repository = getAdminRepository()
  const id = z.string().min(1).parse(formData.get("id"))
  const launchId = z.string().min(1).parse(formData.get("launchId"))

  await repository.deleteTimelineEvent(id, user.id)
  revalidatePath(`/admin/launches/${launchId}/timeline`)
}

export async function updateTimelineEventAction(formData: FormData) {
  const user = await requireWritePermission(["manage_timeline"])
  const repository = getAdminRepository()
  const parsed = z
    .object({
      id: z.string().min(1),
      launchId: z.string().min(1),
      type: timelineTypeSchema,
      relativeTime: relativeTimeSchema,
      title: localizedSchema,
      description: localizedSchema,
      status: timelineStatusSchema,
      sortOrder: z.coerce.number().int().min(0),
    })
    .parse({
      id: formData.get("id"),
      launchId: formData.get("launchId"),
      type: formData.get("type"),
      relativeTime: formData.get("relativeTime"),
      title: localizedFromForm(formData, "titleEn", "titleRu"),
      description: localizedFromForm(formData, "descriptionEn", "descriptionRu"),
      status: formData.get("status"),
      sortOrder: formData.get("sortOrder"),
    })

  await repository.updateTimelineEvent(parsed, user.id)
  revalidatePath(`/admin/launches/${parsed.launchId}/timeline`)
}

export async function createArticleAction(formData: FormData) {
  const user = await requireWritePermission(["edit_content"])
  const repository = getAdminRepository()

  await repository.createArticle(
    {
      slug: slugSchema.parse(formData.get("slug")),
      title: localizedFromForm(formData, "titleEn", "titleRu"),
      body: localizedFromForm(formData, "bodyEn", "bodyRu"),
      category: z.string().min(2).parse(formData.get("category")),
    },
    user.id
  )
  revalidateAdmin(["/admin", "/admin/articles"])
}

export async function updateArticleStatusAction(formData: FormData) {
  const id = z.string().min(1).parse(formData.get("id"))
  const status = publishableSchema.parse(formData.get("status"))
  const user = await requireWritePermission([
    status === "approved" ||
    status === "published" ||
    status === "rejected" ||
    status === "archived"
      ? "approve"
      : "edit_content",
  ])
  const repository = getAdminRepository()
  await repository.updateArticleStatus(id, status, user.id)
  revalidateAdmin(["/admin", "/admin/articles"])
}

export async function updateArticleAction(formData: FormData) {
  const user = await requireWritePermission(["edit_content"])
  const repository = getAdminRepository()
  const parsed = z
    .object({
      id: z.string().min(1),
      slug: slugSchema,
      title: localizedSchema,
      body: localizedSchema,
      seoTitle: localizedSchema,
      metaDescription: localizedSchema,
      category: z.string().min(2),
    })
    .parse({
      id: formData.get("id"),
      slug: formData.get("slug"),
      title: localizedFromForm(formData, "titleEn", "titleRu"),
      body: localizedFromForm(formData, "bodyEn", "bodyRu"),
      seoTitle: localizedFromForm(formData, "seoTitleEn", "seoTitleRu"),
      metaDescription: localizedFromForm(formData, "metaDescriptionEn", "metaDescriptionRu"),
      category: formData.get("category"),
    })

  await repository.updateArticle(parsed, user.id)
  revalidateAdmin(["/admin", "/admin/articles", `/admin/articles/${parsed.id}`])
}

export async function createNewsAction(formData: FormData) {
  const user = await requireWritePermission(["edit_content"])
  const repository = getAdminRepository()

  await repository.createNews(
    {
      slug: slugSchema.parse(formData.get("slug")),
      title: localizedFromForm(formData, "titleEn", "titleRu"),
      summary: localizedFromForm(formData, "summaryEn", "summaryRu"),
      sourceName: z.string().min(2).parse(formData.get("sourceName")),
      sourceUrl: urlSchema.parse(String(formData.get("sourceUrl") ?? "")),
      publicationDate: z.coerce.date().parse(formData.get("publicationDate")),
      confidenceLevel: confidenceSchema.parse(formData.get("confidenceLevel")),
    },
    user.id
  )
  revalidateAdmin(["/admin", "/admin/news"])
}

export async function updateNewsStatusAction(formData: FormData) {
  const id = z.string().min(1).parse(formData.get("id"))
  const status = publishableSchema.parse(formData.get("status"))
  const user = await requireWritePermission([
    status === "approved" ||
    status === "published" ||
    status === "rejected" ||
    status === "archived"
      ? "approve"
      : "edit_content",
  ])
  const repository = getAdminRepository()
  await repository.updateNewsStatus(id, status, user.id)
  revalidateAdmin(["/admin", "/admin/news"])
}

export async function updateNewsAction(formData: FormData) {
  const user = await requireWritePermission(["edit_content"])
  const repository = getAdminRepository()
  const parsed = z
    .object({
      id: z.string().min(1),
      slug: slugSchema,
      title: localizedSchema,
      summary: localizedSchema,
      sourceName: z.string().min(2),
      sourceUrl: urlSchema,
      publicationDate: validDateSchema,
      confidenceLevel: confidenceSchema,
    })
    .parse({
      id: formData.get("id"),
      slug: formData.get("slug"),
      title: localizedFromForm(formData, "titleEn", "titleRu"),
      summary: localizedFromForm(formData, "summaryEn", "summaryRu"),
      sourceName: formData.get("sourceName"),
      sourceUrl: String(formData.get("sourceUrl") ?? ""),
      publicationDate: formData.get("publicationDate"),
      confidenceLevel: formData.get("confidenceLevel"),
    })

  await repository.updateNews(parsed, user.id)
  revalidateAdmin(["/admin", "/admin/news", `/admin/news/${parsed.id}`])
}

export async function createFAQAction(formData: FormData) {
  const user = await requireWritePermission(["edit_content"])
  const repository = getAdminRepository()

  await repository.createFAQ(
    {
      group: z
        .enum(["basics", "falcon9", "starship", "timeline", "livestreams", "accuracy", "reminders"])
        .parse(formData.get("group")),
      question: localizedFromForm(formData, "questionEn", "questionRu"),
      answer: localizedFromForm(formData, "answerEn", "answerRu"),
    },
    user.id
  )
  revalidateAdmin(["/admin", "/admin/faq"])
}

export async function updateFAQStatusAction(formData: FormData) {
  const id = z.string().min(1).parse(formData.get("id"))
  const status = publishableSchema.parse(formData.get("status"))
  const user = await requireWritePermission([
    status === "approved" ||
    status === "published" ||
    status === "rejected" ||
    status === "archived"
      ? "approve"
      : "edit_content",
  ])
  const repository = getAdminRepository()
  await repository.updateFAQStatus(id, status, user.id)
  revalidateAdmin(["/admin", "/admin/faq"])
}

export async function updateFAQAction(formData: FormData) {
  const user = await requireWritePermission(["edit_content"])
  const repository = getAdminRepository()
  const parsed = z
    .object({
      id: z.string().min(1),
      group: z.enum(["basics", "falcon9", "starship", "timeline", "livestreams", "accuracy", "reminders"]),
      question: localizedSchema,
      answer: localizedSchema,
      sortOrder: z.coerce.number().int().min(0),
    })
    .parse({
      id: formData.get("id"),
      group: formData.get("group"),
      question: localizedFromForm(formData, "questionEn", "questionRu"),
      answer: localizedFromForm(formData, "answerEn", "answerRu"),
      sortOrder: formData.get("sortOrder"),
    })

  await repository.updateFAQ(parsed, user.id)
  revalidateAdmin(["/admin", "/admin/faq", `/admin/faq/${parsed.id}`])
}

export async function createSourceAction(formData: FormData) {
  const user = await requireWritePermission(["manage_sources"])
  const repository = getAdminRepository()

  await repository.createSource(
    {
      publisher: z.string().min(2).parse(formData.get("publisher")),
      title: localizedFromForm(formData, "titleEn", "titleRu"),
      url: urlSchema.parse(String(formData.get("url") ?? "")),
      kind: z
        .enum([
          "official_spacex",
          "official_youtube",
          "nasa",
          "faa",
          "launch_library",
          "spaceflight_now",
          "nasaspaceflight",
          "next_spaceflight",
          "mock_dataset",
          "other",
        ])
        .parse(formData.get("kind")) as AdminSourceRecord["kind"],
      sourceType: z
        .enum(["official", "api", "secondary", "manual"])
        .parse(formData.get("sourceType")) as AdminSourceRecord["sourceType"],
      trustLevel: z
        .enum(["primary", "secondary", "low"])
        .parse(formData.get("trustLevel")) as AdminSourceRecord["trustLevel"],
      confidenceLevel: confidenceSchema.parse(formData.get("confidenceLevel")),
      notes: String(formData.get("notes") ?? "") || undefined,
    },
    user.id
  )
  revalidateAdmin(["/admin", "/admin/sources"])
}

export async function updateSourceTrustAction(formData: FormData) {
  const user = await requireWritePermission(["manage_sources"])
  const repository = getAdminRepository()
  const id = z.string().min(1).parse(formData.get("id"))
  const trustLevel = z.enum(["primary", "secondary", "low"]).parse(formData.get("trustLevel"))
  await repository.updateSourceTrust(id, trustLevel, user.id)
  revalidateAdmin(["/admin", "/admin/sources"])
}

export async function updateSourceAction(formData: FormData) {
  const user = await requireWritePermission(["manage_sources"])
  const repository = getAdminRepository()
  const parsed = z
    .object({
      id: z.string().min(1),
      publisher: z.string().min(2),
      title: localizedSchema,
      url: urlSchema,
      kind: z.enum([
        "official_spacex",
        "official_youtube",
        "nasa",
        "faa",
        "launch_library",
        "spaceflight_now",
        "nasaspaceflight",
        "next_spaceflight",
        "mock_dataset",
        "other",
      ]),
      sourceType: z.enum(["official", "api", "secondary", "manual"]),
      trustLevel: z.enum(["primary", "secondary", "low"]),
      confidenceLevel: confidenceSchema,
      notes: z.string().optional(),
    })
    .parse({
      id: formData.get("id"),
      publisher: formData.get("publisher"),
      title: localizedFromForm(formData, "titleEn", "titleRu"),
      url: String(formData.get("url") ?? ""),
      kind: formData.get("kind"),
      sourceType: formData.get("sourceType"),
      trustLevel: formData.get("trustLevel"),
      confidenceLevel: formData.get("confidenceLevel"),
      notes: String(formData.get("notes") ?? "") || undefined,
    })

  await repository.updateSource(parsed, user.id)
  revalidateAdmin(["/admin", "/admin/sources", `/admin/sources/${parsed.id}`])
}

export async function updateAIDraftStatusAction(formData: FormData) {
  const status = aiDraftStatusSchema.parse(formData.get("status"))
  const requiredPermission =
    status === "approved" || status === "rejected" || status === "merged" || status === "archived"
      ? "approve"
      : "generate_ai_drafts"
  const user = await requireWritePermission([requiredPermission])
  const repository = getAdminRepository()
  const id = z.string().min(1).parse(formData.get("id"))

  await repository.updateAIDraftStatus(id, status as AIDraft["status"], user.id)
  revalidateAdmin(["/admin", "/admin/ai-drafts", `/admin/ai-drafts/${id}`])
}

export async function mergeAIDraftAction(formData: FormData) {
  const user = await requireWritePermission(["approve"])
  const repository = getAdminRepository()
  const id = z.string().min(1).parse(formData.get("id"))
  await repository.mergeAIDraft(id, user.id)
  revalidateAdmin([
    "/admin",
    "/admin/ai-drafts",
    `/admin/ai-drafts/${id}`,
    "/admin/launches",
    "/admin/articles",
    "/admin/news",
    "/admin/faq",
  ])
}

export async function generateAIDraftAction(formData: FormData) {
  const user = await requireWritePermission(["generate_ai_drafts"])
  const parsed = z
    .object({
      task: aiDraftTypeSchema,
      relatedEntityType: aiRelatedEntitySchema,
      relatedEntityId: z.string().min(1),
      instruction: z.string().min(3),
      returnTo: z.string().optional(),
    })
    .parse({
      task: formData.get("task"),
      relatedEntityType: formData.get("relatedEntityType"),
      relatedEntityId: formData.get("relatedEntityId"),
      instruction: formData.get("instruction"),
      returnTo: String(formData.get("returnTo") ?? "") || undefined,
    })

  const draft = await generateAIDraft({
    task: parsed.task,
    instruction: parsed.instruction,
    relatedEntityType: parsed.relatedEntityType,
    relatedEntityId: parsed.relatedEntityId,
    actorId: user.id,
  })

  revalidateAdmin([
    "/admin",
    "/admin/ai-drafts",
    "id" in draft ? `/admin/ai-drafts/${draft.id}` : "/admin/ai-drafts",
    parsed.returnTo ?? "/admin/ai-drafts",
  ])
}

export async function createAdminUserAction(formData: FormData) {
  const user = await requireWritePermission(["manage_settings"])
  const repository = getAdminRepository()
  const parsed = z
    .object({
      name: z.string().min(2),
      email: z.string().email(),
      role: z.enum(["admin", "editor", "researcher"]),
      status: z.enum(["active", "disabled", "invited"]),
    })
    .parse({
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
      status: formData.get("status") ?? "invited",
    })

  await repository.createAdminUser(parsed, user.id)
  revalidateAdmin(["/admin/users"])
}

export async function updateAdminUserRoleAction(formData: FormData) {
  const user = await requireWritePermission(["manage_settings"])
  const repository = getAdminRepository()
  const parsed = z
    .object({
      id: z.string().min(1),
      role: z.enum(["admin", "editor", "researcher"]),
    })
    .parse({
      id: formData.get("id"),
      role: formData.get("role"),
    })

  await repository.updateAdminUserRole(parsed.id, parsed.role as AdminRole, user.id)
  revalidateAdmin(["/admin/users"])
}

export async function updateAdminUserStatusAction(formData: FormData) {
  const user = await requireWritePermission(["manage_settings"])
  const repository = getAdminRepository()
  const parsed = z
    .object({
      id: z.string().min(1),
      status: z.enum(["active", "disabled", "invited"]),
    })
    .parse({
      id: formData.get("id"),
      status: formData.get("status"),
    })

  await repository.updateAdminUserStatus(parsed.id, parsed.status, user.id)
  revalidateAdmin(["/admin/users"])
}

async function requireYouTubeDiscoveryRole() {
  const user = await requireAdminRole(["admin", "editor"])
  await enforceAdminWriteRateLimit(user.id)
  return user
}

async function requireYouTubeManualCandidateRole() {
  const user = await requireAdminRole(["admin", "editor", "researcher"])
  await enforceAdminWriteRateLimit(user.id)
  return user
}

async function requireYouTubeStatusRole(status: z.infer<typeof publishableSchema>) {
  if (["approved", "published", "rejected", "archived"].includes(status)) {
    return requireWritePermission(["approve"])
  }

  const user = await requireAdminRole(["admin", "editor"])
  await enforceAdminWriteRateLimit(user.id)
  return user
}

export async function runLaunchLibrarySyncAction(formData: FormData) {
  const user = await requireWritePermission(["manage_settings"])

  if (process.env.ENABLE_EXTERNAL_SYNC !== "true") {
    throw new Error("External sync is disabled. Set ENABLE_EXTERNAL_SYNC=true to run manual imports.")
  }

  const parsed = z
    .object({
      mode: z.enum(["upcoming", "past", "both"]),
    })
    .parse({
      mode: formData.get("mode") ?? "upcoming",
    })

  await runLaunchLibrarySync({
    mode: parsed.mode,
    requestedById: user.id,
    dryRun: false,
    limit: 25,
  })
  revalidateAdmin(["/admin/sync", "/admin/launches", "/admin/sources", "/admin/audit"])
}

export async function runYouTubeDiscoveryAction(formData: FormData) {
  const user = await requireYouTubeDiscoveryRole()

  if (process.env.ENABLE_YOUTUBE_SYNC !== "true") {
    throw new Error("YouTube discovery is disabled. Set ENABLE_YOUTUBE_SYNC=true to run discovery.")
  }

  const launchId = z.string().min(1).parse(formData.get("launchId"))
  await discoverAndStoreYouTubeVideos({ launchId, actorId: user.id })
  revalidateAdmin([
    "/admin/videos",
    `/admin/launches/${launchId}`,
    `/admin/launches/${launchId}/videos`,
    "/admin/audit",
  ])
}

export async function addManualYouTubeVideoAction(formData: FormData) {
  const user = await requireYouTubeManualCandidateRole()
  const parsed = z
    .object({
      launchId: z.string().min(1),
      url: z.string().min(8),
    })
    .parse({
      launchId: formData.get("launchId"),
      url: formData.get("url"),
    })

  await addManualYouTubeVideoCandidate({
    launchId: parsed.launchId,
    url: parsed.url,
    actorId: user.id,
  })
  revalidateAdmin([
    "/admin/videos",
    `/admin/launches/${parsed.launchId}`,
    `/admin/launches/${parsed.launchId}/videos`,
    "/admin/audit",
  ])
}

export async function updateVideoStatusAction(formData: FormData) {
  const parsed = z
    .object({
      id: z.string().min(1),
      launchId: z.string().min(1),
      status: publishableSchema,
    })
    .parse({
      id: formData.get("id"),
      launchId: formData.get("launchId"),
      status: formData.get("status"),
    })
  const user = await requireYouTubeStatusRole(parsed.status)

  await updateVideoRecordStatus({
    id: parsed.id,
    status: parsed.status,
    actorId: user.id,
  })
  revalidateAdmin([
    "/admin/videos",
    `/admin/launches/${parsed.launchId}`,
    `/admin/launches/${parsed.launchId}/videos`,
    "/admin/audit",
  ])
}

async function requireLiveControlRole() {
  if (!getSafeServerEnvStatus().liveMissionModeEnabled) {
    throw new Error("Live Mission Mode is disabled by environment configuration.")
  }

  const user = await requireAdminRole(["admin"])
  await enforceAdminWriteRateLimit(user.id)
  return user
}

function revalidateLiveMissionAdmin(launchId: string) {
  revalidateAdmin([
    "/admin",
    "/admin/live-control",
    `/admin/launches/${launchId}`,
    `/admin/launches/${launchId}/timeline`,
    "/admin/audit",
  ])
}

export async function initializeLiveMissionAction(formData: FormData) {
  const user = await requireLiveControlRole()
  const launchId = z.string().min(1).parse(formData.get("launchId"))

  await initializeLiveMissionState(launchId, user.id)
  revalidateLiveMissionAdmin(launchId)
}

export async function updateLiveMissionModeAction(formData: FormData) {
  const user = await requireLiveControlRole()
  const parsed = z
    .object({
      launchId: z.string().min(1),
      mode: liveMissionModeSchema,
    })
    .parse({
      launchId: formData.get("launchId"),
      mode: formData.get("mode"),
    })

  await updateLiveMissionMode(parsed.launchId, parsed.mode, user.id)
  revalidateLiveMissionAdmin(parsed.launchId)
}

export async function updateLiveMissionTimingAction(formData: FormData) {
  const user = await requireLiveControlRole()
  const parsed = z
    .object({
      launchId: z.string().min(1),
      countdownTargetUtc: validDateSchema,
      t0Utc: validDateSchema.optional(),
      internalNotes: z.string().trim().optional(),
    })
    .parse({
      launchId: formData.get("launchId"),
      countdownTargetUtc: formData.get("countdownTargetUtc"),
      t0Utc: String(formData.get("t0Utc") ?? "") || undefined,
      internalNotes: String(formData.get("internalNotes") ?? "") || undefined,
    })

  await updateLiveMissionTiming({
    launchId: parsed.launchId,
    countdownTargetUtc: parsed.countdownTargetUtc,
    t0Utc: parsed.t0Utc,
    internalNotes: parsed.internalNotes,
    actorId: user.id,
  })
  revalidateLiveMissionAdmin(parsed.launchId)
}

export async function updateLiveMissionStreamStatusAction(formData: FormData) {
  const user = await requireLiveControlRole()
  const parsed = z
    .object({
      launchId: z.string().min(1),
      streamStatus: liveMissionStreamStatusSchema,
    })
    .parse({
      launchId: formData.get("launchId"),
      streamStatus: formData.get("streamStatus"),
    })

  await updateLiveMissionStreamStatus(parsed.launchId, parsed.streamStatus, user.id)
  revalidateLiveMissionAdmin(parsed.launchId)
}

export async function updateLiveMissionBannerAction(formData: FormData) {
  const user = await requireLiveControlRole()
  const parsed = z
    .object({
      launchId: z.string().min(1),
      publicBannerEn: z.string().trim().optional(),
      publicBannerRu: z.string().trim().optional(),
    })
    .parse({
      launchId: formData.get("launchId"),
      publicBannerEn: String(formData.get("publicBannerEn") ?? "") || undefined,
      publicBannerRu: String(formData.get("publicBannerRu") ?? "") || undefined,
    })

  await updateLiveMissionBanner({ ...parsed, actorId: user.id })
  revalidateLiveMissionAdmin(parsed.launchId)
}

export async function clearLiveMissionBannerAction(formData: FormData) {
  const user = await requireLiveControlRole()
  const launchId = z.string().min(1).parse(formData.get("launchId"))

  await clearLiveMissionBanner(launchId, user.id)
  revalidateLiveMissionAdmin(launchId)
}

export async function setLiveMissionActiveEventAction(formData: FormData) {
  const user = await requireLiveControlRole()
  const parsed = z
    .object({
      launchId: z.string().min(1),
      timelineEventId: z.string().min(1),
    })
    .parse({
      launchId: formData.get("launchId"),
      timelineEventId: formData.get("timelineEventId"),
    })

  await setLiveMissionActiveEvent({ ...parsed, actorId: user.id })
  revalidateLiveMissionAdmin(parsed.launchId)
}

export async function updateLiveTimelineEventStatusAction(formData: FormData) {
  const user = await requireLiveControlRole()
  const parsed = z
    .object({
      launchId: z.string().min(1),
      timelineEventId: z.string().min(1),
      status: timelineStatusSchema,
      noteEn: z.string().trim().optional(),
      noteRu: z.string().trim().optional(),
    })
    .parse({
      launchId: formData.get("launchId"),
      timelineEventId: formData.get("timelineEventId"),
      status: formData.get("status"),
      noteEn: String(formData.get("noteEn") ?? "") || undefined,
      noteRu: String(formData.get("noteRu") ?? "") || undefined,
    })

  await updateLiveTimelineEventStatus({ ...parsed, actorId: user.id })
  revalidateLiveMissionAdmin(parsed.launchId)
}

export async function completeLiveMissionAction(formData: FormData) {
  const user = await requireLiveControlRole()
  const parsed = z
    .object({
      launchId: z.string().min(1),
      result: z.enum(["success", "failure", "partial_success"]),
    })
    .parse({
      launchId: formData.get("launchId"),
      result: formData.get("result"),
    })

  await completeLiveMission({ ...parsed, actorId: user.id })
  revalidateLiveMissionAdmin(parsed.launchId)
}

export type LaunchStatusForForm = AdminLaunchRecord["status"]
export type TimelineStatusForForm = AdminTimelineEvent["status"]
