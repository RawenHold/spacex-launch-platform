import type { Metadata } from "next"

import { LaunchesBoard } from "@/components/launch/launches-board"
import { DevDataWarning, EmptyState } from "@/components/shared/data-state"
import { PageHero } from "@/components/shared/page-hero"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { getPublishedPastLaunches } from "@/lib/public/repository"
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
    title: dictionary.meta.pastTitle,
    description: dictionary.pages.past.subtitle,
  }
}

export default async function PastLaunchesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dictionary = getDictionary(locale)
  const result = await getPublishedPastLaunches()
  const launches = result.items

  return (
    <>
      <PageHero
        eyebrow={dictionary.pages.past.eyebrow}
        title={dictionary.pages.past.title}
        subtitle={dictionary.pages.past.subtitle}
      />
      <section className="mission-container py-14">
        {result.source === "mock_fallback" ? <DevDataWarning /> : null}
        {launches.length > 0 ? (
          <LaunchesBoard
            launches={launches}
            locale={locale}
            dictionary={dictionary}
            mode="past"
            includeCategory
          />
        ) : (
          <EmptyState
            title="No published past launches"
            description="Past launches appear only after published database records have dates in the past."
          />
        )}
      </section>
    </>
  )
}
