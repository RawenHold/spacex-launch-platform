import { redirect } from "next/navigation"

import { adminUsers } from "@/data/admin-mock-data"
import { roleCanAny } from "@/lib/admin/permissions"
import type { AdminPermission, AdminRole, AdminUser } from "@/types/admin"

const mockAdmin = adminUsers.find((user) => user.role === "admin")

export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  // TODO(production-auth): Replace this local dev guard with Auth.js/NextAuth,
  // Supabase Auth, or another provider before exposing /admin outside localhost.
  if (process.env.ADMIN_MOCK_DISABLED === "1") {
    return null
  }

  return mockAdmin ?? null
}

export async function requireAdminUser(): Promise<AdminUser> {
  const user = await getCurrentAdminUser()

  if (!user) {
    redirect("/")
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
