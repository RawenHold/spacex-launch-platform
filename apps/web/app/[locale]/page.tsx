import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon, BellIcon, RadioIcon } from "lucide-react"

import { ArticleCard } from "@/components/content/article-card"
import { FAQAccordion } from "@/components/content/faq-accordion"
import { NewsCard } from "@/components/content/news-card"
import { AddReminderButton } from "@/components/launch/add-reminder-button"
import { Countdown } from "@/components/launch/countdown"
import { LaunchAnimation2D } from "@/components/launch/launch-animation-2d"
import { LaunchCard } from "@/components/launch/launch-card"
import { MissionTimeline } from "@/components/launch/mission-timeline"
import { PageHero } from "@/components/shared/page-hero"
import { SectionHeader } from "@/components/shared/section-header"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { articles, faqs, newsItems } from "@/data/mock-data"
import { getPastLaunches, getUpcomingLaunches, getNextLaunch } from "@/lib/launches"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { localize } from "@/lib/i18n/config"
import type { Locale } from "@/types/space"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const dictionary = getDictionary(locale)
  return {
    title: dictionary.meta.homeTitle,
    description: dictionary.meta.homeDescription,
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dictionary = getDictionary(locale)
  const nextLaunch = getNextLaunch()
  const upcoming = getUpcomingLaunches()
  const past = getPastLaunches()

  return (
    <>
      <PageHero
        eyebrow={dictionary.home.eyebrow}
        title={dictionary.home.title}
        subtitle={dictionary.home.subtitle}
        className="min-h-[calc(100vh-4rem)]"
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-end">
          <div className="flex flex-wrap gap-3">
            <a className={buttonVariants({ variant: "default", size: "lg" })} href="#watch">
              <RadioIcon data-icon="inline-start" />
              {dictionary.common.watchOnline}
            </a>
            <Link
              className={buttonVariants({ variant: "outline", size: "lg" })}
              href={`/${locale}/launches/${nextLaunch.slug}`}
            >
              {dictionary.common.missionDetails}
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
            <AddReminderButton
              label={dictionary.common.addReminder}
              addedLabel={dictionary.common.reminderAdded}
            />
          </div>
          <Card>
            <CardHeader>
              <p className="mission-eyebrow">{dictionary.home.nextLaunch}</p>
              <CardTitle>{localize(nextLaunch.missionName, locale)}</CardTitle>
            </CardHeader>
            <CardContent>
              <Countdown targetUtc={nextLaunch.netUtc} labels={dictionary.countdown} />
            </CardContent>
          </Card>
        </div>
      </PageHero>

      <section className="mission-container py-14">
        <LaunchAnimation2D
          title={dictionary.detail.animationTitle}
          description={dictionary.detail.animationDescription}
          vehicle={nextLaunch.category === "starship" ? "starship" : "falcon"}
          demo
        />
      </section>

      <section className="mission-container flex flex-col gap-6 py-14" id="watch">
        <SectionHeader title={dictionary.home.nextLaunch} description={dictionary.common.mockWarning} />
        <LaunchCard launch={nextLaunch} locale={locale} dictionary={dictionary} />
      </section>

      <section className="mission-container flex flex-col gap-6 py-14">
        <SectionHeader title={dictionary.home.timelinePreview} />
        <MissionTimeline
          events={nextLaunch.timeline.slice(0, 5)}
          locale={locale}
          dictionary={dictionary}
          activeIndex={1}
        />
      </section>

      <section className="mission-container flex flex-col gap-6 py-14">
        <SectionHeader
          title={dictionary.home.upcomingPreview}
          href={`/${locale}/launches/upcoming`}
          actionLabel={dictionary.common.moreInformation}
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {upcoming.slice(0, 3).map((launch) => (
            <LaunchCard key={launch.id} launch={launch} locale={locale} dictionary={dictionary} />
          ))}
        </div>
      </section>

      <section className="mission-container flex flex-col gap-6 py-14">
        <SectionHeader
          title={dictionary.home.pastPreview}
          href={`/${locale}/launches/past`}
          actionLabel={dictionary.common.moreInformation}
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {past.slice(0, 3).map((launch) => (
            <LaunchCard key={launch.id} launch={launch} locale={locale} dictionary={dictionary} mode="past" />
          ))}
        </div>
      </section>

      <section className="mission-container grid gap-8 py-14 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <SectionHeader
            title={dictionary.home.articlesPreview}
            href={`/${locale}/articles`}
            actionLabel={dictionary.common.readMore}
          />
          <div className="grid gap-5">
            {articles.slice(0, 2).map((article) => (
              <ArticleCard key={article.id} article={article} locale={locale} dictionary={dictionary} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <SectionHeader
            title={dictionary.home.newsPreview}
            href={`/${locale}/news`}
            actionLabel={dictionary.common.readMore}
          />
          <div className="grid gap-5">
            {newsItems.map((item) => (
              <NewsCard key={item.id} item={item} locale={locale} dictionary={dictionary} />
            ))}
          </div>
        </div>
      </section>

      <section className="mission-container flex flex-col gap-6 py-14">
        <SectionHeader
          title={dictionary.home.faqPreview}
          href={`/${locale}/faq`}
          actionLabel={dictionary.common.moreInformation}
        />
        <FAQAccordion items={faqs.slice(0, 4)} locale={locale} dictionary={dictionary} />
      </section>

      <section className="mission-container py-14">
        <Card>
          <CardHeader>
            <p className="mission-eyebrow">{dictionary.common.mockNotice}</p>
            <CardTitle className="flex items-center gap-2">
              <BellIcon className="size-5 text-signal-amber" aria-hidden="true" />
              {dictionary.common.mockWarning}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>
    </>
  )
}
