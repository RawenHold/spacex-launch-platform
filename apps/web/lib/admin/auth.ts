import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { roleCanAny } from "@/lib/admin/permissions"
import { rolePermissions } from "@/lib/admin/permissions"
import { adminUserFromDb } from "@/lib/admin/prisma-mappers"
import { prisma } from "@/lib/db"
import type { AdminPermission, AdminRole, AdminUser } from "@/types/admin"

export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  const session = await auth()

  if (!session?.user?.id || !session.user.role) {
    return null
  }

  const dbUser = await prisma.adminUser.findUnique({ where: { id: session.user.id } })

  if (!dbUser || dbUser.status !== "ACTIVE" || !dbUser.isHuman) {
    return null
  }

  const user = adminUserFromDb(dbUser)
  return {
    ...user,
    permissions: rolePermissions[user.role],
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
