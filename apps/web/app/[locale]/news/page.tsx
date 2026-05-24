import type { Metadata } from "next"

import { NewsCard } from "@/components/content/news-card"
import { DevDataWarning, EmptyState } from "@/components/shared/data-state"
import { PageHero } from "@/components/shared/page-hero"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { getPublishedNews } from "@/lib/public/repository"
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
    title: dictionary.meta.newsTitle,
    description: dictionary.pages.news.subtitle,
  }
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dictionary = getDictionary(locale)
  const result = await getPublishedNews()
  const newsItems = result.items

  return (
    <>
      <PageHero
        eyebrow={dictionary.pages.news.eyebrow}
        title={dictionary.pages.news.title}
        subtitle={dictionary.pages.news.subtitle}
      />
      <section className="mission-container grid gap-5 py-14 lg:grid-cols-2">
        {result.source === "mock_fallback" ? <DevDataWarning /> : null}
        {newsItems.length > 0 ? (
          newsItems.map((item) => (
            <NewsCard key={item.id} item={item} locale={locale} dictionary={dictionary} />
          ))
        ) : (
          <EmptyState
            title="No published news"
            description="Approved and published news records from PostgreSQL will appear here."
          />
        )}
      </section>
    </>
  )
}
