import type { Metadata } from "next"

import { CalendarBoard } from "@/components/calendar/calendar-board"
import { DevDataWarning, EmptyState } from "@/components/shared/data-state"
import { PageHero } from "@/components/shared/page-hero"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { getLaunchCalendarItems } from "@/lib/public/repository"
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
  const result = await getLaunchCalendarItems()
  const launches = result.items

  return (
    <>
      <PageHero
        eyebrow={dictionary.pages.calendar.eyebrow}
        title={dictionary.pages.calendar.title}
        subtitle={dictionary.pages.calendar.subtitle}
      />
      <section className="mission-container py-14">
        {result.source === "mock_fallback" ? <DevDataWarning /> : null}
        {launches.length > 0 ? (
          <CalendarBoard launches={launches} locale={locale} dictionary={dictionary} />
        ) : (
          <EmptyState
            title="No published calendar items"
            description="Publish upcoming launches to populate the public launch calendar."
          />
        )}
      </section>
    </>
  )
}
