import type { AIContext, GenerateAIDraftRequest } from "@/lib/server/ai/types"

function trimmedJson(value: unknown) {
  const json = JSON.stringify(value, null, 2)
  return json.length > 18_000 ? `${json.slice(0, 18_000)}\n...[truncated]` : json
}

export function buildAIDraftUserPrompt(request: GenerateAIDraftRequest, context: AIContext) {
  return [
    `Task: ${request.task}`,
    `Instruction: ${request.instruction}`,
    `Related entity type: ${context.relatedEntityType}`,
    `Related entity id: ${context.relatedEntityId}`,
    "Return schema-valid JSON. Do not include markdown.",
    "",
    "Structured database context:",
    trimmedJson(context.structuredInput),
    "",
    "Source records available for citations and uncertainty analysis:",
    trimmedJson(
      context.sources.map((source) => ({
        id: source.id,
        publisher: source.publisher,
        title: source.title,
        url: source.url,
        sourceType: source.sourceType,
        trustLevel: source.trustLevel,
        confidenceLevel: source.confidenceLevel,
        notes: source.notes,
      }))
    ),
  ].join("\n")
}
