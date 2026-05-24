import type { Metadata } from "next"

import { LaunchesBoard } from "@/components/launch/launches-board"
import { DevDataWarning, EmptyState } from "@/components/shared/data-state"
import { PageHero } from "@/components/shared/page-hero"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { getPublishedUpcomingLaunches } from "@/lib/public/repository"
import type { Locale } from "@/types/space"

export const dynamic = "force-dynamic"

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
  const result = await getPublishedUpcomingLaunches()
  const launches = result.items

  return (
    <>
      <PageHero
        eyebrow={dictionary.pages.upcoming.eyebrow}
        title={dictionary.pages.upcoming.title}
        subtitle={dictionary.pages.upcoming.subtitle}
      />
      <section className="mission-container py-14">
        {result.source === "mock_fallback" ? <DevDataWarning /> : null}
        {launches.length > 0 ? (
          <LaunchesBoard launches={launches} locale={locale} dictionary={dictionary} mode="upcoming" />
        ) : (
          <EmptyState
            title="No published upcoming launches"
            description="Only published database records are public. Create and publish an upcoming launch from the admin panel to populate this page."
          />
        )}
      </section>
    </>
  )
}
