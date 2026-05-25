import type { MetadataRoute } from "next"

import { prisma } from "@/lib/db"
import { supportedLocales } from "@/lib/i18n/config"

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://spacex.example").replace(/\/$/, "")
}

function localized(path: string) {
  const base = siteUrl()
  return supportedLocales.map((locale) => ({
    url: `${base}/${locale}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.7,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    ...localized(""),
    ...localized("/launches"),
    ...localized("/launches/upcoming"),
    ...localized("/launches/past"),
    ...localized("/calendar"),
    ...localized("/articles"),
    ...localized("/news"),
    ...localized("/faq"),
  ]

  try {
    const launches = await prisma.launch.findMany({
      where: {
        publishStatus: "PUBLISHED",
        isPublished: true,
      },
      select: {
        slug: true,
        updatedAt: true,
        launchDateTimeUtc: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 500,
    })

    const launchPages = launches.flatMap((launch) =>
      supportedLocales.map((locale) => ({
        url: `${siteUrl()}/${locale}/launches/${launch.slug}`,
        lastModified: launch.updatedAt,
        changeFrequency: "daily" as const,
        priority: launch.launchDateTimeUtc.getTime() >= Date.now() ? 0.9 : 0.6,
      }))
    )

    return [...staticPages, ...launchPages]
  } catch {
    return staticPages
  }
}
