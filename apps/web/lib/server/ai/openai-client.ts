import type { OpenAIStructuredRequest } from "@/lib/server/ai/types"

interface OpenAIResponsePayload {
  output_text?: string
  output?: Array<{
    content?: Array<{
      type?: string
      text?: string
      refusal?: string
    }>
  }>
  error?: {
    message?: string
  }
}

export function openAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY)
}

export function openAIModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini"
}

function extractResponseText(payload: OpenAIResponsePayload) {
  if (payload.output_text) return payload.output_text

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.refusal) {
        throw new Error(`OpenAI refused the request: ${content.refusal}`)
      }
      if (content.text) return content.text
    }
  }

  throw new Error("OpenAI response did not include output text.")
}

export async function createStructuredOpenAIResponse(input: OpenAIStructuredRequest) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.")
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: input.model,
      input: [
        { role: "system", content: input.systemPrompt },
        { role: "user", content: input.userPrompt },
      ],
      text: {
        format: {
          type: "json_schema",
          name: input.schemaName,
          schema: input.jsonSchema,
          strict: true,
        },
      },
      max_output_tokens: 2200,
    }),
  })

  const payload = (await response.json().catch(() => ({}))) as OpenAIResponsePayload

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `OpenAI request failed with ${response.status}.`)
  }

  const text = extractResponseText(payload)
  return JSON.parse(text) as unknown
}
