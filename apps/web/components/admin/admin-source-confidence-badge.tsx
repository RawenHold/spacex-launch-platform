import type { ComponentProps } from "react"

import { Badge } from "@/components/ui/badge"
import type { AdminTrustLevel } from "@/types/admin"
import type { DataConfidenceLevel } from "@/types/space"

const confidenceVariant: Record<
  DataConfidenceLevel,
  ComponentProps<typeof Badge>["variant"]
> = {
  official_confirmed: "success",
  admin_verified: "info",
  multi_source_confirmed: "success",
  estimated: "warning",
  unverified: "outline",
  conflicting: "danger",
}

const trustVariant: Record<AdminTrustLevel, ComponentProps<typeof Badge>["variant"]> = {
  primary: "success",
  secondary: "info",
  low: "warning",
}

export function AdminSourceConfidenceBadge({
  confidenceLevel,
  trustLevel,
}: {
  confidenceLevel?: DataConfidenceLevel
  trustLevel?: AdminTrustLevel
}) {
  if (trustLevel) {
    return <Badge variant={trustVariant[trustLevel]}>{trustLevel}</Badge>
  }

  if (confidenceLevel) {
    return (
      <Badge variant={confidenceVariant[confidenceLevel]}>
        {confidenceLevel.replaceAll("_", " ")}
      </Badge>
    )
  }

  return <Badge variant="outline">unknown</Badge>
}
