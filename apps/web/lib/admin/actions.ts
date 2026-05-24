"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireAdminPermission } from "@/lib/admin/auth"
import { getAdminRepository } from "@/lib/admin/repository"
import type {
  AdminLaunchRecord,
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
  const user = await requireAdminPermission(["edit_content"])
  const repository = getAdminRepository()
  const parsed = z
    .object({
      missionName: localizedSchema,
      slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
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
  const user = await requireAdminPermission(["edit_content"])
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

export async function transitionApprovalAction(formData: FormData) {
  const status = publishableSchema.parse(formData.get("status"))
  const requiredPermission =
    status === "approved" || status === "published" || status === "archived"
      ? "approve"
      : "edit_content"
  const user = await requireAdminPermission([requiredPermission])
  const repository = getAdminRepository()
  const entityId = z.string().min(1).parse(formData.get("entityId"))
  const comments = String(formData.get("comments") ?? "") || undefined

  await repository.transitionApproval(entityId, status, user.id, comments)
  revalidateAdmin(["/admin", "/admin/launches", "/admin/articles", "/admin/news", "/admin/faq"])
}

export async function createTimelineEventAction(formData: FormData) {
  const user = await requireAdminPermission(["manage_timeline"])
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
      relativeTime: z.string().min(2),
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
  const user = await requireAdminPermission(["manage_timeline"])
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
  const user = await requireAdminPermission(["manage_timeline"])
  const repository = getAdminRepository()
  const id = z.string().min(1).parse(formData.get("id"))
  const launchId = z.string().min(1).parse(formData.get("launchId"))

  await repository.deleteTimelineEvent(id, user.id)
  revalidatePath(`/admin/launches/${launchId}/timeline`)
}

export async function createArticleAction(formData: FormData) {
  const user = await requireAdminPermission(["edit_content"])
  const repository = getAdminRepository()

  await repository.createArticle(
    {
      slug: z.string().min(3).regex(/^[a-z0-9-]+$/).parse(formData.get("slug")),
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
  const user = await requireAdminPermission([
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

export async function createNewsAction(formData: FormData) {
  const user = await requireAdminPermission(["edit_content"])
  const repository = getAdminRepository()

  await repository.createNews(
    {
      slug: z.string().min(3).regex(/^[a-z0-9-]+$/).parse(formData.get("slug")),
      title: localizedFromForm(formData, "titleEn", "titleRu"),
      summary: localizedFromForm(formData, "summaryEn", "summaryRu"),
      sourceName: z.string().min(2).parse(formData.get("sourceName")),
      sourceUrl: String(formData.get("sourceUrl") ?? "") || undefined,
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
  const user = await requireAdminPermission([
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

export async function createFAQAction(formData: FormData) {
  const user = await requireAdminPermission(["edit_content"])
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
  const user = await requireAdminPermission([
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

export async function createSourceAction(formData: FormData) {
  const user = await requireAdminPermission(["manage_sources"])
  const repository = getAdminRepository()

  await repository.createSource(
    {
      publisher: z.string().min(2).parse(formData.get("publisher")),
      title: localizedFromForm(formData, "titleEn", "titleRu"),
      url: String(formData.get("url") ?? "") || undefined,
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
  const user = await requireAdminPermission(["manage_sources"])
  const repository = getAdminRepository()
  const id = z.string().min(1).parse(formData.get("id"))
  const trustLevel = z.enum(["primary", "secondary", "low"]).parse(formData.get("trustLevel"))
  await repository.updateSourceTrust(id, trustLevel, user.id)
  revalidateAdmin(["/admin", "/admin/sources"])
}

export async function updateAIDraftStatusAction(formData: FormData) {
  const status = z
    .enum(["generated", "needs_review", "approved", "rejected", "merged"])
    .parse(formData.get("status"))
  const requiredPermission =
    status === "approved" || status === "rejected" || status === "merged"
      ? "approve"
      : "generate_ai_drafts"
  const user = await requireAdminPermission([requiredPermission])
  const repository = getAdminRepository()
  const id = z.string().min(1).parse(formData.get("id"))

  await repository.updateAIDraftStatus(id, status as AIDraft["status"], user.id)
  revalidateAdmin(["/admin", "/admin/ai-drafts"])
}

export type LaunchStatusForForm = AdminLaunchRecord["status"]
export type TimelineStatusForForm = AdminTimelineEvent["status"]
