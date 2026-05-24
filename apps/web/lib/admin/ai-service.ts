import { getAdminRepository, type CreateAIDraftInput } from "@/lib/admin/repository"
import type { AdminSourceRecord, AIDraft, AIDraftType } from "@/types/admin"
import type { LocalizedText } from "@/types/space"

export interface GenerateAIDraftRequest {
  task: AIDraftType
  instruction: string
  relatedEntityType: AIDraft["relatedEntityType"]
  relatedEntityId: string
  structuredInput: Record<string, unknown>
  sources: AdminSourceRecord[]
}

function localized(value: string): LocalizedText {
  return {
    en: value,
    ru: value,
  }
}

function buildMockDraftInput(request: GenerateAIDraftRequest): CreateAIDraftInput {
  const sourceSummary =
    request.sources.length > 0
      ? request.sources.map((source) => source.publisher).join(", ")
      : "No source records provided"

  const apiMode = Boolean(process.env.OPENAI_API_KEY)
    ? "OPENAI_API_KEY is configured, but MVP keeps generation behind a service boundary."
    : "OPENAI_API_KEY is not configured, so this is a deterministic mock draft."

  return {
    type: request.task,
    relatedEntityType: request.relatedEntityType,
    relatedEntityId: request.relatedEntityId,
    title: localized(`AI draft: ${request.task.replaceAll("_", " ")}`),
    content: localized(
      [
        apiMode,
        `Task instruction: ${request.instruction}`,
        `Structured input keys: ${Object.keys(request.structuredInput).join(", ") || "none"}`,
        `Cited sources: ${sourceSummary}.`,
        "This draft cannot publish itself, overwrite official data, or resolve conflicts without a human reviewer.",
      ].join("\n")
    ),
    citations: request.sources,
    confidenceNotes: localized(
      "Draft confidence is limited to the provided source records. Missing primary sources must remain visible."
    ),
    riskNotes: localized(
      "Review for uncited factual claims, source conflicts, launch-date precision, and telemetry wording before merge."
    ),
  }
}

export async function generateAIDraft(
  request: GenerateAIDraftRequest
): Promise<AIDraft> {
  // Server-only service boundary. Do not import this module from client components.
  // TODO(ai): Add an OpenAI provider implementation here once prompts, rate limits,
  // audit logging, and production auth are wired.
  const repository = getAdminRepository()
  return repository.createAIDraft(buildMockDraftInput(request))
}
