import type { Metadata } from "next"

import { LaunchesBoard } from "@/components/launch/launches-board"
import { PageHero } from "@/components/shared/page-hero"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { getUpcomingLaunches } from "@/lib/launches"
import type { Locale } from "@/types/space"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const dictionary = getDictionary(locale)
  return {
    title: dictionary.meta.upcomingTitle,
    description: dictionary.pages.upcoming.subtitle,
  }
}

export default async function UpcomingLaunchesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dictionary = getDictionary(locale)
  const launches = getUpcomingLaunches()

  return (
    <>
      <PageHero
        eyebrow={dictionary.pages.upcoming.eyebrow}
        title={dictionary.pages.upcoming.title}
        subtitle={dictionary.pages.upcoming.subtitle}
      />
      <section className="mission-container py-14">
        <LaunchesBoard launches={launches} locale={locale} dictionary={dictionary} mode="upcoming" />
      </section>
    </>
  )
}
