import type { DefaultSession } from "next-auth"
import type { JWT as DefaultJWT } from "next-auth/jwt"

import type { AdminPermission, AdminRole } from "@/types/admin"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: AdminRole
      permissions: AdminPermission[]
    } & DefaultSession["user"]
  }

  interface User {
    role: AdminRole
    permissions: AdminPermission[]
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    role: AdminRole
    permissions: AdminPermission[]
  }
}
