import type { Metadata } from "next"

import { CalendarBoard } from "@/components/calendar/calendar-board"
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
    title: dictionary.meta.calendarTitle,
    description: dictionary.pages.calendar.subtitle,
  }
}

export default async function CalendarPage({
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
        eyebrow={dictionary.pages.calendar.eyebrow}
        title={dictionary.pages.calendar.title}
        subtitle={dictionary.pages.calendar.subtitle}
      />
      <section className="mission-container py-14">
        <CalendarBoard launches={launches} locale={locale} dictionary={dictionary} />
      </section>
    </>
  )
}
