import type { DataConfidenceLevel } from "@/types/space"

export function isRiskyConfidence(confidence: DataConfidenceLevel): boolean {
  return confidence === "estimated" || confidence === "unverified" || confidence === "conflicting"
}

export function getConfidenceTone(confidence: DataConfidenceLevel) {
  if (confidence === "official_confirmed" || confidence === "admin_verified") {
    return "success"
  }
  if (confidence === "multi_source_confirmed") {
    return "info"
  }
  if (confidence === "estimated") {
    return "warning"
  }
  return "danger"
}
