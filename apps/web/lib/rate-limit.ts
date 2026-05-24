export class RateLimitError extends Error {
  resetAt: Date

  constructor(message: string, resetAt: Date) {
    super(message)
    this.name = "RateLimitError"
    this.resetAt = resetAt
  }
}

const buckets = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string
  limit: number
  windowMs: number
}) {
  const now = Date.now()
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs
    buckets.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: limit - 1, resetAt: new Date(resetAt) }
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(current.resetAt),
    }
  }

  current.count += 1
  buckets.set(key, current)

  return {
    allowed: true,
    remaining: Math.max(0, limit - current.count),
    resetAt: new Date(current.resetAt),
  }
}
