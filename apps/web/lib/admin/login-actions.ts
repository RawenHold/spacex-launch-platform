"use server"

import { AuthError } from "next-auth"
import { redirect } from "next/navigation"

import { signIn, signOut } from "@/auth"
import { enforceLoginRateLimit } from "@/lib/admin/rate-limit"
import { RateLimitError } from "@/lib/rate-limit"
import { logger } from "@/lib/server/logger"

export async function adminSignInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "")

  try {
    await enforceLoginRateLimit(email)
    await signIn("credentials", {
      email,
      password: String(formData.get("password") ?? ""),
      redirectTo: "/admin",
    })
  } catch (error) {
    if (error instanceof RateLimitError) {
      logger.warn("admin_login_action_rate_limited", { resetAt: error.resetAt.toISOString() })
      redirect("/admin/login?error=rate_limit")
    }

    if (error instanceof AuthError) {
      logger.warn("admin_login_action_failed", { reason: "invalid_credentials" })
      redirect("/admin/login?error=invalid")
    }

    logger.error("admin_login_action_unexpected_error", {
      message: error instanceof Error ? error.message : "Unknown error",
    })
    throw error
  }
}

export async function adminSignOutAction() {
  logger.info("admin_sign_out_requested")
  await signOut({ redirectTo: "/admin/login" })
}
