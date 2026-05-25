import { z } from "zod"

const optionalString = z.string().trim().optional()
const booleanString = z
  .enum(["true", "false", ""])
  .optional()
  .transform((value) => value === "true")

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: optionalString,
  DIRECT_URL: optionalString,
  AUTH_SECRET: optionalString,
  AUTH_TRUST_HOST: booleanString,
  ADMIN_EMAIL: optionalString,
  NEXT_PUBLIC_SITE_URL: optionalString,
  OPENAI_API_KEY: optionalString,
  OPENAI_MODEL: optionalString.default("gpt-4.1-mini"),
  ENABLE_AI_DRAFTS: booleanString,
  YOUTUBE_API_KEY: optionalString,
  YOUTUBE_SPACEX_CHANNEL_ID: optionalString,
  ENABLE_YOUTUBE_SYNC: booleanString,
  LAUNCH_LIBRARY_BASE_URL: optionalString.default("https://ll.thespacedevs.com/2.3.0"),
  LAUNCH_LIBRARY_API_KEY: optionalString,
  ENABLE_EXTERNAL_SYNC: booleanString,
  ENABLE_MOCK_FALLBACK: booleanString,
  ENABLE_LIVE_MISSION_MODE: booleanString,
  RATE_LIMIT_ADAPTER: z.enum(["memory", "redis", "database"]).optional().default("memory"),
  UPSTASH_REDIS_REST_URL: optionalString,
  UPSTASH_REDIS_REST_TOKEN: optionalString,
})

export type ServerEnv = z.infer<typeof envSchema>

let cachedEnv: ServerEnv | undefined

function requireProductionEnv(env: ServerEnv) {
  if (env.NODE_ENV !== "production") return

  const missing: string[] = []
  if (!env.DATABASE_URL) missing.push("DATABASE_URL")
  if (!env.AUTH_SECRET) missing.push("AUTH_SECRET")

  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(", ")}`)
  }
}

export function validateServerEnv() {
  if (cachedEnv) return cachedEnv

  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    throw new Error(`Invalid server environment: ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}`)
  }

  requireProductionEnv(parsed.data)
  cachedEnv = parsed.data
  return cachedEnv
}

export function getServerEnv() {
  return validateServerEnv()
}

export function getSafeServerEnvStatus() {
  const env = validateServerEnv()

  return {
    nodeEnv: env.NODE_ENV,
    databaseConfigured: Boolean(env.DATABASE_URL),
    directUrlConfigured: Boolean(env.DIRECT_URL),
    authSecretConfigured: Boolean(env.AUTH_SECRET),
    adminBootstrapConfigured: Boolean(env.ADMIN_EMAIL),
    siteUrlConfigured: Boolean(env.NEXT_PUBLIC_SITE_URL),
    externalSyncEnabled: Boolean(env.ENABLE_EXTERNAL_SYNC),
    launchLibraryApiConfigured: Boolean(env.LAUNCH_LIBRARY_API_KEY),
    youtubeSyncEnabled: Boolean(env.ENABLE_YOUTUBE_SYNC),
    youtubeDataApiConfigured: Boolean(env.YOUTUBE_API_KEY),
    youtubeChannelConfigured: Boolean(env.YOUTUBE_SPACEX_CHANNEL_ID),
    aiDraftsEnabled: Boolean(env.ENABLE_AI_DRAFTS),
    openAiConfigured: Boolean(env.OPENAI_API_KEY),
    liveMissionModeEnabled: env.ENABLE_LIVE_MISSION_MODE !== false,
    mockFallbackEnabled: env.NODE_ENV !== "production" && env.ENABLE_MOCK_FALLBACK !== false,
    rateLimitAdapter: env.RATE_LIMIT_ADAPTER,
    centralizedRateLimitConfigured: false,
  } as const
}

export const serverEnv = validateServerEnv()
