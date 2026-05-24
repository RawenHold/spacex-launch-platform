import { Badge } from "@/components/ui/badge"
import { getConfidenceTone } from "@/lib/source-confidence"
import type { DataConfidenceLevel } from "@/types/space"

export function ConfidenceBadge({
  confidence,
  label,
}: {
  confidence: DataConfidenceLevel
  label: string
}) {
  return <Badge variant={getConfidenceTone(confidence)}>{label}</Badge>
}
