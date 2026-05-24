import { NextResponse } from "next/server"

import { getCurrentAdminUser } from "@/lib/admin/auth"
import { roleCan } from "@/lib/admin/permissions"
import { getAdminRepository } from "@/lib/admin/repository"
import type { PublishableStatus } from "@/types/admin"

const allowedStatuses: PublishableStatus[] = [
  "draft",
  "in_review",
  "approved",
  "published",
  "rejected",
  "archived",
]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isPublishableStatus(value: unknown): value is PublishableStatus {
  return (
    typeof value === "string" &&
    allowedStatuses.includes(value as PublishableStatus)
  )
}

export async function POST(request: Request) {
  const user = await getCurrentAdminUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body: unknown = await request.json().catch(() => null)

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  if (typeof body.entityId !== "string" || body.entityId.length < 1) {
    return NextResponse.json({ error: "Missing entity id" }, { status: 400 })
  }

  if (!isPublishableStatus(body.status)) {
    return NextResponse.json({ error: "Invalid approval status" }, { status: 400 })
  }

  const privilegedTransition =
    body.status === "approved" ||
    body.status === "published" ||
    body.status === "rejected" ||
    body.status === "archived"

  if (privilegedTransition && !roleCan(user.role, "approve")) {
    return NextResponse.json({ error: "Approval permission required" }, { status: 403 })
  }

  if (body.status === "published" && !roleCan(user.role, "publish")) {
    return NextResponse.json({ error: "Publish permission required" }, { status: 403 })
  }

  const repository = getAdminRepository()
  const approval = await repository.transitionApproval(
    body.entityId,
    body.status,
    user.id,
    typeof body.comments === "string" ? body.comments : undefined
  )

  return NextResponse.json({
    approval,
    policy:
      "This MVP endpoint returns a transition preview. Persist transitions in production.",
  })
}
