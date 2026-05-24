import { headers } from "next/headers"
import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db"
import { checkRateLimit, RateLimitError } from "@/lib/rate-limit"

function normalizeKey(value: string) {
  return value.trim().toLowerCase() || "unknown"
}

async function requestIdentity() {
  const headerList = await headers()
  const forwardedFor = headerList.get("x-forwarded-for")?.split(",")[0]?.trim()

  return {
    ip: forwardedFor ?? headerList.get("x-real-ip") ?? "local",
    userAgent: headerList.get("user-agent") ?? undefined,
  }
}

async function writeRateLimitAudit(input: {
  actorId?: string
  entityId: string
  reason: string
  metadata: Record<string, unknown>
}) {
  const { ip, userAgent } = await requestIdentity()

  await prisma.auditLog
    .create({
      data: {
        actorId: input.actorId,
        action: "RATE_LIMIT",
        entityType: "ADMIN_USER",
        entityId: input.entityId,
        reason: input.reason,
        metadata: input.metadata as Prisma.InputJsonValue,
        ipAddress: ip,
        userAgent,
      },
    })
    .catch(() => undefined)
}

export async function enforceLoginRateLimit(email: string) {
  const { ip } = await requestIdentity()
  const key = `admin-login:${normalizeKey(ip)}:${normalizeKey(email)}`
  const result = checkRateLimit({ key, limit: 5, windowMs: 15 * 60 * 1000 })

  if (!result.allowed) {
    await writeRateLimitAudit({
      entityId: normalizeKey(email),
      reason: "Admin login rate limit exceeded.",
      metadata: { scope: "admin_login", email: normalizeKey(email), resetAt: result.resetAt.toISOString() },
    })
    throw new RateLimitError(
      "Too many login attempts. Wait a few minutes and try again.",
      result.resetAt
    )
  }
}

export async function enforceAdminWriteRateLimit(userId: string) {
  const key = `admin-write:${normalizeKey(userId)}`
  const result = checkRateLimit({ key, limit: 80, windowMs: 10 * 60 * 1000 })

  if (!result.allowed) {
    await writeRateLimitAudit({
      actorId: userId,
      entityId: userId,
      reason: "Admin write action rate limit exceeded.",
      metadata: { scope: "admin_write", resetAt: result.resetAt.toISOString() },
    })
    throw new RateLimitError(
      "Too many admin changes in a short period. Please pause briefly and try again.",
      result.resetAt
    )
  }
}
