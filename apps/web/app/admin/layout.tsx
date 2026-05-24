import type { Metadata } from "next"
import type { ReactNode } from "react"

import { AdminShell } from "@/components/admin/admin-shell"
import { requireAdminRole } from "@/lib/admin/auth"

export const metadata: Metadata = {
  title: "Admin | SpaceX Mission Ops",
  description:
    "Secure MVP admin architecture for launch data, source review, AI drafts, and approvals.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdminRole(["admin", "editor", "researcher"])

  return <AdminShell user={user}>{children}</AdminShell>
}
