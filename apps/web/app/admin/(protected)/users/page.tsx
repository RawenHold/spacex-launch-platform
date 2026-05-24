import { UserPlus } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { requireAdminRole } from "@/lib/admin/auth"
import {
  createAdminUserAction,
  updateAdminUserRoleAction,
  updateAdminUserStatusAction,
} from "@/lib/admin/actions"
import { getAdminRepository } from "@/lib/admin/repository"
import type { AdminUser } from "@/types/admin"

const humanRoles = ["admin", "editor", "researcher"] as const
const statuses = ["active", "disabled", "invited"] as const

function statusVariant(status: AdminUser["status"]) {
  if (status === "active") return "success"
  if (status === "disabled") return "danger"
  return "warning"
}

export default async function AdminUsersPage() {
  await requireAdminRole(["admin"])
  const repository = getAdminRepository()
  const users = await repository.listUsers()

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8">
      <AdminPageHeader
        eyebrow="Access"
        title="Admin users"
        description="Admin-only role and status management. Invitation email delivery is not implemented yet; created records can be marked invited."
        actions={
          <button
            type="submit"
            form="create-admin-user-form"
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            <UserPlus data-icon aria-hidden="true" />
            Create invited user
          </button>
        }
      />

      <section className="mission-panel rounded-lg p-5">
        <p className="mission-eyebrow">Invite placeholder</p>
        <h2 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
          Create admin user record
        </h2>
        <form id="create-admin-user-form" action={createAdminUserAction} className="mt-5 grid gap-4 lg:grid-cols-4">
          <input name="name" placeholder="Name" required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <input name="email" type="email" placeholder="admin@example.com" required className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm" />
          <select name="role" defaultValue="editor" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            {humanRoles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <select name="status" defaultValue="invited" className="h-10 rounded-lg border border-input bg-background/60 px-3 text-sm">
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </form>
      </section>

      <section className="mission-panel rounded-lg p-5">
        <div className="mb-5">
          <p className="mission-eyebrow">Users</p>
          <h2 className="mt-2 text-xl font-black uppercase tracking-[0.08em]">
            Role matrix
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                <th className="border-b border-border/70 p-3">User</th>
                <th className="border-b border-border/70 p-3">Role</th>
                <th className="border-b border-border/70 p-3">Status</th>
                <th className="border-b border-border/70 p-3">Created</th>
                <th className="border-b border-border/70 p-3">Updated</th>
                <th className="border-b border-border/70 p-3">Last login</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="align-top">
                  <td className="border-b border-border/50 p-3">
                    <p className="font-semibold text-foreground">{user.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {user.email ?? "system identity"}
                    </p>
                    {!user.isHuman ? <Badge variant="info">system</Badge> : null}
                  </td>
                  <td className="border-b border-border/50 p-3">
                    {user.isHuman ? (
                      <form action={updateAdminUserRoleAction} className="flex flex-col gap-2">
                        <input type="hidden" name="id" value={user.id} />
                        <Badge variant="outline">{user.role}</Badge>
                        <select name="role" defaultValue={user.role} className="h-9 rounded-lg border border-input bg-background/60 px-2 text-xs">
                          {humanRoles.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                        <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
                          Save role
                        </button>
                      </form>
                    ) : (
                      <Badge variant="info">{user.role}</Badge>
                    )}
                  </td>
                  <td className="border-b border-border/50 p-3">
                    {user.isHuman ? (
                      <form action={updateAdminUserStatusAction} className="flex flex-col gap-2">
                        <input type="hidden" name="id" value={user.id} />
                        <Badge variant={statusVariant(user.status)}>{user.status}</Badge>
                        <select name="status" defaultValue={user.status} className="h-9 rounded-lg border border-input bg-background/60 px-2 text-xs">
                          {statuses.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <button type="submit" className={buttonVariants({ variant: "outline", size: "sm" })}>
                          Save status
                        </button>
                      </form>
                    ) : (
                      <Badge variant={statusVariant(user.status)}>{user.status}</Badge>
                    )}
                  </td>
                  <td className="border-b border-border/50 p-3 font-mono text-xs text-muted-foreground">
                    {user.createdAt ? new Date(user.createdAt).toISOString() : "unknown"}
                  </td>
                  <td className="border-b border-border/50 p-3 font-mono text-xs text-muted-foreground">
                    {user.updatedAt ? new Date(user.updatedAt).toISOString() : "unknown"}
                  </td>
                  <td className="border-b border-border/50 p-3 font-mono text-xs text-muted-foreground">
                    {user.lastActiveAt ? new Date(user.lastActiveAt).toISOString() : "never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
