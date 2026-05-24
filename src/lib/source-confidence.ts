import type { DataConfidenceLevel } from "../types/spacex"

export const confidenceLabels: Record<DataConfidenceLevel, string> = {
  official_confirmed: "Official confirmed",
  admin_verified: "Admin verified",
  multi_source_confirmed: "Multi-source confirmed",
  estimated: "Estimated",
  unverified: "Unverified",
  conflicting: "Conflicting data",
}

export const publicConfidenceRank: Record<DataConfidenceLevel, number> = {
  official_confirmed: 100,
  admin_verified: 90,
  multi_source_confirmed: 80,
  estimated: 50,
  unverified: 25,
  conflicting: 0,
}

export function isPublishRisk(confidence: DataConfidenceLevel): boolean {
  return confidence === "unverified" || confidence === "conflicting"
}

export function requiresPublicQualifier(
  confidence: DataConfidenceLevel
): boolean {
  return confidence === "estimated" || isPublishRisk(confidence)
}
