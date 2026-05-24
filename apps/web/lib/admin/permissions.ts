import type { AdminPermission, AdminRole } from "@/types/admin"

export const rolePermissions: Record<AdminRole, AdminPermission[]> = {
  admin: [
    "publish",
    "approve",
    "edit_content",
    "manage_sources",
    "manage_timeline",
    "manual_override",
    "manage_settings",
    "generate_ai_drafts",
  ],
  editor: ["edit_content", "manage_timeline", "generate_ai_drafts"],
  researcher: ["manage_sources", "generate_ai_drafts"],
  ai_moderator: ["generate_ai_drafts"],
}

export function roleCan(role: AdminRole, permission: AdminPermission): boolean {
  return rolePermissions[role].includes(permission)
}

export function roleCanAny(role: AdminRole, permissions: AdminPermission[]): boolean {
  return permissions.some((permission) => roleCan(role, permission))
}
