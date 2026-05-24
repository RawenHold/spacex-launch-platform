import type { Metadata } from "next"

import { LaunchesBoard } from "@/components/launch/launches-board"
import { PageHero } from "@/components/shared/page-hero"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { getPastLaunches } from "@/lib/launches"
import type { Locale } from "@/types/space"

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
  const launches = getPastLaunches()

  return (
    <>
      <PageHero
        eyebrow={dictionary.pages.past.eyebrow}
        title={dictionary.pages.past.title}
        subtitle={dictionary.pages.past.subtitle}
      />
      <section className="mission-container py-14">
        <LaunchesBoard
          launches={launches}
          locale={locale}
          dictionary={dictionary}
          mode="past"
          includeCategory
        />
      </section>
    </>
  )
}
