import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { roleCanAny } from "@/lib/admin/permissions"
import type { AdminPermission, AdminRole, AdminUser } from "@/types/admin"

export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  const session = await auth()

  if (!session?.user?.id || !session.user.role) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email ?? undefined,
    name: session.user.name ?? "Admin user",
    role: session.user.role,
    permissions: session.user.permissions ?? [],
    isHuman: session.user.role !== "ai_moderator",
  }
}

export async function requireAdminUser(): Promise<AdminUser> {
  const user = await getCurrentAdminUser()

  if (!user) {
    redirect("/admin/login")
  }

  return user
}

export async function requireAdminRole(roles: AdminRole[]): Promise<AdminUser> {
  const user = await requireAdminUser()

  if (!roles.includes(user.role)) {
    redirect("/admin")
  }

  return user
}

export async function requireAdminPermission(
  permissions: AdminPermission[]
): Promise<AdminUser> {
  const user = await requireAdminUser()

  if (!roleCanAny(user.role, permissions)) {
    redirect("/admin")
  }

  return user
}
