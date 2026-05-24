const sensitiveKeyFragments = [
  "password",
  "token",
  "secret",
  "apikey",
  "api_key",
  "database_url",
  "auth_secret",
  "openai_api_key",
  "youtube_api_key",
  "supabase_service_role_key",
]

function isSensitiveKey(key: string) {
  const normalized = key.toLowerCase()
  return sensitiveKeyFragments.some((fragment) => normalized.includes(fragment))
}

export function maskSensitiveJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(maskSensitiveJson)
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        isSensitiveKey(key) ? "[masked]" : maskSensitiveJson(entry),
      ])
    )
  }

  return value
}

export function stringifySafeJson(value: unknown) {
  return JSON.stringify(maskSensitiveJson(value), null, 2)
}
