import type { AdminSourceRecord, AIDraft, AIDraftType } from "@/types/admin"

export const AI_PROMPT_VERSION = "ai-drafts-v1"

export type AIDraftProvider = "openai" | "mock"

export interface GenerateAIDraftRequest {
  task: AIDraftType
  instruction: string
  relatedEntityType: AIDraft["relatedEntityType"]
  relatedEntityId: string
  structuredInput?: Record<string, unknown>
  sources?: AdminSourceRecord[]
  actorId?: string
  dryRun?: boolean
}

export interface AIContext {
  relatedEntityType: AIDraft["relatedEntityType"]
  relatedEntityId: string
  structuredInput: Record<string, unknown>
  sources: AdminSourceRecord[]
}

export interface AIRuntimeConfig {
  enabled: boolean
  apiConfigured: boolean
  realApiAvailable: boolean
  provider: AIDraftProvider
  model: string
  promptVersion: string
}

export interface OpenAIStructuredRequest {
  model: string
  schemaName: string
  jsonSchema: Record<string, unknown>
  systemPrompt: string
  userPrompt: string
}
