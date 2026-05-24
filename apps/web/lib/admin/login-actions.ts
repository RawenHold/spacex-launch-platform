"use server"

import { AuthError } from "next-auth"

import { signIn, signOut } from "@/auth"

export async function adminSignInAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/admin",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return
    }

    throw error
  }
}

export async function adminSignOutAction() {
  await signOut({ redirectTo: "/admin/login" })
}
