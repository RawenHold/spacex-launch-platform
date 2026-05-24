import type { Metadata } from "next"

import { ArticlesBoard } from "@/components/content/articles-board"
import { PageHero } from "@/components/shared/page-hero"
import { articles } from "@/data/mock-data"
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
    title: dictionary.meta.articlesTitle,
    description: dictionary.pages.articles.subtitle,
  }
}

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>
}) {
  const { locale } = await params
  const dictionary = getDictionary(locale)

  return (
    <>
      <PageHero
        eyebrow={dictionary.pages.articles.eyebrow}
        title={dictionary.pages.articles.title}
        subtitle={dictionary.pages.articles.subtitle}
      />
      <section className="mission-container py-14">
        <ArticlesBoard articles={articles} locale={locale} dictionary={dictionary} />
      </section>
    </>
  )
}
