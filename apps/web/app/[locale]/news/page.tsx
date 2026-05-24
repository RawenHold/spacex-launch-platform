import type { Metadata } from "next"

import { NewsCard } from "@/components/content/news-card"
import { PageHero } from "@/components/shared/page-hero"
import { newsItems } from "@/data/mock-data"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/types/space"

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

  return (
    <>
      <PageHero
        eyebrow={dictionary.pages.news.eyebrow}
        title={dictionary.pages.news.title}
        subtitle={dictionary.pages.news.subtitle}
      />
      <section className="mission-container grid gap-5 py-14 lg:grid-cols-2">
        {newsItems.map((item) => (
          <NewsCard key={item.id} item={item} locale={locale} dictionary={dictionary} />
        ))}
      </section>
    </>
  )
}
