import { redirect } from "next/navigation"

import type { Locale } from "@/types/space"

export default async function LaunchesIndexPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  redirect(`/${locale}/launches/upcoming`)
}
