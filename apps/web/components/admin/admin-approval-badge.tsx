import type { ComponentProps } from "react"

import { Badge } from "@/components/ui/badge"
import type { PublishableStatus } from "@/types/admin"

const approvalVariant: Record<
  PublishableStatus,
  ComponentProps<typeof Badge>["variant"]
> = {
  draft: "outline",
  in_review: "warning",
  approved: "info",
  published: "success",
  archived: "secondary",
}

export function AdminApprovalBadge({ status }: { status: PublishableStatus }) {
  return <Badge variant={approvalVariant[status]}>{status.replaceAll("_", " ")}</Badge>
}
