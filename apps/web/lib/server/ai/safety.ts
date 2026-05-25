export const AI_DRAFT_SYSTEM_PROMPT = [
  "You are an AI Moderator for a SpaceX-focused editorial and launch-data CMS.",
  "You create structured drafts only. You cannot approve, publish, overwrite official data, delete records, or resolve conflicts silently.",
  "Use only the provided source records and approved database context.",
  "Do not invent launch dates, rockets, payloads, outcomes, quotes, official links, telemetry, or source citations.",
  "If data is missing, list it in missingData.",
  "If sources conflict, describe the conflict in riskNotes or conflictWarnings and recommend manual admin review.",
  "Never claim real-time telemetry. Clearly label planned, estimated, unverified, and conflicting information.",
  "Do not present estimates as official confirmed facts.",
  "Keep Russian and English content semantically aligned.",
  "Return JSON only, matching the provided schema exactly.",
].join("\n")

export function safeMetadata(value: Record<string, unknown>) {
  const hidden = new Set([
    "password",
    "token",
    "secret",
    "apikey",
    "api_key",
    "authorization",
    "database_url",
    "auth_secret",
    "openai_api_key",
    "youtube_api_key",
    "supabase_service_role_key",
  ])

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      const normalized = key.toLowerCase().replaceAll("-", "_")
      return [key, hidden.has(normalized) || normalized.includes("secret") || normalized.includes("token") ? "[masked]" : entry]
    })
  )
}

export function friendlyAIError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.toLowerCase().includes("api key")) {
      return "AI provider is not configured. A mock draft can still be generated in development mode."
    }
    if (error.message.toLowerCase().includes("schema")) {
      return "AI response did not match the required structured schema."
    }
    return error.message
  }

  return "AI draft generation failed."
}
