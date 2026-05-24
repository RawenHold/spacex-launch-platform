"use server"

import { AuthError } from "next-auth"
import { redirect } from "next/navigation"

import { signIn, signOut } from "@/auth"
import { enforceLoginRateLimit } from "@/lib/admin/rate-limit"
import { RateLimitError } from "@/lib/rate-limit"

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
      redirect("/admin/login?error=rate_limit")
    }

    if (error instanceof AuthError) {
      redirect("/admin/login?error=invalid")
    }

    throw error
  }
}

export async function adminSignOutAction() {
  await signOut({ redirectTo: "/admin/login" })
}
