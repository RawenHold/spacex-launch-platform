import { NextResponse } from "next/server"

import { getCurrentAdminUser } from "@/lib/admin/auth"
import { generateAIDraft } from "@/lib/admin/ai-service"
import { roleCan } from "@/lib/admin/permissions"
import type { AdminSourceRecord, AIDraft, AIDraftType } from "@/types/admin"

const allowedDraftTypes: AIDraftType[] = [
  "launch_summary",
  "article",
  "news_summary",
  "faq",
  "seo",
  "timeline_suggestion",
  "source_comparison",
]

const relatedEntityTypes: AIDraft["relatedEntityType"][] = [
  "launch",
  "article",
  "news",
  "source",
  "faq",
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isDraftType(value: unknown): value is AIDraftType {
  return typeof value === "string" && allowedDraftTypes.includes(value as AIDraftType)
}

function isRelatedEntityType(value: unknown): value is AIDraft["relatedEntityType"] {
  return (
    typeof value === "string" &&
    relatedEntityTypes.includes(value as AIDraft["relatedEntityType"])
  )
}

export async function POST(request: Request) {
  const user = await getCurrentAdminUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!roleCan(user.role, "generate_ai_drafts")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body: unknown = await request.json().catch(() => null)

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  if (!isDraftType(body.task)) {
    return NextResponse.json({ error: "Invalid AI draft task" }, { status: 400 })
  }

  if (!isRelatedEntityType(body.relatedEntityType)) {
    return NextResponse.json({ error: "Invalid related entity type" }, { status: 400 })
  }

  if (typeof body.relatedEntityId !== "string" || body.relatedEntityId.length < 1) {
    return NextResponse.json({ error: "Missing related entity id" }, { status: 400 })
  }

  const draft = await generateAIDraft({
    task: body.task,
    instruction:
      typeof body.instruction === "string"
        ? body.instruction
        : "Generate a review-only admin draft.",
    relatedEntityType: body.relatedEntityType,
    relatedEntityId: body.relatedEntityId,
    structuredInput: isRecord(body.structuredInput) ? body.structuredInput : {},
    sources: Array.isArray(body.sources) ? (body.sources as AdminSourceRecord[]) : [],
  })

  return NextResponse.json({
    draft,
    policy:
      "AI Moderator can create drafts only. Human approval is required before merge or publish.",
  })
}
