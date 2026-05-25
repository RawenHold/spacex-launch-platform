import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { z } from "zod"

import { rolePermissions } from "@/lib/admin/permissions"
import { fromPrismaRole } from "@/lib/admin/prisma-mappers"
import { verifyPassword } from "@/lib/admin/password"
import { prisma } from "@/lib/db"
import { getServerEnv } from "@/lib/server/env"
import { logger } from "@/lib/server/logger"

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(256),
})

const env = getServerEnv()

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  trustHost: env.AUTH_TRUST_HOST ?? true,
  useSecureCookies: process.env.NODE_ENV === "production",
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials)

        if (!parsed.success) {
          logger.warn("admin_sign_in_failed", { reason: "invalid_payload" })
          return null
        }

        const user = await prisma.adminUser.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        })

        if (!user || !user.isHuman || user.status !== "ACTIVE" || !user.passwordHash) {
          logger.warn("admin_sign_in_failed", { reason: "invalid_credentials_or_inactive" })
          return null
        }

        const validPassword = verifyPassword(parsed.data.password, user.passwordHash)

        if (!validPassword) {
          logger.warn("admin_sign_in_failed", { reason: "invalid_credentials" })
          return null
        }

        const role = fromPrismaRole(user.role)

        await prisma.$transaction(async (tx) => {
          await tx.adminUser.update({
            where: { id: user.id },
            data: { lastActiveAt: new Date() },
          })
          await tx.auditLog.create({
            data: {
              actorId: user.id,
              action: "SIGN_IN",
              entityType: "ADMIN_USER",
              entityId: user.id,
              metadata: { provider: "credentials" },
            },
          })
        })
        logger.info("admin_sign_in_succeeded", { actorId: user.id, role })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role,
          permissions: rolePermissions[role],
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? ""
        token.role = user.role
        token.permissions = user.permissions
      }

      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.permissions = token.permissions
      }

      return session
    },
  },
})
