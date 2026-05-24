import { Badge } from "@/components/ui/badge"
import type { LaunchStatus } from "@/types/space"

export function StatusBadge({
  status,
  label,
}: {
  status: LaunchStatus
  label: string
}) {
  const variant =
    status === "success" || status === "go"
      ? "success"
      : status === "hold" || status === "tbd" || status === "scrubbed"
        ? "warning"
        : status === "failure" || status === "partial_failure"
          ? "danger"
          : "secondary"

  return <Badge variant={variant}>{label}</Badge>
}
