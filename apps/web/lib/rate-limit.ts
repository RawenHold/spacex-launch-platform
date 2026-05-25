import { getServerEnv } from "@/lib/server/env"

export class RateLimitError extends Error {
  resetAt: Date

  constructor(message: string, resetAt: Date) {
    super(message)
    this.name = "RateLimitError"
    this.resetAt = resetAt
  }
}

export interface RateLimitInput {
  key: string
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  adapter: "memory" | "redis" | "database"
}

interface RateLimitAdapter {
  name: RateLimitResult["adapter"]
  check(input: RateLimitInput): Promise<RateLimitResult>
}

class MemoryRateLimitAdapter implements RateLimitAdapter {
  name = "memory" as const
  private buckets = new Map<string, { count: number; resetAt: number }>()

  async check({ key, limit, windowMs }: RateLimitInput): Promise<RateLimitResult> {
    const now = Date.now()
    const current = this.buckets.get(key)

    if (!current || current.resetAt <= now) {
      const resetAt = now + windowMs
      this.buckets.set(key, { count: 1, resetAt })
      return { allowed: true, remaining: limit - 1, resetAt: new Date(resetAt), adapter: this.name }
    }

    if (current.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(current.resetAt),
        adapter: this.name,
      }
    }

    current.count += 1
    this.buckets.set(key, current)

    return {
      allowed: true,
      remaining: Math.max(0, limit - current.count),
      resetAt: new Date(current.resetAt),
      adapter: this.name,
    }
  }
}

class PlaceholderCentralRateLimitAdapter implements RateLimitAdapter {
  constructor(
    readonly name: "redis" | "database",
    private readonly fallback: MemoryRateLimitAdapter
  ) {}

  async check(input: RateLimitInput): Promise<RateLimitResult> {
    const result = await this.fallback.check(input)
    return { ...result, adapter: this.name }
  }
}

const memoryAdapter = new MemoryRateLimitAdapter()

function createAdapter(): RateLimitAdapter {
  const env = getServerEnv()

  if (env.RATE_LIMIT_ADAPTER === "redis" || env.RATE_LIMIT_ADAPTER === "database") {
    return new PlaceholderCentralRateLimitAdapter(env.RATE_LIMIT_ADAPTER, memoryAdapter)
  }

  return memoryAdapter
}

const adapter = createAdapter()

export async function checkRateLimit(input: RateLimitInput) {
  return adapter.check(input)
}

export function getRateLimitAdapterName() {
  return adapter.name
}
