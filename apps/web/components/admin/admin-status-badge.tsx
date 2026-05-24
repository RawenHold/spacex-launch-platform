import { Badge } from "@/components/ui/badge"
import type { AdminLaunchStatus } from "@/types/admin"
import type { ComponentProps } from "react"

const statusVariant: Record<AdminLaunchStatus, ComponentProps<typeof Badge>["variant"]> = {
  draft: "outline",
  scheduled: "info",
  confirmed: "success",
  live: "danger",
  delayed: "warning",
  scrubbed: "warning",
  success: "success",
  failure: "danger",
  partial_success: "warning",
}

export function AdminStatusBadge({ status }: { status: AdminLaunchStatus }) {
  return <Badge variant={statusVariant[status]}>{status.replaceAll("_", " ")}</Badge>
}
